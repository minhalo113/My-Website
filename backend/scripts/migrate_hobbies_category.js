import productModel from '../models/productModel.js';
import dbConnect from '../utils/db.js';

const migrateCategories = async () => {
    try {
        await dbConnect();

        console.log('Starting migration: Hobbies & Collectibles -> Other Collectibles');

        const result = await productModel.updateMany(
            { category: "Hobbies & Collectibles" },
            { category: "Other Collectibles" }
        );

        console.log(`Migration complete. Matched ${result.matchedCount} products and modified ${result.modifiedCount} products.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateCategories();
