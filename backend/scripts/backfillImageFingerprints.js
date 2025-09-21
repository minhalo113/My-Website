import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '../utils/db.js';
import productModel from '../models/productModel.js';
import { fetchFingerprintForUrl } from '../utils/imageFingerprint.js';

dotenv.config();

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
    secure: true,
  });
};

const arraysEqual = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const computeFingerprints = async (urls = [], existing = []) => {
  const results = [];
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    const current = existing[i];
    if (current) {
      results.push(current);
      continue;
    }
    if (!url) {
      results.push('');
      continue;
    }

    let fetchError = null;
    const fingerprint = await fetchFingerprintForUrl(url, {
      onError: (error, failingUrl) => {
        fetchError = error;
        console.error(`Failed to fetch fingerprint for ${failingUrl}:`, error.message);
      },
    });

    if(fetchError) {
      throw fetchError;
    }
    if(!fingerprint){
      throw new Error(`Missing fingerprint for ${url}. Stopping backfill`);
    }
    results.push(fingerprint || '');
  }
  return results;
};

(async () => {
  try {
    configureCloudinary();
    await dbConnect();
    const products = await productModel.find({});

    for (const product of products) {
      const images = Array.isArray(product.images) ? product.images : [];
      const colorImages = Array.isArray(product.colorImages) ? product.colorImages : [];
      const existingImagesFp = Array.isArray(product.imageFingerprints) ? product.imageFingerprints : [];
      const existingColorFp = Array.isArray(product.colorImageFingerprints) ? product.colorImageFingerprints : [];

      const newImageFingerprints = await computeFingerprints(images, existingImagesFp);
      const newColorFingerprints = await computeFingerprints(colorImages, existingColorFp);

      let modified = false;
      if (!arraysEqual(newImageFingerprints, existingImagesFp)) {
        product.imageFingerprints = newImageFingerprints;
        modified = true;
      }
      if (!arraysEqual(newColorFingerprints, existingColorFp)) {
        product.colorImageFingerprints = newColorFingerprints;
        modified = true;
      }

      if (modified) {
        await product.save();
        console.log(`Updated fingerprints for product ${product._id}`);
      }
    }

    console.log('Fingerprint backfill completed.');
  } catch (error) {
    console.error('Backfill failed:', error);
  } finally {
    await mongoose.connection.close();
  }
})();