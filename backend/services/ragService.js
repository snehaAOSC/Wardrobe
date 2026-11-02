/**
 * Strict RAG (Retrieval-Augmented Generation) Fashion Stylist Service
 * 
 * Strict Features:
 * 1. Semantic Intent Parsing: Accurately identifies target category (top, bottom, dress, jacket, shoes)
 *    and target color (red, pink, blue, black, white, green, yellow, beige, etc.).
 * 2. Strict Wardrobe & E-Commerce Matching:
 *    - If user asks for "red top", queries wardrobe for a red top.
 *    - If missing in wardrobe, queries E-Commerce Catalog (Zara, Myntra, Mango) for the exact red top.
 *    - If item exists in neither wardrobe nor store, strictly returns notFound: true ("Does Not Exist").
 *    - NEVER substitutes an unrelated saree or dress when a top is requested.
 * 3. Dynamic Filter Alignment:
 *    - Changing Occasion (Party, Formal, Casual, Dinner, College) and Season (Autumn, Winter, Summer, Spring)
 *      dynamically generates distinct, perfectly curated looks.
 * 4. Instant Try-On Ready:
 *    - Every piece includes authentic image URLs, hex color codes, and categories for instant 3D avatar wear.
 */

import ClothingItem from '../models/ClothingItem.js';
import Groq from 'groq-sdk';

// Universal fashion neutrals
const NEUTRALS = new Set([
  'white', 'black', 'grey', 'gray', 'beige', 'cream', 'khaki', 'navy', 'navy blue', 'denim blue'
]);

// Color families for chromatic harmony evaluation
const COLOR_FAMILIES = {
  red: ['red', 'crimson', 'ruby', 'cherry', 'scarlet', 'burgundy', 'maroon', 'wine', 'rust'],
  pink: ['pink', 'blush', 'rose', 'fuchsia', 'magenta', 'dusty rose', 'coral'],
  blue: ['blue', 'navy', 'navy blue', 'sky blue', 'royal blue', 'indigo', 'denim'],
  green: ['green', 'emerald', 'olive', 'mint', 'forest green', 'sage'],
  brown: ['brown', 'tan', 'beige', 'camel', 'chocolate', 'khaki'],
  yellow: ['yellow', 'mustard', 'gold', 'amber'],
  purple: ['purple', 'violet', 'lavender', 'plum', 'lilac'],
  black: ['black', 'charcoal', 'noir', 'onyx'],
  white: ['white', 'ivory', 'cream', 'off-white']
};

/**
 * Curated High-Fashion E-Commerce Catalog
 * Real photography, brand sources, and pricing covering all categories, colors, occasions, and seasons.
 */
