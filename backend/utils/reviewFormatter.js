import { getReviewImageUrl } from './reviewImageUtils.js';

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

const toTimestamp = (value) => {
    if (!value) return 0;
    const resolved = value instanceof Date ? value : new Date(value);
    const time = resolved.getTime();
    return Number.isFinite(time) ? time : 0;
};

const getReviewEffectiveDate = (review) => {
    if (!review) return null;
    return review.reviewDate || review.createdAt || review.updatedAt || null;
};

export const getReviewSortTimestamp = (review) => toTimestamp(getReviewEffectiveDate(review));

export const compareReviewsByDateDesc = (a, b) => {
    const diff = getReviewSortTimestamp(b) - getReviewSortTimestamp(a);
    if (diff !== 0) return diff;
    const aId = toStringSafe(a?._id);
    const bId = toStringSafe(b?._id);
    if (aId && bId) {
        return bId.localeCompare(aId);
    }
    return 0;
};

export const insertReviewSorted = (reviews, review) => {
    if (!Array.isArray(reviews) || !review) return -1;

    const sortValue = getReviewSortTimestamp(review);
    let low = 0;
    let high = reviews.length;

    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const midValue = getReviewSortTimestamp(reviews[mid]);
        if (midValue <= sortValue) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }

    if (typeof reviews.splice === 'function') {
        reviews.splice(low, 0, review);
        return low;
    }

    return -1;
};

export const repositionReviewInPlace = (reviews, review) => {
    if (!Array.isArray(reviews) || !review) return -1;

    const currentIndex = reviews.indexOf(review);
    if (currentIndex === -1) {
        return insertReviewSorted(reviews, review);
    }

    reviews.splice(currentIndex, 1);
    return insertReviewSorted(reviews, review);
};

export const sortReviewCollectionDesc = (reviews = []) => {
    if (!Array.isArray(reviews)) return [];
    return [...reviews].sort(compareReviewsByDateDesc);
};

export const formatReviewForResponse = (review) => {
    if (!review) return null;

    const plain = typeof review.toObject === 'function' ? review.toObject() : review;
    const originalNameValue = typeof plain.name === 'string' && plain.name.trim()
        ? plain.name.trim()
        : 'Anonymous';
    const displayName = maskReviewerName(originalNameValue);
    const normalizedImages = Array.isArray(plain.images)
        ? plain.images
            .map((item) => {
                const url = getReviewImageUrl(item);
                return typeof url === 'string' && url.trim() ? url : null;
            })
            .filter(Boolean)
        : [];

    return {
        _id: toStringSafe(plain._id) || plain._id,
        user: toStringSafe(plain.user),
        name: displayName,
        displayName,
        originalName: originalNameValue,
        rating: plain.rating ?? null,
        comment: plain.comment || '',
        images: normalizedImages,
        userImage: plain.userImage || null,
        reviewDate: plain.reviewDate || plain.createdAt || null,
        createdAt: plain.createdAt || null,
        updatedAt: plain.updatedAt || plain.createdAt || null,
        isEdited: Boolean(plain.isEdited),
    };
};

export const formatReviewListForResponse = (reviews = []) => {
    if (!Array.isArray(reviews)) return [];
    return sortReviewCollectionDesc(reviews)
        .map((review) => formatReviewForResponse(review))
        .filter(Boolean);
};