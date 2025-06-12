import {Schema, model} from "mongoose";

const customerSchema = new Schema({
    name: {
        type: String, required: true
    },
    email: {
        type: String, required: true
    },
    password: {
        type: String, required: true, select: false
    },
    method: {
        type: String, required: true
    },
    role: {
        type: String, required: false
    },
    profileImages: {
        url: {type: String},
        public_id: {type: String}
    },
    wishlist: [
        {
            productId: {
                type: Schema.Types.ObjectId,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            images: {
                type: Array,
                required: true
            },
        }
    ]
}, {timestamps: true})

export default model('customers', customerSchema)