import React, {useEffect, useState} from 'react';
import {io} from 'socket.io-client';
import {v4 as uuid} from 'uuid'

let customerId = ''
if (typeof window != 'undefined'){
    customerId = localStorage.getItem('chatUserId') || uuid()
    localStorage.setItem('chatUserId', customerId)
}
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000')

const ChatCustomer = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [users, setUsers] = useState([])
  const [active, setActive] = useState('')

  useEffect(() => {
    socket.emit('register-admin')

    socket.emit('get-all-users', (usersFromServer) => {
      console.log(usersFromServer)
      setUsers(usersFromServer)
    })
  }, [])

  useEffect(() => {
    console.log(active)
    const handleCustomer = (msg) => {

      if(msg.userId === active.userId){
        setMessages(prev => [...prev, msg])
      }
    }

    const handleAdmin = (msg) => {
      if(msg.userId === active.userId){
        setMessages(prev => [...prev, msg])
      }
    }

    socket.on('customer-message', handleCustomer)
    socket.on('admin-message', handleAdmin)

    return () => {
      socket.off('customer-message', handleCustomer)
      socket.off('admin-message', handleAdmin)
    }
  }, [active])


  useEffect(() => {
    if(!active) return
    socket.emit('get-history', active.userId, (history) => setMessages(history))
  }, [active])

  const send = (e) => {
    e.preventDefault()
    if(!text.trim() || !active) return

    console.log(active.userName, active.userEmail)
    console.log(active)
    socket.emit('admin-message', {text, userId: active.userId, userName: active.userName, userEmail: active.userEmail})
    setText('')
  }

  return(
    <div className='px-2 lg:px-7 py-5'>
      <div className='w-full bg-[#6a5fdf] px-4 py-4 rounded-md h-[calc(100vh-140px)]'>
        <div className='flex h-full'>
        <div className='w-40 bg-[#475569] text-white p-2 overflow-y-auto mr-2 rounded'>
            {
              users.map(u => (
                <div key = {u} className={`p-2 cursor-pointer ${u === active ? 'bg-blue-500' : ''}`} onClick={() => setActive(u)}>
                  {u.userName}
                  <div className='text-xs text-gray-300'>{u.userEmail}</div>
                  <div className='text-xs text-gray-300'>{u.userId}</div>
                </div>
              ))
            }
          </div>

            <div className='flex-1 flex flex-col'>
              <div className='flex-1 overflow-y-auto mb-2 bg-[#475569] p-3 rounded'>
                {messages.map((m, i) => (
                  <div key = {i} className={`w-full flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'} mb-1`}>
                    <div className='bg-white text-black px-2 py-1 rounded max-w-[70%]'>
                      {m.message}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={send} className='flex gap-2'>
                <input value = {text} onChange={e => setText(e.target.value)} className='flex-1 px-2 py-1 rounded text-black' placeholder='Type message'/>
                <button className='bg-blue-500 text-white px-4 rounded'>Send</button>
              </form>
            </div>

        </div>
      </div>
    </div>
  )
}

export default ChatCustomer;