import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import ClothingItem from '../models/ClothingItem.js';

async function inspectAllClothes() {
  await mongoose.connect(process.env.MONGODB_URI);
  const items = await ClothingItem.find({}).lean();
  console.log(`TOTAL ITEMS IN DB: ${items.length}`);
  const summary = items.map((item, idx) => ({
    idx: idx + 1,
    id: item._id.toString(),
    userId: item.userId ? item.userId.toString() : 'guest',
    name: item.name,
    category: item.category,
    subCategory: item.subCategory,
    color: item.color,
    imageUrl: item.imageUrl,
    description: item.description
  }));
  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
}

inspectAllClothes();
