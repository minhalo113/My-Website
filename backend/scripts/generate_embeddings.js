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
        const failedIds = [];

        while (true) {

            const query = {
                $and: [
                    {
                        $or: [
                            { embedding: { $exists: false } },
                            { embedding: null },
                            { embedding: [] }
                        ]
                    },
                    { _id: { $nin: failedIds } }
                ]
            };

            const products = await productModel.find(query)
                .limit(BATCH_SIZE)
                .select('name description category');

            if (products.length === 0) {
                console.log('No more products to process.');
                break;
            }

            console.log(`Processing batch of ${products.length} products...`);

            const operations = [];

            for (const product of products) {
                try {
                    const embeddingVector = await aiChatService.generateProductEmbedding(product);

                    if (embeddingVector && embeddingVector.length > 0) {
                        operations.push({
                            updateOne: {
                                filter: { _id: product._id },
                                update: { $set: { embedding: embeddingVector } }
                            }
                        });
                    } else {
                        console.warn(`Generated empty embedding for product ${product._id}`);
                        failedIds.push(product._id);
                    }
                } catch (err) {
                    console.error(`Failed to generate embedding for product ${product._id}: ${err.message}`);
                    failedIds.push(product._id);
                }
            }

            if (operations.length > 0) {
                await productModel.bulkWrite(operations);
                processedCount += operations.length;
                console.log(`Successfully updated ${operations.length} products. Total processed: ${processedCount}`);
            }
        }

        if (failedIds.length > 0) {
            console.warn(`Script finished with ${failedIds.length} failed products.`);
        } else {
            console.log('Embedding generation script finished successfully.');
        }

        process.exit(0);

    } catch (error) {
        console.error('Script error:', error);
        process.exit(1);
    }
};

generateEmbeddings();
