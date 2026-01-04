/* eslint-disable no-undef */
import { useEffect, useState, useContext, useRef } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { AuthContext } from "../context/AuthContext";
import api from '../src/api/api';

const ChatCustomer = () => {
  const { user } = useContext(AuthContext)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([]) // Socket messages (Support)
  const [aiMessages, setAiMessages] = useState([]) // AI messages
  const [mode, setMode] = useState('ai') // 'support' | 'ai'
  const [text, setText] = useState('')
  const [hasMounted, setHasMounted] = useState(false)

  const [isConnecting, setIsConnecting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [unread, setUnread] = useState(false);
  const socketRef = useRef(null)

  // Initialize Socket (Support Mode)
  const initializeChat = async () => {
    if (socketRef.current) return;

    setIsConnecting(true);

    const { io } = await import("socket.io-client");

    let stored = localStorage.getItem('chatUserId')
    let id = user?.id || stored || 'GuestID-' + Math.random().toString(36).substring(2);
    if (!stored || user?.id) {
      localStorage.setItem('chatUserId', id)
    }

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      query: { userId: id, userName: user?.name || 'guest', userEmail: user?.email || 'guest-email' }
    });

    socketRef.current = socket;

    socket.emit('get-history', id, (history) => setMessages(history))

    socket.on('customer-message', (msg) => setMessages(prev => [...prev, msg]))
    socket.on('admin-message', (msg) => {
      setMessages(prev => [...prev, msg])
      if (!open) {
        setUnread(true)
      }
    })

    setIsConnecting(false);
  }

  const handleOpenChat = () => {
    setOpen(true);
    setUnread(false);
    if (mode === 'support') {
      initializeChat();
    }
  }

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      setUnread(localStorage.getItem('customerChatUnread') === 'true')
    }

    // Default welcome message for AI
    setAiMessages([
      {
        sender: 'ai',
        message: "Hi! I'm your AI assistant. Ask me anything about our figures!",
        products: []
      }
    ]);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    }
  }, [])

  // Switch modes
  const switchMode = (newMode) => {
    setMode(newMode);
    if (newMode === 'support') {
      initializeChat();
    }
  }

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (mode === 'support') {
      if (!socketRef.current) return;
      socketRef.current.emit('customer-message', { text });
    } else {
      // AI Mode
      const userMsg = { sender: 'customer', message: text };
      setAiMessages(prev => [...prev, userMsg]);
      setIsAiLoading(true);

      try {
        const { data } = await api.post('/ai-chat', { message: text });

        const aiMsg = {
          sender: 'ai',
          message: data.text,
          products: data.products || []
        };
        setAiMessages(prev => [...prev, aiMsg]);
      } catch (err) {
        console.error("AI Chat Error:", err);
        setAiMessages(prev => [...prev, { sender: 'ai', message: "Sorry, I'm having trouble connecting right now." }]);
      } finally {
        setIsAiLoading(false);
      }
    }
    setText('');
  }

  if (!hasMounted) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-sans">
      {open ? (
        <div className="bg-white w-80 h-[500px] shadow-2xl rounded-xl flex flex-col border border-[#DCA54A] overflow-hidden">
          {/* Header */}
          <div className="bg-[#DCA54A] text-white">
            <div className="flex justify-between items-center px-4 py-2">
              <span className="font-semibold text-sm">💬 Chat with us</span>
              <button className="text-white text-lg font-bold hover:text-red-200" onClick={() => setOpen(false)}>×</button>
            </div>
            {/* Tabs */}
            <div className="flex text-xs font-medium w-full" style={{ minHeight: '35px' }}>
              <button
                id="ai-tab-btn"
                onClick={() => switchMode('ai')}
                className={`flex-1 py-2 text-center transition-colors border-b-2 ${mode === 'ai' ? 'bg-white text-[#DCA54A] border-[#DCA54A]' : 'bg-[#DCA54A] text-white border-transparent hover:bg-[#cfa055]'}`}
              >
                🤖 AI Assistant
              </button>
              <button
                onClick={() => switchMode('support')}
                className={`flex-1 py-2 text-center transition-colors border-b-2 ${mode === 'support' ? 'bg-white text-[#DCA54A] border-[#DCA54A]' : 'bg-[#DCA54A] text-white border-transparent hover:bg-[#cfa055]'}`}
              >
                👤 Support
              </button>
            </div>
          </div>

          <div className="flex-1 px-3 py-2 overflow-y-auto bg-gray-50 flex flex-col gap-2">

            {mode === 'support' ? (
              <>
                {isConnecting && <p className="text-center text-xs text-gray-500">Connecting to support...</p>}
                {messages.map((m, i) => (
                  <div key={i} className={`text-sm flex ${m.sender === "admin" ? "justify-start" : "justify-end"}`}>
                    <span className={`max-w-[85%] px-3 py-1 rounded-xl break-words ${m.sender === "admin" ? "bg-gray-200 text-gray-800" : "bg-[#DCA54A] text-white"}`}>
                      {m.message}
                    </span>
                  </div>
                ))}
                <div className="text-xs text-gray-500 text-center mb-2 mt-auto pt-4">
                  ⏳ Admin replies may take up to 24–48 hours.
                </div>
              </>
            ) : (
              <>
                {aiMessages.map((m, i) => (
                  <div key={i} className={`flex flex-col gap-1 ${m.sender === "ai" ? "items-start" : "items-end"}`}>
                    <div className={`text-sm max-w-[85%] px-3 py-2 rounded-xl break-words shadow-sm ${m.sender === "ai" ? "bg-white border border-gray-100 text-gray-800" : "bg-[#DCA54A] text-white"}`}>
                      {m.message}
                    </div>

                    {/* Product Cards for AI responses */}
                    {m.products && m.products.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto w-full py-2 px-1">
                        {m.products.map(p => (
                          <Link href={`/shop/${p._id}-${p.slug || 'product'}`} key={p._id} className="min-w-[120px] w-[120px] bg-white rounded-lg shadow border border-gray-100 hover:shadow-md transition-shadow flex-shrink-0 flex flex-col no-underline text-black">
                            <div className="relative w-full h-24 bg-gray-100 rounded-t-lg overflow-hidden">
                              <Image
                                src={p.images?.[0] || 'https://placehold.co/400'}
                                alt={p.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="p-2 flex flex-col flex-1">
                              <p className="text-[10px] font-bold line-clamp-2 leading-tight mb-1">{p.name}</p>
                              <p className="text-[10px] text-green-600 font-semibold mt-auto">
                                ${p.effectivePrice || p.price} {p.currency}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isAiLoading && (
                  <div className="text-sm flex justify-start">
                    <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-xl">
                      Thinking...
                    </span>
                  </div>
                )}
              </>
            )}

          </div>

          <form onSubmit={send} className="p-2 flex gap-2 border-t border-gray-200 bg-white">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md border text-sm border-gray-300 focus:outline-none focus:border-[#DCA54A]"
              placeholder={mode === 'ai' ? "Ask about figures..." : "Message support..."}
              disabled={isConnecting || (mode === 'ai' && isAiLoading)}
            />
            <button
              disabled={isConnecting || (mode === 'ai' && isAiLoading)}
              className="bg-[#DCA54A] text-white text-sm px-4 py-1 rounded-md hover:brightness-110 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      ) : (
        <button
          className="bg-[#DCA54A] text-white p-4 rounded-full shadow-lg hover:brightness-110 relative transition-transform hover:scale-105"
          onClick={handleOpenChat}
          aria-label="Chat with us"
          onMouseEnter={() => {
            // Optional: Pre-connect if needed, but usually click is fine
          }}
        >
          {/* Simple Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          {unread && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow animate-pulse">New</span>
          )}
        </button>
      )}
    </div>
  );
}

export default ChatCustomer;
