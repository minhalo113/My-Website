import {Schema, model} from "mongoose";

const productSchema = new Schema({
    sellerId: {
        type: Schema.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    colors: {
        type: [String],
        default: []
    },
    colorImages: {
        type: [String],
        default: []
    },
    typeImages: {
        type: [String],
        default: []
    },
    types: {
        type: [String],
        default: []
    },
    sizes: {
        type: [String],
        default: []
    },
    price: {
        type: Number,
        required: true
    },
    stock:{
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    shopName: {
        type: String,
        required: true
    },
    images: {
        type: Array,
        required: true
    },
    ratings: [
        {
            user: {type: Schema.Types.ObjectId, ref: 'Customer'},
            userImage: {
                public_id: {type: String},
                url: {type: String}
            },
            name: {type: String, required: false},
            rating: {type: Number, required: true, min: 1, max: 5},
            comment: String,
            createdAt: {type: Date, default: Date.now}
        }
    ],
    averageRating: {type: Number, default: 0},
    reviewCount: {type: Number, default: 0}
}, {timestamps: true})

productSchema.index({
    name: 'text',
    category: 'text',
    brand: 'text',
    description: 'text'
}, {
    weights: {
        name: 5,
        category: 4,
        brand: 3,
        description: 2
    }
})

export default model('products', productSchema);