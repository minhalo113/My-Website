import { Schema, model } from "mongoose";

const chatSchema = new Schema({
    userName: {type: String},
    userId: {type: String, required: true},
    userEmail: {type: String},
    sender: {type: String, enum: ['customer', 'admin'], required: true},
    message: {type: String, required: true},
    createdAt: {type: Date, default: Date.now, expires: 60 * 60 * 24 * 30}
})

export default model('Chat', chatSchema)