import mongoose from "mongoose";
import dotenv from 'dotenv';
import dbConnect from "../utils/db.js";
import productModel from "../models/productModel.js";

dotenv.config();

const isInvalidValue = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
};

const hasInvalidFingerprints = (fingerprints = []) =>
  Array.isArray(fingerprints) && fingerprints.some((value) => isInvalidValue(value));

(async () => {
  try {
    await dbConnect();

    const products = await productModel.find({
      $or: [
        { imageFingerprints: { $elemMatch: { $in: ['', null] } } },
        { colorImageFingerprints: { $elemMatch: { $in: ['', null] } } },
      ],
    });

    let cleanedCount = 0;

    for (const product of products) {
      const shouldUnsetImage = hasInvalidFingerprints(product.imageFingerprints);
      const shouldUnsetColor = hasInvalidFingerprints(product.colorImageFingerprints);

      if (!shouldUnsetImage && !shouldUnsetColor) {
        continue;
      }

      const unsetPayload = {};
      if (shouldUnsetImage) {
        unsetPayload.imageFingerprints = 1;
      }
      if (shouldUnsetColor) {
        unsetPayload.colorImageFingerprints = 1;
      }

      await product.updateOne({ $unset: unsetPayload });
      cleanedCount += 1;
      console.log(`Removed invalid fingerprints from product ${product._id}`);
    }

    console.log(`Cleanup complete. Updated ${cleanedCount} product(s).`);
  } catch (error) {
    console.error('Failed to clean invalid fingerprints:', error);
  } finally {
    await mongoose.connection.close();
  }
})();