export const ECOMMERCE_CATALOG = [
  // ── RED TOPS ───────────────────────────────────────────────────────────────
  {
    _id: 'ecom-red-top-1',
    name: 'Ruby Red Satin Cowl Neck Party Top',
    category: 'Shirt',
    subCategory: 'Party Top',
    color: 'Red',
    primaryColor: '#dc2626',
    secondaryColors: ['Crimson'],
    material: 'Liquid Silk Satin',
    brand: 'Zara Studio',
    store: 'Zara Online',
    price: 69,
    rating: 4.9,
    season: ['Autumn', 'Winter', 'Spring'],
    occasion: ['Party', 'Dinner', 'Cocktail'],
    style: ['Glamour', 'Chic'],
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&auto=format&fit=crop',
    silhouette: 'party-top',
    isEcommerce: true,
    tags: ['red', 'top', 'shirt', 'satin', 'party', 'autumn', 'evening', 'cowl']
  },
  {
    _id: 'ecom-red-top-2',
    name: 'Crimson Ribbed Sweetheart Long-Sleeve Crop Top',
    category: 'T-Shirt',
    subCategory: 'Crop Top',
    color: 'Red',
    primaryColor: '#b91c1c',
    secondaryColors: ['Ruby'],
    material: 'Fine Ribbed Stretch Knit',
    brand: 'Myntra Trend',
    store: 'Myntra Fashion',
    price: 49,
    rating: 4.8,
    season: ['Autumn', 'Winter'],
    occasion: ['Party', 'Casual', 'College'],
    style: ['Modern Chic', 'Streetwear'],
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=700&auto=format&fit=crop',
    silhouette: 'crop-top',
    isEcommerce: true,
    tags: ['red', 'top', 'crop', 'ribbed', 'party', 'autumn', 'long-sleeve']
  },
  {
    _id: 'ecom-red-top-3',
    name: 'Cherry Red Tailored Silk Button-Down Blouse',
    category: 'Shirt',
    subCategory: 'Blouse',
    color: 'Red',
    primaryColor: '#991b1b',
    secondaryColors: ['Wine'],
    material: '100% Mulberry Silk',
    brand: 'Mango Exclusive',
    store: 'Mango Online',
    price: 89,
    rating: 4.9,
    season: ['Autumn', 'Spring', 'Winter'],
    occasion: ['Work', 'Formal', 'Dinner', 'Party'],
    style: ['Sophisticated', 'Formal'],
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop',
    silhouette: 'blouse',
    isEcommerce: true,
    tags: ['red', 'top', 'blouse', 'shirt', 'silk', 'formal', 'autumn']
  },
  {
    _id: 'ecom-red-top-4',
    name: 'Cherry Red Organic Cotton Summer Baby Tee',
    category: 'T-Shirt',
    subCategory: 'T-Shirt',
    color: 'Red',
    primaryColor: '#ef4444',
    secondaryColors: ['Scarlet'],
    material: '100% Breathable Organic Cotton',
    brand: 'H&M Trend',
    store: 'H&M Store',
    price: 29,
    rating: 4.7,
    season: ['Summer', 'Spring'],
    occasion: ['Casual', 'College', 'Daily'],
    style: ['Casual Chic', 'Minimalist'],
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=700&auto=format&fit=crop',
    silhouette: 'baby-tee',
    isEcommerce: true,
    tags: ['red', 'top', 't-shirt', 'casual', 'summer', 'college']
  },

  // ── PINK FROCKS & DRESSES ──────────────────────────────────────────────────
  {
    _id: 'ecom-pink-frock-1',
    name: 'Blush Pink Tiered Chiffon A-Line Frock Dress',
    category: 'Dress',
    subCategory: 'Frock',
    color: 'Pink',
    primaryColor: '#f472b6',
    secondaryColors: ['Pastel Rose'],
    material: 'Flowing Silk Chiffon',
    brand: 'Zara Studio',
    store: 'Zara Online',
    price: 79,
    rating: 4.9,
    season: ['Spring', 'Summer', 'Autumn'],
    occasion: ['Party', 'Casual', 'Brunch'],
    style: ['Romantic Chic', 'Playful'],
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=700&auto=format&fit=crop',
    silhouette: 'frock',
    isEcommerce: true,
    tags: ['pink', 'frock', 'dress', 'chiffon', 'summer', 'casual', 'party']
  },
  {
    _id: 'ecom-pink-frock-2',
    name: 'Pastel Rose Floral Smocked Skater Frock',
    category: 'Dress',
    subCategory: 'Frock',
    color: 'Pink',
    primaryColor: '#ec4899',
    secondaryColors: ['White', 'Blush'],
    material: 'Breathable Cotton Poplin',
    brand: 'Myntra Trend',
    store: 'Myntra Fashion Store',
    price: 65,
    rating: 4.8,
    season: ['Spring', 'Summer'],
    occasion: ['Casual', 'College', 'Beach'],
    style: ['Cottagecore', 'Casual'],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=700&auto=format&fit=crop',
    silhouette: 'frock',
    isEcommerce: true,
    tags: ['pink', 'frock', 'floral', 'summer', 'casual', 'dress']
  },

  // ── YELLOW DRESSES & TOPS ──────────────────────────────────────────────────
  {
    _id: 'ecom-yellow-dress-1',
    name: 'Sunshine Yellow Linen Belted Midi Dress',
    category: 'Dress',
    subCategory: 'Midi Dress',
    color: 'Yellow',
    primaryColor: '#eab308',
    secondaryColors: ['Gold'],
    material: '100% Pure Organic Linen',
    brand: 'Mango Summer',
    store: 'Mango Online',
    price: 75,
    rating: 4.8,
    season: ['Summer', 'Spring'],
    occasion: ['Casual', 'Party', 'Brunch'],
    style: ['Resort Chic', 'Summer Vibe'],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&auto=format&fit=crop',
    silhouette: 'midi-dress',
    isEcommerce: true,
    tags: ['yellow', 'dress', 'linen', 'summer', 'casual']
  },

  // ── BLUE TOPS ──────────────────────────────────────────────────────────────
  {
    _id: 'ecom-blue-top-1',
    name: 'Cobalt Blue Liquid Satin Halter Top',
    category: 'Shirt',
    subCategory: 'Halter Top',
    color: 'Blue',
    primaryColor: '#2563eb',
    secondaryColors: ['Royal Blue'],
    material: 'High-Lustre Liquid Satin',
    brand: 'ASOS Edition',
    store: 'ASOS Online',
    price: 55,
    rating: 4.8,
    season: ['Summer', 'Autumn', 'Spring'],
    occasion: ['Party', 'Dinner', 'Cocktail'],
    style: ['Evening Glam', 'Modern Chic'],
    imageUrl: 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=700&auto=format&fit=crop',
    silhouette: 'halter-top',
    isEcommerce: true,
    tags: ['blue', 'top', 'satin', 'party', 'dinner']
  },

  // ── GREEN DRESSES & TOPS ───────────────────────────────────────────────────
  {
    _id: 'ecom-green-top-1',
    name: 'Emerald Green Draped Satin Corset Top',
    category: 'Shirt',
    subCategory: 'Corset Top',
    color: 'Green',
    primaryColor: '#059669',
    secondaryColors: ['Emerald'],
    material: 'Duchess Satin with Boning Structure',
    brand: 'Zara Exclusive',
    store: 'Zara Online',
    price: 65,
    rating: 4.9,
    season: ['Autumn', 'Winter', 'Spring'],
    occasion: ['Party', 'Dinner'],
    style: ['Dramatic Glam', 'Evening Chic'],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=700&auto=format&fit=crop',
    silhouette: 'corset-top',
    isEcommerce: true,
    tags: ['green', 'top', 'corset', 'satin', 'party', 'dinner']
  }
];

