import productModel from '../models/productModel.js';
import { generateProductSocialCopy } from './aiProductSocialService.js';
import { publishProductSocialPost } from './metaPublisher.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { tmpdir } from 'os';

const downloadImage = async (url, filepath) => {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

const createAutomatedSocialPost = async () => {
    try {
        console.log('[AutomatedSocialPostService] Starting automated social post generation...');

        const count = await productModel.countDocuments({ productType: 'standard', isHidden: false });
        if (count === 0) {
            console.log('[AutomatedSocialPostService] No standard products found. Skipping.');
            return;
        }

        const random = Math.floor(Math.random() * count);
        const product = await productModel.findOne({ productType: 'standard', isHidden: false }).skip(random);

        if (!product) {
            console.log('[AutomatedSocialPostService] Could not find a product after skipping.');
            return;
        }

        console.log(`[AutomatedSocialPostService] Selected product: ${product.name} (ID: ${product._id})`);

        const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : null;
        if (!imageUrl) {
            console.log('[AutomatedSocialPostService] Product has no images. Skipping.');
            return;
        }

        const tmpFilepath = path.join(tmpdir(), `social_post_${Date.now()}.jpg`);
        try {
            await downloadImage(imageUrl, tmpFilepath);
            console.log(`[AutomatedSocialPostService] Downloaded image to ${tmpFilepath}`);

            const socialCopy = await generateProductSocialCopy({
                title: product.name,
                description: product.description,
                price: product.price,
                discount: product.discount,
                colorPrices: product.colorPrices,
            });
            console.log('[AutomatedSocialPostService] Generated social copy.');

            const productUrl = `https://afigureaday.com/product/details/${product.slug}`;
            const result = await publishProductSocialPost({
                title: socialCopy.headline,
                caption: socialCopy.caption,
                callToAction: socialCopy.callToAction,
                productUrl: productUrl,
                hashtags: socialCopy.hashtags,
                imagePath: tmpFilepath,
            });
            console.log('[AutomatedSocialPostService] Successfully published social post:', result);

        } finally {
            if (fs.existsSync(tmpFilepath)) {
                fs.unlinkSync(tmpFilepath);
                console.log(`[AutomatedSocialPostService] Cleaned up temporary image: ${tmpFilepath}`);
            }
        }
    } catch (error) {
        console.error('[AutomatedSocialPostService] Error generating automated social post:', error);
    }
};

export default {
    createAutomatedSocialPost,
};
