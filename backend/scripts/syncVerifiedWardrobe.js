import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import ClothingItem from '../models/ClothingItem.js';
import User from '../models/User.js';
import {
  generateTextEmbedding,
  generateVisualEmbedding,
  generateClothingDescription
} from '../services/embeddingService.js';

// ── EXACT VERIFIED IMAGES MATCHING REAL PHOTO CONTENT ────────────────────────
const VERIFIED_CATALOG = [
  // ── 1. WHITE FROCK (photo-1515372039744-b8f02a3ae446 shows a real White Summer Frock) ──
  {
    name: 'Ivory White Broderie Tiered Summer Frock Dress',
    category: 'Dress',
    subCategory: 'Frock',
    color: 'White',
    primaryColor: '#ffffff',
    secondaryColors: ['Ivory', 'Cream'],
    material: '100% Breathable Broderie Cotton',
    brand: 'Zara Woman',
    price: 120,
    rating: 4.9,
    season: ['Spring', 'Summer'],
    occasion: ['Party', 'Casual', 'Summer party', 'Brunch', 'College'],
    style: ['Chic', 'Romantic', 'Playful'],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=700&auto=format&fit=crop',
    tags: ['white', 'frock', 'dress', 'summer', 'cotton', 'broderie', 'tiered'],
    favorite: true
  },

  // ── 2. RED FROCK (photo-1572804013309-59a88b7e92f1 shows a real Scarlet Red Dress) ──
  {
    name: 'Scarlet Red Tiered Summer Frock Dress',
    category: 'Dress',
    subCategory: 'Frock',
    color: 'Red',
    primaryColor: '#dc2626',
    secondaryColors: ['Crimson', 'Ruby'],
    pattern: 'Floral',
    material: '100% Breathable Chiffon Cotton',
    brand: 'Reformation',
    price: 135,
    rating: 4.9,
    season: ['Summer', 'Spring'],
    occasion: ['Party', 'Casual', 'Summer party', 'Brunch', 'Birthday', 'Date night'],
    style: ['Chic', 'Playful'],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=700&auto=format&fit=crop',
    tags: ['red', 'frock', 'dress', 'summer', 'party', 'chiffon', 'scarlet'],
    favorite: true
  },

  // ── 3. BLUE CHAMBRAY DENIM SHIRT (photo-1596755094514-f87e34085b2c shows a real Blue Shirt) ──
  {
    name: 'Classic Indigo Chambray Denim Shirt',
    category: 'Shirt',
    subCategory: 'Button-Down',
    color: 'Blue',
    primaryColor: '#2563eb',
    secondaryColors: ['Indigo', 'Chambray'],
    material: '100% Breathable Denim Chambray Cotton',
    brand: "Levi's",
    price: 85,
    rating: 4.8,
    season: ['Spring', 'Summer', 'Autumn', 'Winter'],
    occasion: ['Casual', 'College', 'Work'],
    style: ['Casual', 'Streetwear'],
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop',
    tags: ['blue', 'shirt', 'denim', 'chambray', 'button-down', 'casual'],
    favorite: true
  },

  // ── 4. CRISP WHITE OXFORD SHIRT (Clean White Cotton Shirt) ──
  {
    name: 'Crisp White Oxford Shirt',
    category: 'Shirt',
    subCategory: 'Button-Down',
    color: 'White',
    primaryColor: '#ffffff',
    secondaryColors: ['Ivory'],
    material: '100% Egyptian Cotton',
    brand: 'Ralph Lauren',
    price: 95,
    rating: 4.8,
    season: ['Spring', 'Summer', 'Autumn', 'Winter'],
    occasion: ['Work', 'Formal', 'Casual', 'College'],
    style: ['Chic', 'Formal', 'Minimalist'],
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700&auto=format&fit=crop',
    tags: ['white', 'shirt', 'button-down', 'formal', 'work', 'cotton'],
    favorite: true
  },

  // ── 5. NAVY SILK BLOUSE ──
  {
    name: 'Navy Silk Crepe Blouse',
    category: 'Shirt',
    subCategory: 'Blouse',
    color: 'Navy',
    primaryColor: '#1e3a8a',
    secondaryColors: ['Midnight Blue'],
    material: 'Mulberry Silk',
    brand: 'Theory',
    price: 110,
    rating: 4.9,
    season: ['Spring', 'Autumn', 'Winter'],
    occasion: ['Work', 'Dinner', 'Formal'],
    style: ['Chic', 'Formal'],
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=700&auto=format&fit=crop',
    tags: ['navy', 'blue', 'blouse', 'silk', 'work', 'formal'],
    favorite: true
  },

  // ── 6. BEIGE COTTON TEE ──
  {
    name: 'Essential Oversized Cotton Tee',
    category: 'T-Shirt',
    subCategory: 'Crew Neck',
    color: 'Beige',
    primaryColor: '#d2b48c',
    secondaryColors: ['Cream'],
    material: 'Heavyweight Cotton',
    brand: 'Uniqlo U',
    price: 35,
    rating: 4.7,
    season: ['Spring', 'Summer', 'Autumn'],
    occasion: ['Casual', 'College', 'Sports'],
    style: ['Casual', 'Minimalist', 'Streetwear'],
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=700&auto=format&fit=crop',
    tags: ['beige', 'tee', 't-shirt', 'casual', 'cotton', 'summer'],
    favorite: false
  },

  // ── 7. BLACK CASHMERE KNIT SWEATER ──
  {
    name: 'Black Cashmere Turtleneck Sweater',
    category: 'Shirt',
    subCategory: 'Sweater',
    color: 'Black',
    primaryColor: '#222222',
    secondaryColors: ['Charcoal'],
    material: '100% Mongolian Cashmere',
    brand: 'Everlane',
    price: 140,
    rating: 4.9,
    season: ['Autumn', 'Winter', 'Spring'],
    occasion: ['Work', 'Casual', 'Dinner'],
    style: ['Minimalist', 'Chic'],
    imageUrl: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=700&auto=format&fit=crop',
    tags: ['black', 'sweater', 'cashmere', 'knit', 'winter', 'warm'],
    favorite: true
  },

  // ── 8. CHAMPAGNE SILK CAMISOLE TOP ──
  {
    name: 'Champagne Silk Cowl Neck Camisole Top',
    category: 'Shirt',
    subCategory: 'Party Top',
    color: 'Beige',
    primaryColor: '#f5e6d3',
    secondaryColors: ['Champagne', 'Cream'],
    material: 'Mulberry Silk Satin',
    brand: 'Zara Studio',
    price: 59,
    rating: 4.8,
    season: ['Summer', 'Spring', 'Party'],
    occasion: ['Party', 'Dinner', 'Date night'],
    style: ['Chic', 'Glamour'],
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&auto=format&fit=crop',
    tags: ['beige', 'top', 'silk', 'party', 'dinner', 'satin'],
    favorite: true
  },

  // ── 9. LITTLE BLACK COCKTAIL DRESS ──
  {
    name: 'Little Black Cocktail Dress',
    category: 'Dress',
    subCategory: 'Cocktail',
    color: 'Black',
    primaryColor: '#222222',
    secondaryColors: ['Noir'],
    material: 'Crepe Silk',
    brand: 'DVF',
    price: 180,
    rating: 4.9,
    season: ['Spring', 'Summer', 'Autumn', 'Winter'],
    occasion: ['Party', 'Dinner', 'Formal', 'Wedding'],
    style: ['Chic', 'Formal'],
    imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&auto=format&fit=crop',
    tags: ['black', 'dress', 'cocktail', 'party', 'formal', 'dinner'],
    favorite: true
  },

  // ── 10. ROYAL BANARASI CRIMSON SILK SAREE ──
  {
    name: 'Royal Banarasi Crimson Silk Saree',
    category: 'Dress',
    subCategory: 'Saree',
    color: 'Red',
    primaryColor: '#b91c1c',
    secondaryColors: ['Crimson', 'Gold'],
    pattern: 'Woven Zari Motif',
    material: 'Pure Mulberry Silk with Gold Zari',
    brand: 'Raw Mango',
    price: 260,
    rating: 5.0,
    season: ['Spring', 'Autumn', 'Winter'],
    occasion: ['Wedding', 'Festival', 'Formal', 'Traditional'],
    style: ['Ethnic', 'Traditional', 'Regal'],
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&auto=format&fit=crop',
    tags: ['red', 'crimson', 'saree', 'banarasi', 'silk', 'traditional', 'wedding', 'festival'],
    favorite: true
  },

  // ── 11. EMERALD LUCKNOWI CHIKANKARI ANARKALI SUIT ──
  {
    name: 'Emerald Lucknowi Chikankari Anarkali Suit',
    category: 'Dress',
    subCategory: 'Anarkali',
    color: 'Emerald',
    primaryColor: '#059669',
    secondaryColors: ['Gold', 'Mint'],
    pattern: 'Chikankari Hand Embroidery',
    material: 'Georgette with Chikankari Hand Embroidery',
    brand: 'Tarun Tahiliani',
    price: 240,
    rating: 4.9,
    season: ['Spring', 'Summer', 'Autumn', 'Winter'],
    occasion: ['Festival', 'Wedding', 'Formal', 'Traditional'],
    style: ['Ethnic', 'Traditional', 'Elegant'],
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&auto=format&fit=crop',
    tags: ['emerald', 'green', 'anarkali', 'suit', 'traditional', 'chikankari', 'festival'],
    favorite: true
  },

  // ── 12. CLASSIC INDIGO JEANS ──
  {
    name: 'Classic Indigo Straight-Leg Jeans',
    category: 'Jeans',
    subCategory: 'Straight Jeans',
    color: 'Blue',
    primaryColor: '#2563eb',
    secondaryColors: ['Indigo'],
    material: '100% Raw Denim Cotton',
    brand: "Levi's 501",
    price: 98,
    rating: 4.8,
    season: ['Spring', 'Summer', 'Autumn', 'Winter'],
    occasion: ['Casual', 'College', 'Travel'],
    style: ['Casual', 'Streetwear'],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=700&auto=format&fit=crop',
    tags: ['blue', 'jeans', 'indigo', 'denim', 'casual', 'college'],
    favorite: true
  },

  // ── 13. VINTAGE WASHED BLACK SLIM JEANS ──
  {
    name: 'Vintage Washed Black Slim Jeans',
    category: 'Jeans',
    subCategory: 'Slim Jeans',
    color: 'Black',
    primaryColor: '#222222',
    secondaryColors: ['Charcoal'],
    material: 'Stretch Denim Cotton',
    brand: 'Acne Studios',
    price: 110,
    rating: 4.9,
    season: ['Spring', 'Summer', 'Autumn', 'Winter'],
    occasion: ['Casual', 'College', 'Party'],
    style: ['Streetwear', 'Casual'],
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=700&auto=format&fit=crop',
    tags: ['black', 'jeans', 'denim', 'slim', 'casual', 'party'],
    favorite: true
  },

  // ── 14. TAILORED WIDE-LEG GREY TROUSERS ──
  {
    name: 'Tailored Wide-Leg Grey Trousers',
    category: 'Trousers',
    subCategory: 'Wide-Leg',
    color: 'Grey',
    primaryColor: '#888888',
    secondaryColors: ['Slate'],
    material: 'Virgin Wool Blend',
    brand: 'COS',
    price: 125,
    rating: 4.8,
    season: ['Autumn', 'Winter', 'Spring'],
    occasion: ['Work', 'Formal', 'Dinner'],
    style: ['Formal', 'Chic', 'Minimalist'],
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=700&auto=format&fit=crop',
    tags: ['grey', 'trousers', 'pants', 'formal', 'work', 'wool'],
    favorite: true
  },

  // ── 15. PLEATED A-LINE MIDI SKIRT ──
  {
    name: 'Pleated A-Line Midi Skirt',
    category: 'Skirt',
    subCategory: 'Midi',
    color: 'Emerald',
    primaryColor: '#059669',
    secondaryColors: ['Forest Green'],
    material: 'Satin Twill',
    brand: 'Massimo Dutti',
    price: 89,
    rating: 4.8,
    season: ['Spring', 'Summer', 'Autumn'],
    occasion: ['Party', 'Dinner', 'Casual'],
    style: ['Chic', 'Romantic'],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=700&auto=format&fit=crop',
    tags: ['emerald', 'green', 'skirt', 'midi', 'pleated', 'chic'],
    favorite: true
  },

  // ── 16. CAMEL WOOL COAT ──
  {
    name: 'Double-Breasted Camel Wool Coat',
    category: 'Jacket',
    subCategory: 'Overcoat',
    color: 'Beige',
    primaryColor: '#d2b48c',
    secondaryColors: ['Camel'],
    material: 'Italian Wool & Cashmere',
    brand: 'Max Mara Studio',
    price: 340,
    rating: 4.9,
    season: ['Autumn', 'Winter'],
    occasion: ['Work', 'Formal', 'Dinner', 'Casual'],
    style: ['Chic', 'Formal', 'Minimalist'],
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=700&auto=format&fit=crop',
    tags: ['beige', 'camel', 'coat', 'wool', 'winter', 'jacket', 'outerwear'],
    favorite: true
  },

  // ── 17. STRUCTURED MIDNIGHT NAVY BLAZER ──
  {
    name: 'Structured Midnight Navy Blazer',
    category: 'Jacket',
    subCategory: 'Blazer',
    color: 'Navy',
    primaryColor: '#1e3a8a',
    secondaryColors: ['Dark Blue'],
    material: 'Fine Worsted Wool',
    brand: 'Sandro',
    price: 195,
    rating: 4.8,
    season: ['Spring', 'Autumn', 'Winter'],
    occasion: ['Work', 'Formal', 'Dinner', 'College'],
    style: ['Formal', 'Chic'],
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=700&auto=format&fit=crop',
    tags: ['navy', 'blue', 'blazer', 'jacket', 'work', 'formal'],
    favorite: true
  },

  // ── 18. HANDCRAFTED VELVET JUTTIS ──
  {
    name: 'Handcrafted Zari Embroidered Velvet Juttis',
    category: 'Shoes',
    subCategory: 'Ethnic Juttis',
    color: 'Gold',
    primaryColor: '#d4af37',
    secondaryColors: ['Burgundy'],
    pattern: 'Gold Zardozi Embroidery',
    material: 'Plush Velvet with Pure Gold Zardozi Embroidery',
    brand: 'Needledust',
    price: 75,
    rating: 5.0,
    season: ['Spring', 'Summer', 'Autumn', 'Winter'],
    occasion: ['Wedding', 'Festival', 'Party', 'Traditional'],
    style: ['Ethnic', 'Traditional', 'Chic'],
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700&auto=format&fit=crop',
    tags: ['gold', 'juttis', 'shoes', 'traditional', 'velvet', 'wedding'],
    favorite: true
  },

  // ── 19. MINIMALIST CLEAN WHITE SNEAKERS ──
  {
    name: 'Minimalist Clean White Sneakers',
    category: 'Shoes',
    subCategory: 'Sneakers',
    color: 'White',
    primaryColor: '#ffffff',
    secondaryColors: ['Off-White'],
    material: 'Full-Grain Italian Nappa Leather',
    brand: 'Common Projects',
    price: 110,
    rating: 4.9,
    season: ['Spring', 'Summer', 'Autumn', 'Winter'],
    occasion: ['Casual', 'College', 'Sports', 'Travel'],
    style: ['Casual', 'Minimalist', 'Streetwear'],
    imageUrl: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=700&auto=format&fit=crop',
    tags: ['white', 'sneakers', 'shoes', 'casual', 'leather'],
    favorite: true
  },

  // ── 20. POLISHED BLACK LEATHER LOAFERS ──
  {
    name: 'Polished Black Leather Loafers',
    category: 'Shoes',
    subCategory: 'Loafers',
    color: 'Black',
    primaryColor: '#222222',
    secondaryColors: ['Noir'],
    material: 'Calfskin Leather',
    brand: 'Gucci 1953',
    price: 130,
    rating: 4.8,
    season: ['Spring', 'Summer', 'Autumn', 'Winter'],
    occasion: ['Work', 'Formal', 'Casual'],
    style: ['Formal', 'Chic', 'Minimalist'],
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=700&auto=format&fit=crop',
    tags: ['black', 'loafers', 'shoes', 'leather', 'formal', 'work'],
    favorite: true
  },

  // ── 21. ITALIAN LEATHER REVERSIBLE BELT ──
  {
    name: 'Italian Leather Reversible Belt',
    category: 'Accessories',
    subCategory: 'Belt',
    color: 'Black',
    primaryColor: '#222222',
    secondaryColors: ['Brown'],
    material: 'Florentine Leather with Brushed Gold Buckle',
    brand: 'Ferragamo',
    price: 85,
    rating: 4.7,
    season: ['Spring', 'Summer', 'Autumn', 'Winter'],
    occasion: ['Work', 'Formal', 'Casual'],
    style: ['Chic', 'Formal'],
    imageUrl: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=700&auto=format&fit=crop',
    tags: ['black', 'belt', 'leather', 'accessory', 'formal'],
    favorite: true
  }
];