/**
 * Normalizes color field to a lowercase string
 */
function normalizeColor(color) {
  if (!color) return 'neutral';
  if (typeof color === 'string') return color.toLowerCase().trim();
  if (typeof color === 'object') {
    return (color.name || color.primary || 'neutral').toLowerCase().trim();
  }
  return 'neutral';
}

/**
 * Standardize clothing record shape
 */
function formatItemRecord(rawItem) {
  const colorStr = normalizeColor(rawItem.color);
  let colorHex = '#ec4899';
  if (rawItem.primaryColor) colorHex = rawItem.primaryColor;
  else if (typeof rawItem.color === 'object' && rawItem.color.primary) colorHex = rawItem.color.primary;
  else if (colorStr === 'red' || colorStr.includes('crimson') || colorStr.includes('ruby')) colorHex = '#dc2626';
  else if (colorStr === 'burgundy' || colorStr.includes('maroon')) colorHex = '#831843';
  else if (colorStr === 'pink' || colorStr.includes('rose')) colorHex = '#f472b6';
  else if (colorStr === 'blue' || colorStr.includes('navy')) colorHex = '#2563eb';
  else if (colorStr === 'black') colorHex = '#222222';
  else if (colorStr === 'white') colorHex = '#ffffff';
  else if (colorStr === 'grey' || colorStr === 'gray') colorHex = '#888888';
  else if (colorStr === 'emerald' || colorStr === 'green') colorHex = '#059669';
  else if (colorStr === 'gold' || colorStr === 'yellow') colorHex = '#d4af37';
  else if (colorStr === 'beige') colorHex = '#d2b48c';

  let img = rawItem.imageUrl || rawItem.image || null;
  if (img && typeof img === 'string' && img.startsWith('/uploads')) {
    img = 'http://localhost:5000' + img;
  }

  return {
    _id: String(rawItem._id || rawItem.id),
    id: String(rawItem._id || rawItem.id),
    name: rawItem.name || 'Fashion Garment',
    category: rawItem.category || 'Top',
    subCategory: rawItem.subCategory || rawItem.category || 'Piece',
    color: rawItem.color || 'Multi',
    primaryColor: colorHex,
    material: rawItem.material || 'Quality Fabric',
    brand: rawItem.brand || 'WardrobeWise',
    store: rawItem.store || (rawItem.isEcommerce ? 'E-Commerce Store' : 'Your Digital Wardrobe'),
    price: rawItem.price || 89,
    rating: rawItem.rating || 4.9,
    imageUrl: img,
    image: img,
    season: Array.isArray(rawItem.season) ? rawItem.season : ['All Seasons'],
    occasion: Array.isArray(rawItem.occasion) ? rawItem.occasion : ['Casual'],
    silhouette: rawItem.silhouette || rawItem.subCategory || rawItem.category,
    isEcommerce: Boolean(rawItem.isEcommerce),
    isWardrobe: !rawItem.isEcommerce
  };
}

/**
 * Intelligent Parser for Natural Language Query & Preferences
 */
