import { Schema, model } from "mongoose";

const couponSchema = new Schema({
    code : {type: String, required: true, unique: true},
    discount: {type: Number, required: true},
    maxUses: {type: Number, required: true},
    used: {type: Number, default: 0}
}, {timestamps: true});

export default model('Coupon', couponSchema)