import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuid } from 'uuid';

let customerId = '';
if (typeof window !== 'undefined') {
  customerId = localStorage.getItem('chatUserId') || uuid();
  localStorage.setItem('chatUserId', customerId);
}
const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
console.log('Socket URL:', process.env.REACT_APP_SOCKET_URL);

const ChatCustomer = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [users, setUsers] = useState([]);
  const [active, setActive] = useState('');
  const messagesEndRef = useRef(null);

  const [unread, setUnread] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('adminChatUnread');
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });

  useEffect(() => {
    socket.emit('register-admin');
    socket.emit('get-all-users', (usersFromServer) => {
      setUsers(usersFromServer);
    });
  }, []);

  useEffect(() => {
    const handleCustomer = (msg) => {
      if (msg.userId === active.userId) {
        setMessages((prev) => [...prev, msg]);
      } else {
        setUnread((prev) => {
          const updated = { ...prev, [msg.userId]: true };
          localStorage.setItem('adminChatUnread', JSON.stringify(updated));
          return updated;
        });
      }

      setUsers((prev) => {
        if (!prev.find((u) => u.userId === msg.userId)) {
          return [...prev, { userId: msg.userId, userName: msg.userName, userEmail: msg.userEmail }];
        }
        return prev;
      });
    };

    const handleAdmin = (msg) => {
      if (msg.userId === active.userId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('customer-message', handleCustomer);
    socket.on('admin-message', handleAdmin);

    return () => {
      socket.off('customer-message', handleCustomer);
      socket.off('admin-message', handleAdmin);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    socket.emit('get-history', active.userId, (history) => setMessages(history));
  }, [active]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;

    socket.emit('admin-message', {
      text,
      userId: active.userId,
      userName: active.userName,
      userEmail: active.userEmail,
    });
    setText('');
  };

  return (
    <div className="px-2 lg:px-7 py-5">
  <div className="w-full bg-[#f0f4f8] px-4 py-4 rounded-md h-[calc(100vh-140px)] shadow-lg">
    <div className="flex h-full">

      {/* User List */}
      <div className="w-60 bg-[#1e293b] text-white p-2 overflow-y-auto mr-3 rounded-lg shadow-md">
        {users.map((u) => (
          <div
            key={u.userId}
            className={`p-2 rounded cursor-pointer transition-all duration-200 ${
              u.userId === active?.userId ? 'bg-indigo-500' : 'hover:bg-slate-600'
            }`}
            onClick={() => {
              setActive(u);
              setUnread((prev) => {
                const updated = { ...prev };
                delete updated[u.userId];
                localStorage.setItem('adminChatUnread', JSON.stringify(updated));
                return updated;
              });
            }}
          >
            <div className="flex justify-between items-center text-sm font-semibold">
              <span>{u.userName}</span>
              {unread[u.userId] && <span className="text-red-400 text-xs ml-2">(new)</span>}
            </div>
            <div className="text-xs text-slate-300 truncate">{u.userEmail}</div>
          </div>
        ))}
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto bg-white p-4 rounded-lg space-y-2 border border-gray-200">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`w-full flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-4 py-2 rounded-xl max-w-[70%] break-words shadow-sm ${
                  m.sender === 'admin'
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {m.message}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={send} className="flex gap-2 mt-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Type a message"
          />
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition">
            Send
          </button>
        </form>
      </div>
    </div>
  </div>
</div>
  );
};

export default ChatCustomer;
