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

const configureCloudinary = () => {
    cloudinary.config({
        cloud_name: ensureEnv(process.env.cloud_name, 'Cloudinary cloud_name'),
        api_key: ensureEnv(process.env.api_key, 'Cloudinary api_key'),
        api_secret: ensureEnv(process.env.api_secret, 'Cloudinary api_secret'),
        secure: true,
    });
};

const uploadImageToCloudinary = async (filepath) => {
    configureCloudinary();
    return cloudinary.uploader.upload(filepath, {
        folder: 'social-posts',
    });
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

// Helper: wait for IG container to be ready (no TS types)
async function waitForIgContainerReady({
  creationId,
  accessToken,
  maxWaitMs = 90000,     // 90s
  pollIntervalMs = 2000, // 2s
}) {
  const endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${creationId}`;
  const start = Date.now();

  // Loop until FINISHED, ERROR, or timeout
  // status_code: IN_PROGRESS | FINISHED | ERROR
  // error_message is present when status_code === ERROR
  while (true) {
    const { data } = await axios.get(endpoint, {
      params: {
        access_token: accessToken,
        fields: 'status_code,error_message',
      },
    });

    const status = data && data.status_code;

    if (status === 'FINISHED') {
      return { ok: true, status, diag: data };
    }

    if (status === 'ERROR') {
      const msg = (data && data.error_message) || 'Unknown IG container error';
      return { ok: false, status, diag: data, error: new Error(`IG container ERROR: ${msg}`) };
    }

    if (Date.now() - start > maxWaitMs) {
      return {
        ok: false,
        status,
        diag: data,
        error: new Error('Timed out waiting for IG container to finish processing'),
      };
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
}

// (Optional) Helper: quick check that the image is publicly reachable
async function assertImageReachable(url) {
  try {
    await axios.head(url, { timeout: 10000 });
  } catch (_) {
    // Some CDNs block HEAD; try a tiny GET instead
    await axios.get(url, {
      timeout: 10000,
      headers: { Range: 'bytes=0-1024' },
      responseType: 'arraybuffer',
    });
  }
}

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

  const uploadResult = await uploadImageToCloudinary(imagePath);
  let payload = null;

  try {
    const imageUrl = (uploadResult && (uploadResult.secure_url || uploadResult.url)) || null;
    if (!imageUrl) throw new Error('Failed to upload social post image');

    // Ensure IG can fetch the image (must be public, not authenticated/private)
    await assertImageReachable(imageUrl);

    const built = buildCaption({
      title,
      caption,
      callToAction,
      productUrl,
      hashtags,
    });
    const finalCaption = built && built.caption;
    const normalizedTags = built && built.normalizedTags;
    if (!finalCaption) throw new Error('Unable to build a caption for the social post');

    const baseParams = { access_token: accessToken };

    // 1) Facebook Page photo
    const facebookEndpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${facebookPageId}/photos`;
    const facebookParams = {
      ...baseParams,
      url: imageUrl,
      caption: finalCaption,
    };
    const { data: facebookData } = await axios.post(facebookEndpoint, null, { params: facebookParams });

    // 2) Instagram: create media container
    const instagramEndpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${instagramBusinessId}/media`;
    const instagramParams = {
      ...baseParams,
      image_url: imageUrl,
      caption: finalCaption,
    };
    const { data: mediaData } = await axios.post(instagramEndpoint, null, { params: instagramParams });
    const creationId = mediaData && mediaData.id;
    if (!creationId) throw new Error('Failed to create Instagram media container');

    // 3) Wait until the container processing finishes
    const ready = await waitForIgContainerReady({ creationId, accessToken });
    if (!ready.ok) {
      const diag = JSON.stringify(ready.diag || {});
      throw new Error(`Instagram container not publishable: ${ready.status}. ${ready.error && ready.error.message ? ready.error.message : ''} diag=${diag}`);
    }

    // 4) Publish the container
    const publishEndpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${instagramBusinessId}/media_publish`;
    const publishParams = {
      ...baseParams,
      creation_id: creationId,
    };
    const { data: publishData } = await axios.post(publishEndpoint, null, { params: publishParams });

    payload = {
      message: 'Social post published to Facebook and Instagram successfully.',
      facebookPostId: (facebookData && (facebookData.post_id || facebookData.id)) || null,
      instagramMediaId: (publishData && publishData.id) || null,
      creationId,
      containerStatus: 'FINISHED',
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