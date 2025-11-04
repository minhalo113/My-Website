import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';

const ensureEnv = (value, name) => {
    if (!value) {
        throw new Error(`${name} is not configured`);
    }
    return value;
};

const normalizeTags = (tags) => {
    if (!tags) return [];
    if (typeof tags === 'string') {
        try {
            const parsed = JSON.parse(tags);
            if (Array.isArray(parsed)) {
                return normalizeTags(parsed);
            }
        } catch (error) {
            return tags
                .split(',')
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0);
        }
        return [];
    }
    if (Array.isArray(tags)) {
        return tags
            .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
            .filter((tag) => tag.length > 0);
    }
    return [];
};

const sanitizeHashtag = (tag) => {
    const trimmed = typeof tag === 'string' ? tag.trim() : '';
    if (!trimmed) return '';
    const noHash = trimmed.replace(/^#+/, '');
    const cleaned = noHash.replace(/[^0-9A-Za-z_]/g, '');
    if (!cleaned) return '';
    return `#${cleaned}`;
};

const buildCaption = ({ title, caption, callToAction, productUrl, hashtags }) => {
    const normalizedTags = normalizeTags(hashtags).map(sanitizeHashtag).filter(Boolean);
    const sections = [title, caption, callToAction, productUrl];
    if (normalizedTags.length) {
        sections.push(normalizedTags.join(' '));
    }
    return {
        caption: sections.filter((section) => typeof section === 'string' && section.trim().length > 0).join('\n\n').trim(),
        normalizedTags,
    };
};

const cleanupUploadedSocialImage = async (uploadResult) => {
    const publicId = uploadResult?.public_id || uploadResult?.publicId;
    if (!publicId) {
        return false;
    }

    try {
        configureCloudinary();
        await cloudinary.uploader.destroy(publicId, {
            invalidate: true,
        });
        return true;
    } catch (error) {
        console.error('Failed to remove social post image from Cloudinary:', error?.message || error);
        return false;
    }
};

const uploadImageToCloudinary = async (filepath) => {
    cloudinary.config({
        cloud_name: ensureEnv(process.env.cloud_name, 'Cloudinary cloud_name'),
        api_key: ensureEnv(process.env.api_key, 'Cloudinary api_key'),
        api_secret: ensureEnv(process.env.api_secret, 'Cloudinary api_secret'),
        secure: true,
    });

    const result = await cloudinary.uploader.upload(filepath, {
        folder: 'social-posts',
    });
    return result.secure_url || result.url;
};

export const publishProductSocialPost = async ({
    title,
    caption,
    callToAction,
    productUrl,
    hashtags,
    imagePath,
}) => {
    const accessToken = ensureEnv(process.env.META_ACCESS_TOKEN, 'META_ACCESS_TOKEN');
    const facebookPageId = ensureEnv(process.env.META_FACEBOOK_PAGE_ID, 'META_FACEBOOK_PAGE_ID');
    const instagramBusinessId = ensureEnv(process.env.META_INSTAGRAM_BUSINESS_ID, 'META_INSTAGRAM_BUSINESS_ID');

    if (!imagePath) {
        throw new Error('An image is required to publish to Instagram and Facebook');
    }

    const imageUrl = await uploadImageToCloudinary(imagePath);
    let payload = null;

    try {
        console.log(imageUrl)
        if (!imageUrl) {
            throw new Error('Failed to upload social post image');
        }

        const { caption: finalCaption, normalizedTags } = buildCaption({
            title,
            caption,
            callToAction,
            productUrl,
            hashtags,
        });

        if (!finalCaption) {
            throw new Error('Unable to build a caption for the social post');
        }

        const baseParams = { access_token: accessToken };

        const facebookEndpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${facebookPageId}/photos`;
        const facebookParams = {
            ...baseParams,
            url: imageUrl,
            caption: finalCaption,
        };

        const { data: facebookData } = await axios.post(facebookEndpoint, null, { params: facebookParams });

        const instagramEndpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${instagramBusinessId}/media`;
        const instagramParams = {
            ...baseParams,
            image_url: imageUrl,
            caption: finalCaption,
        };

        const { data: mediaData } = await axios.post(instagramEndpoint, null, { params: instagramParams });
        const creationId = mediaData?.id;
        if (!creationId) {
            throw new Error('Failed to create Instagram media container');
        }

        const publishEndpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${instagramBusinessId}/media_publish`;
        const publishParams = {
            ...baseParams,
            creation_id: creationId,
        };

        const { data: publishData } = await axios.post(publishEndpoint, null, { params: publishParams });

        payload = {
            message: 'Social post published to Facebook and Instagram successfully.',
            facebookPostId: facebookData?.post_id || facebookData?.id || null,
            instagramMediaId: publishData?.id || creationId,
            caption: finalCaption,
            imageUrl,
            hashtags: normalizedTags,
        };

        return payload;
    } finally {
        const assetRemoved = await cleanupUploadedSocialImage(uploadResult);
        if (payload) {
            payload.cloudinaryAssetRemoved = assetRemoved;
        }
    }
};

export default publishProductSocialPost;