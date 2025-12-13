import mongoose from 'mongoose';
import dotenv from 'dotenv';
import productModel from '../models/productModel.js';
import dbConnect from '../utils/db.js';

dotenv.config();
const run = async () => {
  if (!process.env.CONNECTURI) {
    throw new Error('MONGODB_URI environment variable is required.');
  }

    await dbConnect();

  const cursor = productModel.find({}).cursor();
  for await (const doc of cursor) {
    let changed = false;
    for (const rating of doc.ratings || []) {
      if (!rating.reviewDate) {
        rating.reviewDate = rating.createdAt || new Date();
        changed = true;
      }
    }

    if (changed) {
      doc.ratings.sort((a, b) => {
        const aTime = new Date(a.reviewDate || a.createdAt || a.updatedAt || 0).getTime();
        const bTime = new Date(b.reviewDate || b.createdAt || b.updatedAt || 0).getTime();
    
        if (bTime !== aTime) {
          return bTime - aTime;
        }
        const aId = a?._id ? a._id.toString() : '';
        const bId = b?._id ? b._id.toString() : '';
        return bId.localeCompare(aId);
      });
      doc.markModified('ratings');
      await doc.save();
    }
  }

  console.log('Backfill complete');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Backfill failed', error);
  mongoose.disconnect().finally(() => process.exit(1));
});