async function syncVerifiedWardrobe() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ email: 'user@wardrobewise.com' });
  const elena = await User.findOne({ email: 'elena@wardrobewise.com' });

  console.log('Wiping old outdated items and resetting with verified catalog...');
  await ClothingItem.deleteMany({});

  console.log(`Inserting ${VERIFIED_CATALOG.length} precisely aligned clothing items...`);

  const accounts = [
    user ? { userId: user._id, label: 'Ayushi Singh' } : null,
    elena ? { userId: elena._id, label: 'Elena Rostova' } : null
  ].filter(Boolean);

  for (const account of accounts) {
    console.log(`Populating account: ${account.label}...`);
    for (const itemDef of VERIFIED_CATALOG) {
      const description = generateClothingDescription(itemDef);
      const text_embedding = generateTextEmbedding(
        `${itemDef.name} ${itemDef.category} ${itemDef.subCategory || ''} ${itemDef.color} ${itemDef.material || ''} ${itemDef.style?.join(' ') || ''} ${itemDef.occasion?.join(' ') || ''} ${itemDef.season?.join(' ') || ''}`
      );
      const image_embedding = generateVisualEmbedding({
        category: itemDef.category,
        dominantColor: itemDef.color,
        pattern: itemDef.pattern || 'Plain',
        aspectRatio: 1.2
      });

      await ClothingItem.create({
        ...itemDef,
        userId: account.userId,
        description,
        text_embedding,
        image_embedding,
        isEstimated: false
      });
    }
  }

  const total = await ClothingItem.countDocuments({});
  console.log(`\nDONE! Total clean items in database: ${total}`);
  await mongoose.disconnect();
}

syncVerifiedWardrobe().catch((err) => {
  console.error('Error syncing:', err);
  process.exit(1);
});
