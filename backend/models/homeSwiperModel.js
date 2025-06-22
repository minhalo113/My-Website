import { Schema, model } from 'mongoose';

const homeSwiperSchema = new Schema({
    image: {
        url: String,
        publicId: String
    },
    link: {type: String, required: true}
}, {timestamps: true})

export default model('homeSwipers', homeSwiperSchema)