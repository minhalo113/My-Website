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
    const socketRef = useRef(null)
    useEffect(() => {
        if(typeof window === 'undefined') return;

        let id = user?.id || 'GuestID-' + Math.random().toString(36).substring(2);
        localStorage.setItem('chatUserId', id);

        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
            query: { userId: id, userName: user?.name || 'guest', userEmail: user?.email || 'guest-email' }
          });
        
        socketRef.current = socket;

        socket.emit('get-history', id, (history) => setMessages(history))

        const handleCustomer = (msg) => setMessages(prev => [...prev, msg])
        const handleAdmin = (msg) => setMessages(prev => [...prev, msg])
        
        socket.on('customer-message', handleCustomer)
        socket.on('admin-message', handleAdmin)

        return() => {
            socket.off('customer-message', handleCustomer)
            socket.off('admin-message', handleAdmin)
            socket.disconnect()
        }
    },[user])

    const send = (e) => {
        e.preventDefault();
        if(!text.trim()) return
        socketRef.current.emit('customer-message', {text})
        setText('')
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            { open ? (
                <div className="bg-white w-72 h-80 shadow-lg rounded flex flex-col">
                    <div className="bg-blue-600 text-white p-2 flex justify-between items-center">
                        <span>Chat with us</span>
                        <button onClick={() => setOpen(false)}>x</button>
                    </div>
                    <div className="flex-1 p-2 overflow-y-auto">
                        {messages.map((m, i) => (
                            <div key = {i} className={`mb-1 text-sm ${m.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                                <span className="inline-block bg-gray-200 px-2 py-1 rounded">{m.message}</span>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={send} className="p-2 flex gap-1">
                        <input value={text} onChange={e => setText(e.target.value)} className='border flex-1 p-1 text-sm' placeholder='Message' />
                        <button className='bg-blue-600 text-white px-3 text-sm rounded'>Send</button>
                    </form>
                </div>
            ) : (
                <button className='bg-blue-600 text-white p-3 rounded-full shadow' onClick={() => setOpen(true)}>
                Chat
              </button>
            )}
        </div>
    )
}

export default ChatCustomer;