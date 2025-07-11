import { useEffect, useState, useContext, useRef } from "react";
import {io} from 'socket.io-client';

import dotenv from "dotenv"
import process from "process"
import { AuthContext } from "../context/AuthContext";
dotenv.config();

const ChatCustomer = () => {    
    const {user} = useContext(AuthContext)
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [text, setText] = useState('')
    const [hasMounted, setHasMounted] = useState(false)

    const [unread, setUnread] = useState(() => {
        if(typeof window !== 'undefined'){
            return localStorage.getItem('customerChatUnread') === 'true'
        }
        return false
    })
    const socketRef = useRef(null)
    useEffect(() => {
        if(typeof window === 'undefined') return;

        let stored = localStorage.getItem('chatUserId')
        let id = user?.id || stored || 'GuestID-' + Math.random().toString(36).substring(2);
        if(!stored || user?.id){
            localStorage.setItem('chatUserId', id)
        }

        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
            query: { userId: id, userName: user?.name || 'guest', userEmail: user?.email || 'guest-email' }
          });
        
        socketRef.current = socket;

        socket.emit('get-history', id, (history) => setMessages(history))

        const handleCustomer = (msg) => setMessages(prev => [...prev, msg])
        const handleAdmin = (msg) => {
            setMessages(prev => [...prev, msg])
            if(!open){
                setUnread(true)
                localStorage.setItem('customerChatUnread','true')
            }
        }
        
        socket.on('customer-message', handleCustomer)
        socket.on('admin-message', handleAdmin)

        return() => {
            socket.off('customer-message', handleCustomer)
            socket.off('admin-message', handleAdmin)
            socket.disconnect()
        }
    },[user])

    useEffect(() => {
        setHasMounted(true);
    }, [])

    const send = (e) => {
        e.preventDefault();
        if(!text.trim()) return
        socketRef.current.emit('customer-message', {text})
        setText('')
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 font-sans">
          {open ? (
            <div className="bg-white w-80 h-96 shadow-2xl rounded-xl flex flex-col border border-[#DCA54A]">

              <div className="bg-[#DCA54A] text-white px-4 py-2 rounded-t-xl flex justify-between items-center">
                <span className="font-semibold text-sm">💬 Chat with us</span>
                <button
                  className="text-white text-lg font-bold hover:text-red-200"
                  onClick={() => {
                    setOpen(false);
                    setUnread(false);
                    localStorage.removeItem("customerChatUnread");
                  }}
                >
                  ×
                </button>
              </div>
      
              <div className="flex-1 px-3 py-2 overflow-y-auto bg-gray-50">
              <div
                className="flex-1 px-3 py-2 overflow-y-auto bg-gray-50"
                style={{ display: 'flex', flexDirection: 'column', rowGap: '8px' }}
                >
                {messages.map((m, i) => (
                    <div
                    key={i}
                    className={`text-sm flex ${
                        m.sender === "admin" ? "justify-start" : "justify-end"
                    }`}
                    >
                    <span
                        className={`max-w-[75%] px-3 py-1 rounded-xl break-words ${
                        m.sender === "admin"
                            ? "bg-gray-200 text-gray-800"
                            : "bg-[#DCA54A] text-white"
                        }`}
                    >
                        {m.message}
                    </span>
                    </div>
                ))}
                <div className="text-xs text-gray-500 text-center mb-2 mt-1">
                ⏳ Please note: Admin replies may take up to 24–48 hours.
                </div>
                </div>

                </div>

      
              <form onSubmit={send} className="p-2 flex gap-2 border-t border-gray-200">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 px-3 py-1 rounded-md border text-sm border-gray-300 focus:outline-none focus:border-[#DCA54A]"
                  placeholder="Type a message..."
                />
                <button className="bg-[#DCA54A] text-white text-sm px-4 py-1 rounded-md hover:brightness-110">
                  Send
                </button>
              </form>
            </div>
          ) : (
            <button
              className="bg-[#DCA54A] text-white p-4 rounded-full shadow-lg hover:brightness-110 relative"
              onClick={() => {
                setOpen(true);
                setUnread(false);
                localStorage.removeItem("customerChatUnread");
              }}
            >
              Chat
              {hasMounted && unread && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 rounded-full shadow">
                  New
                </span>
              )}
            </button>
          )}
        </div>
      );      
}

export default ChatCustomer;