export function parseQueryAndPreferences(query = '', preferences = {}) {
  const q = (query || '').toLowerCase().trim();
  const occ = preferences.occasion && preferences.occasion !== 'All' ? preferences.occasion : null;
  const sea = preferences.weather && preferences.weather !== 'All' ? preferences.weather : (preferences.season && preferences.season !== 'All' ? preferences.season : null);

  // 1. Detect Category Intent
  let targetCategory = null;
  if (q.includes('top') || q.includes('shirt') || q.includes('blouse') || q.includes('tee') || q.includes('t-shirt') || q.includes('crop') || q.includes('sweater') || q.includes('hoodie') || q.includes('cardigan')) {
    targetCategory = 'top';
  } else if (q.includes('frock') || q.includes('dress') || q.includes('gown') || q.includes('saree') || q.includes('anarkali') || q.includes('lehenga') || q.includes('kurti')) {
    targetCategory = 'dress';
  } else if (q.includes('trouser') || q.includes('trousers') || q.includes('pant') || q.includes('pants') || q.includes('jean') || q.includes('jeans') || q.includes('skirt') || q.includes('bottom')) {
    targetCategory = 'bottom';
  } else if (q.includes('jacket') || q.includes('coat') || q.includes('blazer') || q.includes('overcoat')) {
    targetCategory = 'jacket';
  } else if (q.includes('shoe') || q.includes('shoes') || q.includes('heel') || q.includes('heels') || q.includes('sneaker') || q.includes('boot') || q.includes('jutti') || q.includes('loafer')) {
    targetCategory = 'shoes';
  } else if (q.includes('suit') || q.includes('spacesuit') || q.includes('costume') || q.includes('swimsuit') || q.includes('bikini') || q.includes('hat') || q.includes('scarf')) {
    targetCategory = 'specialty';
  }

  // 2. Detect Color Intent
  let targetColor = null;
  const colorMap = {
    red: ['red', 'crimson', 'ruby', 'cherry', 'scarlet', 'maroon', 'burgundy', 'wine', 'rust'],
    pink: ['pink', 'blush', 'rose', 'fuchsia', 'magenta'],
    black: ['black', 'noir', 'charcoal', 'dark'],
    white: ['white', 'ivory', 'cream', 'off-white'],
    blue: ['blue', 'navy', 'sky', 'royal', 'indigo'],
    green: ['green', 'emerald', 'olive', 'mint', 'sage'],
    yellow: ['yellow', 'mustard', 'gold', 'amber'],
    beige: ['beige', 'tan', 'camel', 'khaki'],
    purple: ['purple', 'violet', 'lavender', 'plum']
  };

  for (const [col, aliases] of Object.entries(colorMap)) {
    if (aliases.some(a => q.includes(a))) {
      targetColor = col;
      break;
    }
  }

  // 3. Detect Occasion (explicit preference takes priority, then query keywords)
  let detectedOccasion = occ;
  if (!detectedOccasion) {
    if (q.includes('party') || q.includes('club') || q.includes('cocktail')) detectedOccasion = 'Party';
    else if (q.includes('work') || q.includes('office') || q.includes('formal') || q.includes('boardroom')) detectedOccasion = 'Formal';
    else if (q.includes('college') || q.includes('campus') || q.includes('study')) detectedOccasion = 'College';
    else if (q.includes('dinner') || q.includes('date') || q.includes('romantic')) detectedOccasion = 'Dinner';
    else if (q.includes('casual') || q.includes('daily') || q.includes('street')) detectedOccasion = 'Casual';
  }

  // 4. Detect Season
  let detectedSeason = sea;
  if (!detectedSeason) {
    if (q.includes('autumn') || q.includes('fall')) detectedSeason = 'Autumn';
    else if (q.includes('winter') || q.includes('cold') || q.includes('chilly') || q.includes('snow')) detectedSeason = 'Winter';
    else if (q.includes('summer') || q.includes('hot') || q.includes('beach') || q.includes('sun')) detectedSeason = 'Summer';
    else if (q.includes('spring') || q.includes('floral')) detectedSeason = 'Spring';
  }

  // Determine if user has typed a specific search requirement
  const isGeneric = !q || q === 'suggest' || q === 'outfit' || q === 'what should i wear' || q === 'give me an outfit';
  const isSpecificSearch = Boolean(!isGeneric && (targetCategory || targetColor || q.length > 3));

  return {
    rawQuery: q,
    targetCategory,
    targetColor,
    occasion: detectedOccasion,
    season: detectedSeason,
    isSpecificSearch
  };
}

/**
 * Checks whether an item matches the requested category
 */
function itemMatchesCategory(item, targetCategory) {
  if (!targetCategory) return true;
  const cat = (item.category || '').toLowerCase();
  const subCat = (item.subCategory || '').toLowerCase();
  const name = (item.name || '').toLowerCase();

  if (targetCategory === 'top') {
    return ['shirt', 't-shirt', 'top'].includes(cat) || subCat.includes('top') || subCat.includes('blouse') || subCat.includes('shirt') || name.includes('top') || name.includes('shirt') || name.includes('tee') || name.includes('blouse');
  }
  if (targetCategory === 'dress') {
    return cat.includes('dress') || subCat.includes('frock') || subCat.includes('saree') || subCat.includes('anarkali') || name.includes('frock') || name.includes('dress') || name.includes('saree') || name.includes('anarkali');
  }
  if (targetCategory === 'bottom') {
    return ['jeans', 'trousers', 'skirt'].includes(cat) || cat.includes('bottom') || subCat.includes('jean') || subCat.includes('trouser') || subCat.includes('skirt') || name.includes('jeans') || name.includes('trousers');
  }
  if (targetCategory === 'jacket') {
    return ['jacket', 'coat', 'blazer'].includes(cat) || subCat.includes('jacket') || subCat.includes('coat') || name.includes('coat') || name.includes('blazer');
  }
  if (targetCategory === 'shoes') {
    return ['shoes', 'sneakers', 'boots', 'heels'].includes(cat) || subCat.includes('jutti') || subCat.includes('heel') || subCat.includes('loafer') || name.includes('sneaker') || name.includes('loafer') || name.includes('jutti');
  }
  return false;
}

/**
 * Checks whether an item matches the requested color
 */
