import { Schema, model } from "mongoose";

const scrapedReviewSchema = new Schema({
    productId: {
        type: Schema.ObjectId,
        ref: 'products',
        required: true
    },
    authorThumb: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    date: {
        type: String,
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    reviewImages: {
        type: [String],
        default: []
    },
    harvestedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

export default model('scraped_reviews', scrapedReviewSchema);