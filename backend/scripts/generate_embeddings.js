import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dbConnect from '../utils/db.js';
import productModel from '../models/productModel.js';
import aiChatService from '../services/aiChatService.js';

dotenv.config();

const BATCH_SIZE = 10;

const generateEmbeddings = async () => {
    try {
        await dbConnect();
        console.log('Connected to database.');

        let processedCount = 0;
        let skip = 0;

        while (true) {
            const products = await productModel.find({})
                .skip(skip)
                .limit(BATCH_SIZE)
                .select('name description category');

            if (products.length === 0) {
                console.log('No more products to process.');
                break;
            }

            console.log(`Processing batch of ${products.length} products (Skip: ${skip})...`);

            const operations = [];

            for (const product of products) {
                try {
                    const embeddingVector = await aiChatService.generateProductEmbedding(product);

                    if (embeddingVector) {
                        operations.push({
                            updateOne: {
                                filter: { _id: product._id },
                                update: { $set: { embedding: embeddingVector } }
                            }
                        });
                    }
                } catch (err) {
                    console.error(`Failed to generate embedding for product ${product._id}: ${err.message}`);
                }
            }

            if (operations.length > 0) {
                await productModel.bulkWrite(operations);
                processedCount += operations.length;
                console.log(`Successfully updated ${operations.length} products. Total processed: ${processedCount}`);
            }

            skip += BATCH_SIZE;
        }

        console.log('Embedding generation script finished.');
        process.exit(0);

    } catch (error) {
        console.error('Script error:', error);
        process.exit(1);
    }
};

generateEmbeddings();
