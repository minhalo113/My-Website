import mongoose from 'mongoose';
import dotenv from 'dotenv';
import productModel from '../models/productModel.js';
import dbConnect from '../utils/db.js';

dotenv.config();

const migrateProducts = async () => {
    try {
        await dbConnect();

        console.log("Starting migration...");

        const filter = {
            $or: [
                { productType: { $exists: false } },
                { productType: 'standard' },
                { productType: 'dropship' },
                { productType: null }
            ]
        };

        const query = {
            ...filter,
            productType: { $ne: 'affiliate' }
        };

        const update = {
            $set: {
                productType: 'standard',
                currency: 'CAD'
            }
        };

        const result = await productModel.updateMany(query, update);

        console.log(`Migration complete. Matched ${result.matchedCount} and modified ${result.modifiedCount} products.`);

        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrateProducts();
