import { Schema, model } from "mongoose";

const chatSchema = new Schema({
    sender: {type: String, required: true},
    message: {type: String, required: true},
    createdAt: {type: Date, default: Date.now}
})

export default model('Chat', chatSchema)