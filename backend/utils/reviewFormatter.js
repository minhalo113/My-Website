const toStringSafe = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value.toString === 'function') return value.toString();
    return null;
};

export const maskReviewerName = (value) => {
    const normalized = (typeof value === 'string' ? value : toStringSafe(value))?.trim();
    if (!normalized) {
        return 'Anonymous';
    }

    if (normalized.toLowerCase() === 'anonymous') {
        return 'Anonymous';
    }

    const parts = normalized.split(/\s+/).filter(Boolean);
    if (!parts.length) {
        return 'Anonymous';
    }

    const maskedParts = parts.map((part) => {
        if (part.length === 1) {
            return `${part.charAt(0)}***`;
        }
        const maskLength = Math.max(part.length - 1, 2);
        return `${part.charAt(0)}${'*'.repeat(maskLength)}`;
    });

    return maskedParts.join(' ');
};

export const formatReviewForResponse = (review) => {
    if (!review) return null;

    const plain = typeof review.toObject === 'function' ? review.toObject() : review;
    const originalNameValue = typeof plain.name === 'string' && plain.name.trim()
        ? plain.name.trim()
        : 'Anonymous';
    const displayName = maskReviewerName(originalNameValue);

    return {
        _id: toStringSafe(plain._id) || plain._id,
        user: toStringSafe(plain.user),
        name: displayName,
        displayName,
        originalName: originalNameValue,
        rating: plain.rating ?? null,
        comment: plain.comment || '',
        images: Array.isArray(plain.images) ? plain.images : [],
        userImage: plain.userImage || null,
        createdAt: plain.createdAt || null,
        updatedAt: plain.updatedAt || plain.createdAt || null,
        isEdited: Boolean(plain.isEdited),
    };
};

export const formatReviewListForResponse = (reviews = []) => {
    if (!Array.isArray(reviews)) return [];
    return reviews
        .map((review) => formatReviewForResponse(review))
        .filter(Boolean);
};