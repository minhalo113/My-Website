import mongoose from 'mongoose';

const apiTokenSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        default: ''
    },
    expiresAt: {
        type: Date,
        default: null
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('apiTokens', apiTokenSchema);
