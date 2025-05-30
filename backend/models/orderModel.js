import mongoose, { model, Schema } from "mongoose";

const orderSchema = new Schema({
    customerId: {
        type: Schema.ObjectId,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        required: true        
    },
    products: {
        type: Array,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    payment_status: {
        type: String,
        required: true
    },
    shippingInfo: {
        type: Object,
        required: true
    },
    delivery_status: {
        type: String,
        required: true
    },
    order_status: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
}, {timestamps: true})

export default model("customerOrder", orderSchema)