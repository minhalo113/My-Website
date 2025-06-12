import { Server } from "socket.io";
import { io } from 'socket.io-client';

let io
const messages = []

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                'http://localhost:3000',
                'http://localhost:3001'
            ],
            credentials: true
        }
    })

    io.on('connection', (socket) => {
        console.log('Socket connected', socket.id)

        socket.on('customer-message', (msg) => {
            const chat = {sender: 'customer', message: msg.text, createdAt: new Date()}
        messages.push(chat)
        io.emit('customer-message', chat)
        })
    
        socket.on('admin-message', (msg) => {
            const chat = {sender: 'admin', nessage: msg.text, createdAt: new Date()}

            messages.push(chat)
            io.emit('admin-message', chat)
        })
    })

    return io
}

export const getIO = () => {
    if(!io){
        throw new Error('Socket not initialized')
    }
    return io
}

export const getMessages = () => messages