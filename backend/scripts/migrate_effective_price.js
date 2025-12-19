import dbConnect from '../utils/db.js';
import productModel from '../models/productModel.js';
import { computeEffectivePrice } from '../utils/effectivePrice.js';

const migrateEffectivePrice = async () => {
    try {
        console.log('Connecting to database...');
        await dbConnect();
        console.log('Connected.');

        console.log('Fetching all products...');
        const products = await productModel.find({});
        console.log(`Found ${products.length} products.`);

        let updatedCount = 0;
        const bulkOps = [];

        for (const product of products) {
            const effectivePrice = computeEffectivePrice(product);


            bulkOps.push({
                updateOne: {
                    filter: { _id: product._id },
                    update: { $set: { effectivePrice: effectivePrice } }
                }
            });

            updatedCount++;

            if (bulkOps.length >= 500) {
                await productModel.bulkWrite(bulkOps);
                console.log(`Processed ${updatedCount} products...`);
                bulkOps.length = 0;
            }
        }

        if (bulkOps.length > 0) {
            await productModel.bulkWrite(bulkOps);
        }

        console.log(`Migration complete. Updated ${updatedCount} products.`);
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateEffectivePrice();
