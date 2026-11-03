import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ClothingItem from '../models/ClothingItem.js';
import User from '../models/User.js';
import { generateClothingDescription, generateTextEmbedding, generateVisualEmbedding } from '../services/embeddingService.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Database] Connected to MongoDB Atlas');

  const users = await User.find({}).lean();
  console.log(`[Seed] Found ${users.length} users in database`);

  const whiteFrockData = {
    name: 'Ivory White Broderie Tiered Summer Frock Dress',
    category: 'Dress',
    subCategory: 'Frock',
    color: 'White',
    primaryColor: '#ffffff',
    secondaryColors: ['Ivory', 'Cream'],
    material: '100% Breathable Broderie Cotton',
    pattern: 'Plain',
    brand: 'Zara Woman',
    season: ['Spring', 'Summer'],
    occasion: ['Party', 'Casual', 'Summer party', 'Brunch', 'College'],
    style: ['Chic', 'Romantic', 'Playful'],
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop',
    favorite: true,
    tags: ['white', 'frock', 'dress', 'summer', 'casual', 'party', 'cotton', 'tiered']
  };

  const desc = generateClothingDescription(whiteFrockData);
  const textEmb = generateTextEmbedding({ ...whiteFrockData, description: desc });
  const imgEmb = generateVisualEmbedding({
    colorHex: '#ffffff',
    category: 'Dress',
    pattern: 'Plain',
    material: '100% Breathable Broderie Cotton',
    aspectRatio: 1.3
  });

  // Upsert for every registered user and also for null (global / guest)
  const targetUserIds = [null, ...users.map(u => u._id)];

  for (const uid of targetUserIds) {
    const filter = {
      name: whiteFrockData.name,
      ...(uid ? { userId: uid } : { userId: null })
    };

    const doc = {
      ...whiteFrockData,
      description: desc,
      text_embedding: textEmb,
      image_embedding: imgEmb,
      userId: uid || undefined,
      source: 'wardrobe',
      isEstimated: false
    };

    const res = await ClothingItem.findOneAndUpdate(filter, { $set: doc }, { upsert: true, new: true });
    console.log(`[Success] Upserted White Frock for user: ${uid ? String(uid) : 'Guest/Global'} (ID: ${res._id})`);
  }

  // Also verify Crisp White Oxford Shirt has rich tags
  await ClothingItem.updateMany(
    { name: 'Crisp White Oxford Shirt' },
    {
      $addToSet: {
        tags: { $each: ['white', 'shirt', 'top', 'button-down', 'cotton', 'shirt dress'] },
        occasion: 'Casual'
      }
    }
  );
  console.log('[Success] Enhanced Crisp White Oxford Shirt tags');

  const total = await ClothingItem.countDocuments({});
  console.log(`[Finished] Total items now in MongoDB: ${total}`);
  process.exit(0);
}

run().catch(err => {
  console.error('[Error]:', err);
  process.exit(1);
});