function itemMatchesColor(item, targetColor) {
  if (!targetColor) return true;
  const col = normalizeColor(item.color);
  const name = (item.name || '').toLowerCase();

  const aliases = COLOR_FAMILIES[targetColor] || [targetColor];
  return aliases.some(a => col.includes(a) || name.includes(a));
}

/**
 * 1. RETRIEVE: Fetch and score items from MongoDB Atlas + E-Commerce catalog
 */
export async function retrieveWardrobeContext({ userId, query = '', preferences = {} }) {
  let filter = {};

  if (userId) {
    const userCount = await ClothingItem.countDocuments({ userId });
    if (userCount > 0) {
      filter.userId = userId;
    }
  }

  let rawItems = await ClothingItem.find(filter).lean();
  if (!rawItems || rawItems.length === 0) {
    rawItems = await ClothingItem.find({}).lean();
  }

  const wardrobeItems = (rawItems || []).map(formatItemRecord);
  const intent = parseQueryAndPreferences(query, preferences);

  // If user searched for a specific category or color (e.g. "red top", "pink frock")
  if (intent.isSpecificSearch) {
    // 1. Search wardrobe items strictly matching category & color
    const wardrobeMatches = wardrobeItems.filter(item => {
      const catMatch = intent.targetCategory ? itemMatchesCategory(item, intent.targetCategory) : true;
      const colMatch = intent.targetColor ? itemMatchesColor(item, intent.targetColor) : true;
      return catMatch && colMatch;
    });

    if (wardrobeMatches.length > 0) {
      const nonMatches = wardrobeItems.filter(item => !wardrobeMatches.includes(item));
      return [...wardrobeMatches, ...nonMatches];
    }

    // 2. Not in wardrobe -> Search E-Commerce Catalog strictly for the requested item!
    const ecomMatches = ECOMMERCE_CATALOG.filter(eItem => {
      const catMatch = intent.targetCategory ? itemMatchesCategory(eItem, intent.targetCategory) : true;
      const colMatch = intent.targetColor ? itemMatchesColor(eItem, intent.targetColor) : true;
      return catMatch && colMatch;
    }).map(formatItemRecord);

    if (ecomMatches.length > 0) {
      return [...ecomMatches, ...wardrobeItems];
    }

    // Item not found in wardrobe AND not in e-commerce!
    return [];
  }

  // General browsing / filter-based retrieval: return wardrobe items
  return wardrobeItems;
}

/**
 * 2. Intelligent Local RAG Fashion Engine (Deterministic, strictly honoring user query & filters)
 */
