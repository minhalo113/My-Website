import { extractPublicId } from './imageFingerprint.js';

const toPlainObject = (value) => {
    if (!value) return null;
    if (typeof value.toObject === 'function') {
        return value.toObject();
    }
    return value;
};

export const getReviewImageUrl = (image) => {
    if (!image) return '';
    if (typeof image === 'string') {
        return image;
    }
    const plain = toPlainObject(image);
    return (
        plain?.secure_url
        || plain?.url
        || plain?.path
        || ''
    );
};

export const getReviewImagePublicId = (image) => {
    if (!image) return '';
    if (typeof image === 'string') {
        return extractPublicId(image);
    }
    const plain = toPlainObject(image);
    return (
        plain?.public_id
        || plain?.publicId
        || extractPublicId(plain?.secure_url || plain?.url || plain?.path || '')
        || ''
    );
};

export const getReviewImageResourceType = (image) => {
    if (!image || typeof image !== 'object') {
        return 'image';
    }
    const plain = toPlainObject(image);
    return plain?.resource_type || plain?.resourceType || 'image';
};

export const getReviewImageIdentifier = (image) => {
    if (!image) return null;
    if (typeof image === 'string') {
        const trimmed = image.trim();
        return trimmed || null;
    }
    const plain = toPlainObject(image);
    return (
        plain?.identifier
        || plain?.public_id
        || plain?.publicId
        || plain?.asset_id
        || plain?.secure_url
        || plain?.url
        || plain?.path
        || null
    );
};

export const buildStoredReviewImage = (uploadResult) => {
    if (!uploadResult) return null;
    const url = uploadResult.secure_url || uploadResult.url || '';
    if (!url) return null;
    return {
        public_id: uploadResult.public_id,
        asset_id: uploadResult.asset_id,
        url,
        secure_url: uploadResult.secure_url || uploadResult.url || '',
        resource_type: uploadResult.resource_type || 'image',
        identifier: uploadResult.public_id || uploadResult.asset_id || url,
    };
};