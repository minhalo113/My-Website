import mongoose from 'mongoose';
import productModel from '../models/productModel.js';
import { generateSlug } from '../utils/slugUtils.js';
import dbConnect from '../utils/db.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateSlugs = async () => {
    try {
        console.log('Connecting to database...');
        await dbConnect();
        console.log('Connected to database.');

        console.log('Fetching all products...');
        const products = await productModel.find({});
        console.log(`Found ${products.length} products.`);

        let updatedCount = 0;
        let errorCount = 0;

        for (const product of products) {
            try {
                if (product.name) {
                    const newSlug = generateSlug(product.name);

                    if (product.slug !== newSlug) {

                        await productModel.updateOne(
                            { _id: product._id },
                            { $set: { slug: newSlug } }
                        );
                        updatedCount++;
                    }
                }
            } catch (err) {
                console.error(`Failed to update product ${product._id}: ${err.message}`);
                errorCount++;
            }
        }

        console.log(`Migration complete.`);
        console.log(`Updated: ${updatedCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`Unchanged: ${products.length - updatedCount - errorCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateSlugs();
