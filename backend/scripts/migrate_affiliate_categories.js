
import mongoose from 'mongoose';
import productModel from '../models/productModel.js';
import dbConnect from '../utils/db.js';

const migrate = async () => {
    try {
        console.log('Connecting to database...');
        await dbConnect();

        console.log('Starting migration for affiliate products...');

        const result = await productModel.updateMany(
            { productType: 'affiliate' },
            { $set: { category: 'eBay' } }
        );

        console.log(`Migration complete. Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents.`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('Disconnected from database.');
        }
        process.exit(0);
    }
};

migrate();
