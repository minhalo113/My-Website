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

    async updateProduct(product) {
        if (!product || !product.sourceId || !product.category) return null;

        const provider = this.providers.find(p => p.name.toLowerCase() === product.category.toLowerCase());
        if (!provider) {
            console.error(`[IngestionService] No provider found for category: ${product.category}`);
            return null;
        }

        try {
            console.log(`[IngestionService] Updating individual product: ${product.name} (${product.sourceId}) via ${provider.name}`);
            const updatedItem = await provider.fetchProductDetails(product.sourceId);

            if (!updatedItem) {
                console.log(`[IngestionService] Product no longer available: ${product.name}. Deleting.`);
                await productModel.deleteOne({ _id: product._id });
                return null;
            }

            const { name, price, stock, images, description, currency, affiliateLink, link, discount, videos } = updatedItem;

            let finalDiscount = discount ? parseFloat(String(discount).replace('%', '')) : 0;
            if (isNaN(finalDiscount)) finalDiscount = 0;

            const updatedProduct = await productModel.findByIdAndUpdate(
                product._id,
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
                        discount: finalDiscount,
                        videos,
                        updatedAt: new Date()
                    }
                },
                { new: true }
            );

            return updatedProduct;

        } catch (error) {
            console.error(`[IngestionService] Failed to update product ${product._id}:`, error.message);

            await productModel.deleteOne({ _id: product._id });
            return null;
        }
    }

    async run(targetProviderName = null) {
        console.log(`[IngestionService] Starting ingestion job${targetProviderName ? ` for ${targetProviderName}` : ' for all providers'}...`);

        let sellerId;
        try {
            sellerId = await this.getSellerId();
        } catch (error) {
            console.error('[IngestionService] Aborting:', error.message);
            return;
        }

        const providersToRun = targetProviderName
            ? this.providers.filter(p => p.name === targetProviderName)
            : this.providers;

        if (providersToRun.length === 0) {
            console.warn(`[IngestionService] No provider found with name: ${targetProviderName}`);
            return;
        }

        for (const provider of providersToRun) {
            console.log(`[IngestionService] Running provider: ${provider.name}`);
            try {
                const products = await provider.fetchProducts();

                for (const item of products) {
                    try {
                        const slug = slugify(item.name, { lower: true, strict: true }) + '-' + Date.now();

                        const query = item.sourceId ? { sourceId: item.sourceId } : { link: item.link };

                        const updateData = {
                            ...item,
                            sellerId,
                        };

                        const { name, price, stock, images, description, currency, affiliateLink, sourceId, link, productType, category, discount, videos } = item;

                        let finalDiscount = discount ? parseFloat(String(discount).replace('%', '')) : 0;
                        if (isNaN(finalDiscount)) finalDiscount = 0;

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
                                    category,
                                    discount: finalDiscount,
                                    videos,
                                    updatedAt: new Date()
                                },
                                $setOnInsert: {
                                    sellerId,
                                    slug,
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
