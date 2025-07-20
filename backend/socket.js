import { Server } from "socket.io";
import Chat from './models/chatModel.js'
import dotenv from 'dotenv'
dotenv.config()

let io
const messages = []

const DASHBOARD_URL = process.env.DASHBOARD_URL
const WEB_URL = process.env.WEB_URL
const GIT_WEB_URL = process.env.GIT_WEB_URL

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                'http://localhost:3000',
                'http://localhost:3001',
                DASHBOARD_URL,
                WEB_URL,
                GIT_WEB_URL
            ],
            credentials: true
        }
    })

    io.on('connection', (socket) => {
        console.log('Socket connected', socket.id)

        const {userId, userName, userEmail} = socket.handshake.query
        if(userId){socket.join(userId)}

        socket.on('register-admin', () => {
            socket.join('admins')
        })

        socket.on('customer-message', async(msg) =>{
            const chat = await Chat.create({
                userName: userName,
                userEmail: userEmail,
                userId: userId || socket.id,
                sender: 'customer',
                message: msg.text
            })

            io.to('admins').emit('customer-message', chat)
            socket.emit('customer-message', chat)
        })

        socket.on('admin-message', async (msg) => {
            if(!msg.userId) return

            const chat = await Chat.create({
                userName: msg.userName,
                userEmail: msg.userEmail,
                userId: msg.userId,
                sender: 'admin',
                message: msg.text
            })

            io.to(msg.userId).emit('admin-message', chat)
            io.to('admins').emit('admin-message', chat)
        })
    
        socket.on('get-history', async(id, cb) => {
            try{
                const history = await Chat.find({userId: id}).sort({createdAt: 1})
                cb(history)
            }catch(err){
                console.log("Error fetching get-history:", err);
                cb([])
            }
        })

        socket.on('get-all-users', async(cb) => {
            try{
                const allChat = await Chat.aggregate([
                    {$sort: {createdAt: -1}},
                    {
                        $group: {
                            _id: '$userId',
                            userName: {$first: '$userName'},
                            userEmail: {$first: '$userEmail'},
                            message: {$first: '$message'},
                            createdAt: {$first: '$createdAt'}
                        }
                    },
                    { 
                        $project: {
                            userId: '$_id',
                            userName: 1,
                            userEmail: 1,
                            message: 1,
                            createdAt: 1,
                            _id: 0
                        }
                    },
                    {$sort: {createdAt: -1}}
                ])
                cb(allChat)
            }catch(err){
                console.log("Error fetching chats:", err);
                cb([])
            }
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