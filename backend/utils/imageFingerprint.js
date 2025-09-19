import { v2 as cloudinary } from 'cloudinary';

export const extractPublicId = (url = '') => {
    if (!url) return '';
    try {
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1) {
            const publicIdParts = parts.slice(uploadIndex + 2);
            const publicIdWithExt = publicIdParts.join('/');
            return publicIdWithExt.replace(/\.[^/.]+$/, '');
        }
        const lastPart = parts[parts.length - 1] || '';
        return lastPart.replace(/\.[^/.]+$/, '');
    } catch (error) {
        return '';
    }
};

export const fingerprintFromUploadResult = (result) => {
    if (!result) return null;
    const phash = result?.phash || result?.pHash || result?.image_phash;
    return phash ? phash.toLowerCase() : null;
};

export const fetchFingerprintForUrl = async (url, options = {}) => {
    const publicId = extractPublicId(url);
    if (!publicId) return null;
    try {
        const resource = await cloudinary.api.resource(publicId, { phash: true, ...options });
        const phash = resource?.phash || resource?.pHash || resource?.image_phash;
        return phash ? phash.toLowerCase() : null;
    } catch (error) {
        if (typeof options?.onError === 'function') {
            options.onError(error, url);
        }
        return null;
    }
};

export const hammingDistance = (hashA, hashB) => {
    if (!hashA || !hashB) return Number.POSITIVE_INFINITY;
    const normalize = (hash) => hash.toString().trim().toLowerCase();
    const a = normalize(hashA);
    const b = normalize(hashB);
    if (!a || !b || a.length !== b.length) return Number.POSITIVE_INFINITY;
    let distance = 0;
    for (let i = 0; i < a.length; i += 2) {
        const chunkA = parseInt(a.substring(i, i + 2), 16);
        const chunkB = parseInt(b.substring(i, i + 2), 16);
        let xor = chunkA ^ chunkB;
        while (xor) {
            distance += xor & 1;
            xor >>= 1;
        }
    }
    return distance;
};

export const fingerprintSimilarity = (distance, hashLength = 64) => {
    if (!Number.isFinite(distance)) return 0;
    const clamped = Math.max(0, Math.min(hashLength, distance));
    const similarity = ((hashLength - clamped) / hashLength) * 100;
    return Math.round(similarity);
};