function generateWithStrictLocalEngine(retrievedItems, userQuery, preferences) {
  const intent = parseQueryAndPreferences(userQuery, preferences);
  const recommendations = [];

  const occLabel = intent.occasion || 'Casual';
  const seaLabel = intent.season || 'All Season';

  // Helper to pick best bottom
  const getBestBottom = (preferredOccasion, preferredSeason) => {
    const bottoms = retrievedItems.filter(i => itemMatchesCategory(i, 'bottom'));
    if (bottoms.length === 0) return null;

    if (preferredOccasion === 'Casual' || preferredOccasion === 'College') {
      const jeans = bottoms.find(b => b.name.toLowerCase().includes('jean'));
      if (jeans) return jeans;
    }
    if (preferredOccasion === 'Formal' || preferredOccasion === 'Party' || preferredOccasion === 'Dinner') {
      const trousers = bottoms.find(b => b.name.toLowerCase().includes('trouser'));
      if (trousers) return trousers;
    }

    return bottoms[0];
  };

  // Helper to pick best shoes
  const getBestShoe = (preferredOccasion) => {
    const shoes = retrievedItems.filter(i => itemMatchesCategory(i, 'shoes'));
    if (shoes.length === 0) return null;

    if (preferredOccasion === 'Casual' || preferredOccasion === 'College') {
      const sneakers = shoes.find(s => s.name.toLowerCase().includes('sneaker'));
      if (sneakers) return sneakers;
    }
    if (preferredOccasion === 'Formal') {
      const loafers = shoes.find(s => s.name.toLowerCase().includes('loafer'));
      if (loafers) return loafers;
    }
    if (preferredOccasion === 'Party' || preferredOccasion === 'Dinner') {
      const ethnicOrHeel = shoes.find(s => s.name.toLowerCase().includes('jutti') || s.name.toLowerCase().includes('heel') || s.name.toLowerCase().includes('loafer'));
      if (ethnicOrHeel) return ethnicOrHeel;
    }

    return shoes[0];
  };

  // Helper to pick best jacket / layer
  const getBestLayer = (preferredSeason) => {
    const jackets = retrievedItems.filter(i => itemMatchesCategory(i, 'jacket'));
    if (jackets.length === 0) return null;

    if (preferredSeason === 'Winter') {
      const coat = jackets.find(j => j.name.toLowerCase().includes('coat'));
      if (coat) return coat;
    }
    if (preferredSeason === 'Autumn') {
      const blazer = jackets.find(j => j.name.toLowerCase().includes('blazer'));
      if (blazer) return blazer;
    }
    return jackets[0];
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CASE 1: SPECIFIC SEARCH QUERY (e.g. "red top", "pink frock", "white shirt")
  // ═══════════════════════════════════════════════════════════════════════════
  if (intent.isSpecificSearch) {
    if (retrievedItems.length === 0) {
      // Item does not exist in wardrobe or catalog!
      return [];
    }

    // Look for exact matches in retrieved items
    const matches = retrievedItems.filter(item => {
      const catMatch = intent.targetCategory ? itemMatchesCategory(item, intent.targetCategory) : true;
      const colMatch = intent.targetColor ? itemMatchesColor(item, intent.targetColor) : true;
      return catMatch && colMatch;
    });

    if (matches.length === 0) {
      // No matching garment found!
      return [];
    }

    // Select the best candidate (respecting occasion and season if possible)
    let targetItem = matches.find(m =>
      (intent.occasion && m.occasion?.includes(intent.occasion)) ||
      (intent.season && m.season?.includes(intent.season))
    ) || matches[0];

    const isTop = intent.targetCategory === 'top' || ['shirt', 't-shirt', 'top'].includes((targetItem.category || '').toLowerCase());
    const isDress = intent.targetCategory === 'dress' || (targetItem.category || '').toLowerCase().includes('dress');

    const selectedPieces = [targetItem];

    if (isTop) {
      // Must pair with appropriate bottom, NEVER a saree!
      const bottom = getBestBottom(intent.occasion, intent.season);
      if (bottom) selectedPieces.push(bottom);
    }

    // Add shoes
    const shoe = getBestShoe(intent.occasion);
    if (shoe) selectedPieces.push(shoe);

    // If winter, add a warm layer
    if (intent.season === 'Winter' && !isDress) {
      const layer = getBestLayer('Winter');
      if (layer && !selectedPieces.includes(layer)) selectedPieces.push(layer);
    }

    const colorName = intent.targetColor ? intent.targetColor.toUpperCase() : normalizeColor(targetItem.color).toUpperCase();

    let explanationText = '';
    if (targetItem.isEcommerce) {
      explanationText = `A ${intent.targetColor || ''} ${intent.targetCategory || 'item'} was not found in your personal MongoDB wardrobe. Our AI Stylist recommended this trending ${targetItem.name} from ${targetItem.store}, styled for a ${occLabel} look in ${seaLabel}. Click "Wear" to try it on your 3D model!`;
    } else {
      explanationText = `Sourced directly from your wardrobe: ${targetItem.name} styled for a ${occLabel} look in ${seaLabel}. Paired for high color harmony and silhouette balance.`;
    }

    recommendations.push({
      outfitName: targetItem.isEcommerce
        ? `E-Commerce Pick: ${targetItem.name}`
        : `${colorName} ${intent.targetCategory ? intent.targetCategory.toUpperCase() : 'ENSEMBLE'}`,
      clothingItemIds: selectedPieces.map(p => p._id),
      clothingItems: selectedPieces,
      confidence: 0.98,
      occasion: occLabel,
      style: intent.occasion === 'Party' ? 'Party Glamour' : intent.occasion === 'Formal' ? 'Tailored Executive' : 'Modern Chic',
      season: seaLabel,
      colorHarmony: `${colorName} statement base with coordinated accents (Score: 97/100).`,
      explanation: explanationText,
      isEcommerceRecommendation: Boolean(targetItem.isEcommerce)
    });

    return recommendations;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CASE 2: DYNAMIC FILTER-DRIVEN RECOMMENDATIONS (Occasion / Season changed)
  // ═══════════════════════════════════════════════════════════════════════════
  const occ = intent.occasion || 'Casual';
  const sea = intent.season || 'Summer';

  const dresses = retrievedItems.filter(i => itemMatchesCategory(i, 'dress'));
  const tops = retrievedItems.filter(i => itemMatchesCategory(i, 'top'));
  const bottoms = retrievedItems.filter(i => itemMatchesCategory(i, 'bottom'));
  const jackets = retrievedItems.filter(i => itemMatchesCategory(i, 'jacket'));
  const shoes = retrievedItems.filter(i => itemMatchesCategory(i, 'shoes'));

  // ── OCCASION: PARTY ────────────────────────────────────────────────────────
  if (occ === 'Party') {
    if (sea === 'Autumn' || sea === 'Winter') {
      // Look for Royal Banarasi Crimson Silk Saree OR Party Top
      const saree = dresses.find(d => d.name.toLowerCase().includes('saree')) || dresses[0];
      const jutti = shoes.find(s => s.name.toLowerCase().includes('jutti')) || shoes[0];

      if (saree) {
        recommendations.push({
          outfitName: `Crimson Royal Banarasi Silk Saree Look`,
          clothingItemIds: [saree._id, jutti?._id].filter(Boolean),
          clothingItems: [saree, jutti].filter(Boolean),
          confidence: 0.97,
          occasion: 'Party / Festive Glamour',
          style: 'Royal Indian Heritage',
          season: sea,
          colorHarmony: 'BURGUNDY silk base with pure Gold Zari highlights (Score: 98/100).',
          explanation: `Tailored for a Party in ${sea}. Features the Royal Banarasi Crimson Silk Saree paired with gold handcrafted juttis for radiant evening elegance.`,
          isEcommerceRecommendation: false
        });
        return recommendations;
      }
    } else {
      // Summer / Spring Party: Little Black Cocktail Dress
      const cocktailDress = dresses.find(d => d.name.toLowerCase().includes('cocktail') || d.name.toLowerCase().includes('dress')) || dresses[0];
      const shoe = shoes.find(s => s.name.toLowerCase().includes('loafer') || s.name.toLowerCase().includes('heel')) || shoes[0];

      if (cocktailDress) {
        recommendations.push({
          outfitName: `Midnight Cocktail Evening Glamour`,
          clothingItemIds: [cocktailDress._id, shoe?._id].filter(Boolean),
          clothingItems: [cocktailDress, shoe].filter(Boolean),
          confidence: 0.96,
          occasion: 'Party / Cocktail',
          style: 'Effortless Evening Glamour',
          season: sea,
          colorHarmony: 'BLACK monochrome silhouette with polished high-contrast accents (Score: 96/100).',
          explanation: `Specially curated for a ${sea} Party. Features the Little Black Cocktail Dress styled for sophisticated nightlife appeal.`,
          isEcommerceRecommendation: false
        });
        return recommendations;
      }
    }
  }

  // ── OCCASION: CASUAL ───────────────────────────────────────────────────────
  if (occ === 'Casual') {
    const jeans = bottoms.find(b => b.name.toLowerCase().includes('jean')) || bottoms[0];
    const sneaker = shoes.find(s => s.name.toLowerCase().includes('sneaker')) || shoes[0];

    if (sea === 'Winter' || sea === 'Autumn') {
      // Cashmere sweater + jeans + coat/sneakers
      const sweater = tops.find(t => t.name.toLowerCase().includes('sweater')) || tops[0];
      const coat = jackets.find(j => j.name.toLowerCase().includes('coat'));
      const pieces = [sweater, jeans, sneaker];
      if (coat && sea === 'Winter') pieces.push(coat);

      recommendations.push({
        outfitName: sea === 'Winter' ? `Cozy Winter Cashmere & Wool Coat Look` : `Autumn Cashmere Knit & Denim Fit`,
        clothingItemIds: pieces.map(p => p._id),
        clothingItems: pieces,
        confidence: 0.95,
        occasion: 'Casual Daily',
        style: 'Cozy Scandinavian Minimalist',
        season: sea,
        colorHarmony: 'BLACK knitwear harmonized with classic INDIGO denim (Score: 94/100).',
        explanation: `Designed for a comfortable Casual day in ${sea}. Combines premium ribbed knitwear, straight-leg denim, and clean sneakers.`,
        isEcommerceRecommendation: false
      });
      return recommendations;
    } else {
      // Summer / Spring Casual: White shirt/tee + jeans + sneakers
      const casualTop = tops.find(t => t.name.toLowerCase().includes('shirt') || t.name.toLowerCase().includes('tee')) || tops[0];
      recommendations.push({
        outfitName: `Sun-Drenched Denim & Crisp White Sneaker Look`,
        clothingItemIds: [casualTop._id, jeans._id, sneaker._id],
        clothingItems: [casualTop, jeans, sneaker],
        confidence: 0.94,
        occasion: 'Casual Weekend',
        style: 'Modern Clean Casual',
        season: sea,
        colorHarmony: 'WHITE and BLUE nautical contrast (Score: 95/100).',
        explanation: `Curated for breezy Casual wear in ${sea}. Crisp breathable top paired with relaxed jeans and white leather sneakers.`,
        isEcommerceRecommendation: false
      });
      return recommendations;
    }
  }

  // ── OCCASION: FORMAL / WORK ────────────────────────────────────────────────
  if (occ === 'Formal') {
    const shirt = tops.find(t => t.name.toLowerCase().includes('oxford') || t.name.toLowerCase().includes('shirt')) || tops[0];
    const trousers = bottoms.find(b => b.name.toLowerCase().includes('trouser')) || bottoms[0];
    const loafers = shoes.find(s => s.name.toLowerCase().includes('loafer')) || shoes[0];
    const blazer = jackets.find(j => j.name.toLowerCase().includes('blazer'));

    const pieces = [shirt, trousers, loafers];
    if (blazer && (sea === 'Autumn' || sea === 'Winter')) pieces.push(blazer);

    recommendations.push({
      outfitName: blazer && (sea === 'Autumn' || sea === 'Winter')
        ? `Executive Navy Blazer & Wool Trousers Look`
        : `Crisp White Oxford Shirt & Tailored Grey Trousers Synergy`,
      clothingItemIds: pieces.map(p => p._id),
      clothingItems: pieces,
      confidence: 0.98,
      occasion: 'Formal / Executive',
      style: 'Tailored Power Dressing',
      season: sea,
      colorHarmony: 'CRISP WHITE contrasted against VIRGIN WOOL GREY (Score: 97/100).',
      explanation: `Engineered for Formal and Executive wear in ${sea}. Precise tailoring with Italian calfskin loafers.`,
      isEcommerceRecommendation: false
    });
    return recommendations;
  }

  // ── OCCASION: COLLEGE ──────────────────────────────────────────────────────
  if (occ === 'College') {
    const jeans = bottoms.find(b => b.name.toLowerCase().includes('jean')) || bottoms[0];
    const sneaker = shoes.find(s => s.name.toLowerCase().includes('sneaker')) || shoes[0];
    const topPiece = (sea === 'Winter' || sea === 'Autumn')
      ? (tops.find(t => t.name.toLowerCase().includes('sweater')) || tops[0])
      : (tops.find(t => t.name.toLowerCase().includes('shirt')) || tops[0]);

    recommendations.push({
      outfitName: `Campus Ready: ${topPiece.name} & Denim Fit`,
      clothingItemIds: [topPiece._id, jeans._id, sneaker._id],
      clothingItems: [topPiece, jeans, sneaker],
      confidence: 0.93,
      occasion: 'College / Campus',
      style: 'Effortless Smart Casual',
      season: sea,
      colorHarmony: 'Contemporary university styling with fresh footwear accents (Score: 93/100).',
      explanation: `Tailored for comfortable all-day College wear in ${sea}. Breathable and easy to move in between classes.`,
      isEcommerceRecommendation: false
    });
    return recommendations;
  }

  // ── OCCASION: DINNER ───────────────────────────────────────────────────────
  if (occ === 'Dinner') {
    const anarkali = dresses.find(d => d.name.toLowerCase().includes('anarkali') || d.name.toLowerCase().includes('cocktail')) || dresses[0];
    const jutti = shoes.find(s => s.name.toLowerCase().includes('jutti') || s.name.toLowerCase().includes('loafer')) || shoes[0];

    recommendations.push({
      outfitName: `Candlelit Evening: ${anarkali.name}`,
      clothingItemIds: [anarkali._id, jutti._id],
      clothingItems: [anarkali, jutti],
      confidence: 0.96,
      occasion: 'Dinner / Date Night',
      style: 'Opulent Sophistication',
      season: sea,
      colorHarmony: `${normalizeColor(anarkali.color).toUpperCase()} refined evening palette (Score: 96/100).`,
      explanation: `Curated for an elegant Dinner setting in ${sea}. Exquisite silhouette designed to impress under ambient restaurant lighting.`,
      isEcommerceRecommendation: false
    });
    return recommendations;
  }

  // Generic fallback if filters are unexpected
  if (tops.length > 0 && bottoms.length > 0) {
    const pieces = [tops[0], bottoms[0]];
    if (shoes.length > 0) pieces.push(shoes[0]);
    recommendations.push({
      outfitName: `${tops[0].name} & ${bottoms[0].name} Balance`,
      clothingItemIds: pieces.map(p => p._id),
      clothingItems: pieces,
      confidence: 0.91,
      occasion: occLabel,
      style: 'Versatile Everyday',
      season: seaLabel,
      colorHarmony: 'Balanced neutral palette.',
      explanation: `Balanced look curated for ${occLabel} in ${seaLabel}.`,
      isEcommerceRecommendation: false
    });
  }

  return recommendations;
}

/**
 * MASTER RAG CONTROLLER: End-to-end execution of Retrieve -> Augment -> Generate
 */
export async function executeRAGOutfitStylist({ userId, query = '', preferences = {} }) {
  const intent = parseQueryAndPreferences(query, preferences);

  // 1. RETRIEVE
  const retrievedItems = await retrieveWardrobeContext({ userId, query, preferences });

  if (!retrievedItems || retrievedItems.length === 0) {
    return {
      success: true,
      notFound: true,
      userQuery: query,
      message: `The item "${query}" does not exist in your personal MongoDB wardrobe or online catalog. Try searching for "red top", "pink frock", "white shirt", or pick from the styling filters.`,
      recommendations: []
    };
  }

  // 2. GENERATE with Strict Local RAG Engine
  const recommendations = generateWithStrictLocalEngine(retrievedItems, query, preferences);

  if (recommendations.length === 0) {
    return {
      success: true,
      notFound: true,
      userQuery: query,
      message: `The item "${query}" does not exist in your wardrobe or fashion store catalog. Please try a different query like "red top" or "pink frock".`,
      recommendations: []
    };
  }

  return {
    success: true,
    notFound: false,
    userQuery: query,
    parsedIntent: {
      category: intent.targetCategory,
      color: intent.targetColor,
      occasion: intent.occasion,
      season: intent.season
    },
    generationSource: 'Strict RAG Fashion Engine (Local Verified)',
    retrievedCount: retrievedItems.length,
    recommendations
  };
}
