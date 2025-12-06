import productModel from '../../models/productModel.js';
import adminModel from '../../models/adminModel.js';
import slugify from 'slugify';

import ebayProvider from './providers/EbayProvider.js';
// import aliExpressProvider from './providers/AliExpressProvider.js';

class IngestionService {
    constructor() {
        this.providers = [
            ebayProvider,
            // aliExpressProvider
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
            try {
                const products = await provider.fetchProducts();

                for (const item of products) {
                    try {
                        const slug = slugify(item.name, { lower: true, strict: true }) + '-' + Date.now();

                        // Use sourceId for deduplication if available, otherwise fallback to affiliateLink or link
                        const query = item.sourceId ? { sourceId: item.sourceId } : { link: item.link };

                        // If item already has affiliateLink, use it, otherwise keep empty or what logic provides
                        // The provider is expected to handle affiliateLink generation now.

                        const updateData = {
                            ...item,
                            sellerId,
                            // Ensure slug is only set on insert, handled by setDefaultsOnInsert or explicit update check
                            // But findOneAndUpdate with upsert will use the update object. 
                            // $setOnInsert is better for fields like slug that shouldn't change.
                        };

                        // We separate fields that should be updated vs those set on insert
                        const { name, price, stock, images, description, currency, affiliateLink, sourceId, link, productType } = item;

                        await productModel.findOneAndUpdate(
                            query,
                            {
                                $set: {
                                    name,
                                    price,
                                    stock,
                                    images,
                                    description,
                                    currency,
                                    affiliateLink,
                                    link,
                                    productType,
                                    updatedAt: new Date()
                                },
                                $setOnInsert: {
                                    sellerId,
                                    slug,
                                    discount: 0,
                                    colors: [],
                                    sizes: [],
                                    createdAt: new Date()
                                }
                            },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );

                        console.log(`[IngestionService] Upserted product: ${item.name}`);

                    } catch (err) {
                        console.error(`[IngestionService] Error processing item ${item.name}:`, err.message);
                    }
                }
            } catch (err) {
                console.error(`[IngestionService] Error fetching products from ${provider.name}:`, err.message);
            }
        }
        console.log('[IngestionService] Ingestion job completed.');
    }
}

export default new IngestionService();
