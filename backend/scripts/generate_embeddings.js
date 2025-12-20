import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import dbConnect from '../utils/db.js';
import productModel from '../models/productModel.js';

dotenv.config();

const BATCH_SIZE = 50;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';
const MODEL = 'text-embedding-3-small';

if (!OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is not defined in environment variables.');
    process.exit(1);
}

const generateEmbeddings = async () => {
    try {
        await dbConnect();
        console.log('Connected to database.');

        let processedCount = 0;

        while (true) {
            const products = await productModel.find({ embedding: { $exists: false } })
                .limit(BATCH_SIZE)
                .select('name description category');

            if (products.length === 0) {
                console.log('No more products to process.');
                break;
            }

            console.log(`Processing batch of ${products.length} products...`);

            const inputs = products.map(p => {
                const name = p.name || '';
                const category = p.category || 'Unknown';
                const description = p.description || '';

                return `Name: ${name}. Category: ${category}. Description: ${description}`;
            });

            try {
                const response = await axios.post(
                    OPENAI_EMBEDDING_URL,
                    {
                        input: inputs,
                        model: MODEL
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${OPENAI_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const embeddings = response.data.data;

                const operations = products.map((product, index) => {
                    const embeddingVector = embeddings[index].embedding;
                    return {
                        updateOne: {
                            filter: { _id: product._id },
                            update: { $set: { embedding: embeddingVector } }
                        }
                    };
                });

                if (operations.length > 0) {
                    await productModel.bulkWrite(operations);
                    processedCount += operations.length;
                    console.log(`Successfully updated ${operations.length} products. Total processed: ${processedCount}`);
                }

            } catch (apiError) {
                console.error('Error calling OpenAI API:', apiError.response?.data || apiError.message);
                console.error('Aborting batch due to API error.');
                break;
            }
        }

        console.log('Embedding generation script finished.');
        process.exit(0);

    } catch (error) {
        console.error('Script error:', error);
        process.exit(1);
    }
};

generateEmbeddings();
