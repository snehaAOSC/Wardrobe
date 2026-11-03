import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import ClothingItem from '../models/ClothingItem.js';

async function checkThreeDresses() {
  await mongoose.connect(process.env.MONGODB_URI);
  const items = await ClothingItem.find({
    name: { $in: [
      'Ivory White Broderie Tiered Summer Frock Dress',
      'Scarlet Red Tiered Summer Frock Dress',
      'Pastel Blossom Floral Spring Sundress'
    ]}
  }).lean();

  for (const item of items) {
    console.log(`NAME: "${item.name}" | USER: ${item.userId}`);
    console.log(`  IMAGE: ${item.imageUrl}`);
  }
  await mongoose.disconnect();
}

checkThreeDresses();
