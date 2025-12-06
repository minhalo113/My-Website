import productModel from '../../models/productModel.js';
import adminModel from '../../models/adminModel.js';
import slugify from 'slugify';

import ebayProvider from './providers/EbayProvider.js';
import aliExpressProvider from './providers/AliExpressProvider.js';

class IngestionService {
    constructor() {
        this.providers = [
            ebayProvider,
            aliExpressProvider
        ];
    }

    async getSellerId() {
        const admin = await adminModel.findOne({ role: 'admin' });
        if (!admin) {
            throw new Error('No admin user found. Cannot assign sellerId for ingested products.');
        }
        return admin._id;
    }

    async run() {
        console.log('[IngestionService] Starting daily ingestion job...');

        let sellerId;
        try {
            sellerId = await this.getSellerId();
        } catch (error) {
            console.error('[IngestionService] Aborting:', error.message);
            return;
        }

        for (const provider of this.providers) {
            console.log(`[IngestionService] Running provider: ${provider.name}`);
            const products = await provider.fetchProducts();

            for (const item of products) {
                try {
                    const existingProduct = await productModel.findOne({ affiliateLink: item.link });

                    if (existingProduct) {
                        if (existingProduct.price !== item.price || existingProduct.stock !== item.stock) {
                            existingProduct.price = item.price;
                            existingProduct.stock = item.stock;
                            await existingProduct.save();
                            console.log(`[IngestionService] Updated product: ${item.name}`);
                        }
                    } else {
                        const slug = slugify(item.name, { lower: true, strict: true }) + '-' + Date.now();
                        const affiliateLink = generateAffiliateLink(item.link, provider.name);

                        const newProduct = new productModel({
                            ...item,
                            sellerId,
                            slug,
                            productType: 'affiliate',
                            affiliateLink,
                            discount: 0 // Default
                        });

                        await newProduct.save();
                        console.log(`[IngestionService] Created product: ${item.name}`);
                    }
                } catch (err) {
                    console.error(`[IngestionService] Error processing item ${item.name}:`, err.message);
                }
            }
        }
        console.log('[IngestionService] Ingestion job completed.');
    }
}

export default new IngestionService();
