import { Schema, model } from "mongoose";

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
    link: {
        type: String,
        default: ''
    },
    sourceId: {
        type: String,
        default: ''
    },
    currency: {
        type: String,
        default: 'USD'
    },
    affiliateLink: {
        type: String,
        default: ''
    },
    productType: {
        type: String,
        default: 'standard'
    },
    shippingDestination: {
        type: String,
        default: 'both' // 'canada_only', 'us_only', 'both'
    },
    colors: {
        type: [String],
        default: []
    },
    colorImages: {
        type: [String],
        default: []
    },
    colorImageFingerprints: {
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
    stock: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    deliveryTime: {
        type: String,
        default: ''
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
    videos: {
        type: [String],
        default: []
    },
    imageFingerprints: {
        type: [String],
        default: []
    },
    colorPrices: {
        type: [Number],
        default: []
    },
    ratings: [
        {
            user: { type: Schema.Types.ObjectId, ref: 'Customer' },
            userImage: {
                public_id: { type: String },
                url: { type: String }
            },
            name: { type: String, required: false },
            rating: { type: Number, required: true, min: 1, max: 5 },
            comment: String,
            images: { type: [Schema.Types.Mixed], default: [] },
            reviewDate: { type: Date },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
            isEdited: { type: Boolean, default: false }
        }
    ],
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isHidden: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

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