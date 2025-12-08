import mongoose from 'mongoose';
import dotenv from 'dotenv';
import productModel from '../models/productModel.js';
import dbConnect from '../utils/db.js';


const updateShipping = async () => {
    try {

        dbConnect();

        const result = await productModel.updateMany(
            { productType: { $ne: 'affiliate' } },
            { $set: { shippingDestination: 'canada_only' } }
        );

        console.log(`Updated ${result.modifiedCount} products.`);
        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

updateShipping();
