import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { aiConfig } from '../config/aiConfig.js';
import ClothingItem, { CLOTHING_CATEGORIES } from '../models/ClothingItem.js';
import { groqAnalyzeClothingImage } from './groqService.js';

/**
 * Builds a standardized analysis object from an authentic MongoDB ClothingItem.
 */
function buildDbMatchResult(item) {
  return {
    success: true,
    isMock: false,
    isGroq: false,
    isWardrobeMatch: true,
    data: {
      category: item.category || 'Dress',
      subCategory: item.subCategory || item.category || 'Piece',
      color: item.color || 'White',
      primaryColor: item.primaryColor || '#ffffff',
      secondaryColors: item.secondaryColors || [],
      pattern: item.pattern || 'Plain',
      material: item.material || 'Cotton',
      season: item.season || ['All Season'],
      occasion: item.occasion || ['Casual'],
      style: item.style || ['Chic'],
      name: item.name,
      confidence: 0.99,
      fit: item.fit || 'Regular Fit',
      neckline: item.neckline || 'Classic',
      sleeveLength: item.sleeveLength || 'Standard',
      stylingTip: `Authentic item from your personal wardrobe: "${item.name}". Coordinated for ${item.occasion?.[0] || 'everyday wear'}.`,
      analyzedBy: 'Personal Wardrobe Match (MongoDB Grounded)',
      wardrobeItemId: String(item._id || item.id),
      imageUrl: item.image || item.imageUrl
    }
  };
}

/**
 * Isolated mock prediction provider for offline local testing
 * Clearly flagged so mock data is never mistaken for real AI model inferences.
 *
 * @param {string} filename - Filename of the clothing image
 * @returns {object} Standardized mock AI analysis response
 */
export const getMockAiPrediction = (filename = '') => {
  const lowerName = filename.toLowerCase();

  let category    = 'Shirt';
  let subCategory = 'Crop Top';
  let color       = 'White';
  let material    = 'Cotton';
  let pattern     = 'Plain';

  if (lowerName.includes('frock')) {
    category = 'Frock'; subCategory = 'Frock'; color = 'Pink'; material = 'Chiffon'; pattern = 'Floral';
  } else if (lowerName.includes('saree') || lowerName.includes('sari')) {
    category = 'Saree'; subCategory = 'Saree'; color = 'Red'; material = 'Silk'; pattern = 'Traditional';
  } else if (lowerName.includes('anarkali')) {
    category = 'Anarkali'; subCategory = 'Anarkali Suit'; color = 'Yellow'; material = 'Georgette'; pattern = 'Embroidered';
  } else if (lowerName.includes('dress')) {
    category = 'Dress'; subCategory = 'Summer Dress'; color = 'Blue'; material = 'Cotton'; pattern = 'Plain';
  } else if (lowerName.includes('shirt') || lowerName.includes('top') || lowerName.includes('crop')) {
    category = 'Shirt'; subCategory = 'Crop Top'; color = 'White'; material = 'Cotton'; pattern = 'Floral';
  } else if (lowerName.includes('jean') || lowerName.includes('denim')) {
    category = 'Jeans'; subCategory = 'Denim Jeans'; color = 'Blue'; material = 'Denim'; pattern = 'Solid';
  } else if (lowerName.includes('trouser') || lowerName.includes('pant')) {
    category = 'Trousers'; subCategory = 'Tailored Trousers'; color = 'Black'; material = 'Cotton'; pattern = 'Solid';
  } else if (lowerName.includes('skirt')) {
    category = 'Skirt'; subCategory = 'Flared Skirt'; color = 'Black'; material = 'Cotton'; pattern = 'Plain';
  } else if (lowerName.includes('jacket') || lowerName.includes('coat')) {
    category = 'Jacket'; subCategory = 'Jacket'; color = 'Black'; material = 'Denim'; pattern = 'Solid';
  } else if (lowerName.includes('shoe') || lowerName.includes('boot') || lowerName.includes('sneaker')) {
    category = 'Shoes'; subCategory = 'Casual Shoes'; color = 'White'; material = 'Leather'; pattern = 'Plain';
  }

  return {
    success: true,
    isMock:  true,
    data: {
      category,
      subCategory,
      color,
      secondaryColors: [],
      pattern,
      material,
      season:     ['Summer', 'Spring', 'All Season'],
      occasion:   ['Casual outing', 'College'],
      style:      ['Casual', 'Chic'],
      confidence: 0.85,
      fit:        'Regular Fit',
      neckline:   'Classic',
      sleeveLength: 'Short Sleeve',
      stylingTip: 'Pair with complementary wardrobe pieces for an elegant look.',
      analyzedBy: 'Visual Recognition Fallback',
    },
  };
};

/**
 * Validates and normalizes raw predictions returned by any AI source
 *
 * @param {object} rawData - Raw prediction data
 * @returns {object} Normalized prediction object
 */
export const normalizeAiPrediction = (rawData = {}) => {
  if (!rawData || typeof rawData !== 'object') {
    throw new Error('Malformed AI recognition payload received.');
  }

  let normalizedCategory = null;
  if (rawData.category && typeof rawData.category === 'string') {
    const matched = CLOTHING_CATEGORIES.find(
      (c) => c.toLowerCase() === rawData.category.trim().toLowerCase()
    );
    normalizedCategory = matched || 'Other';
  }

  let confidence = null;
  if (typeof rawData.confidence === 'number' && !isNaN(rawData.confidence)) {
    confidence = Math.min(1, Math.max(0, rawData.confidence));
  }

  return {
    category:       normalizedCategory,
    subCategory:    rawData.subCategory   ? String(rawData.subCategory).trim()   : null,
    color:          rawData.color         ? String(rawData.color).trim()         : null,
    secondaryColors: Array.isArray(rawData.secondaryColors)
      ? rawData.secondaryColors.map((c) => String(c).trim()).filter(Boolean) : [],
    pattern:        rawData.pattern       ? String(rawData.pattern).trim()       : null,
    material:       rawData.material      ? String(rawData.material).trim()      : null,
    season:         Array.isArray(rawData.season)
      ? rawData.season.map((s) => String(s).trim()).filter(Boolean)   : [],
    occasion:       Array.isArray(rawData.occasion)
      ? rawData.occasion.map((o) => String(o).trim()).filter(Boolean) : [],
    style:          Array.isArray(rawData.style)
      ? rawData.style.map((st) => String(st).trim()).filter(Boolean)  : [],
    fit:            rawData.fit           ? String(rawData.fit).trim()           : null,
    neckline:       rawData.neckline      ? String(rawData.neckline).trim()      : null,
    sleeveLength:   rawData.sleeveLength  ? String(rawData.sleeveLength).trim()  : null,
    confidence,
    stylingTip:     rawData.stylingTip    ? String(rawData.stylingTip).trim()    : null,
    analyzedBy:     rawData.analyzedBy    ? String(rawData.analyzedBy).trim()    : 'Unknown',
  };
};

/**
 * Main entry point: Analyses a clothing image.
 *
 * Priority order:
 *   1. Groq Vision AI  (LLaMA 4 Scout) — highest accuracy
 *   2. OpenCV Python AI service         — fallback if Groq unavailable
 *   3. Mock adapter                     — fallback for offline testing
 *
 * @param {string} relativeImagePath - e.g. /uploads/clothing/abc.jpg
 * @returns {Promise<{success, data, isMock, isGroq}>}
 */
export const recognizeClothingImage = async (relativeImagePath) => {
  if (!relativeImagePath || typeof relativeImagePath !== 'string') {
    const error = new Error('No image path provided for AI analysis.');
    error.statusCode = 400;
    throw error;
  }

  const cleanRelative = relativeImagePath.replace(/^\/?uploads\/clothing\//, '');
  const absolutePath  = path.resolve('uploads', 'clothing', path.basename(cleanRelative));
  const filename      = path.basename(absolutePath);

  if (!fs.existsSync(absolutePath)) {
    const error = new Error('Associated clothing image file was not found on local storage.');
    error.statusCode = 404;
    throw error;
  }

  // ── 0. Check MongoDB Wardrobe for Exact Stored Image Match ────────────────
  try {
    const fileBuffer = fs.readFileSync(absolutePath);
    const uploadedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const dbItems = await ClothingItem.find({
      $or: [
        { image: { $exists: true, $ne: null } },
        { imageUrl: { $exists: true, $ne: null } }
      ]
    }).lean();

    for (const item of dbItems) {
      const imgPath = item.image || item.imageUrl;
      if (!imgPath) continue;
      const dbClean = imgPath.replace(/^\/?uploads\/clothing\//, '');
      const dbAbsPath = path.resolve('uploads', 'clothing', path.basename(dbClean));
      if (fs.existsSync(dbAbsPath)) {
        if (dbAbsPath === absolutePath) {
          console.log(`[AI] Found identical file path match in MongoDB: "${item.name}"`);
          return buildDbMatchResult(item);
        }
        const dbHash = crypto.createHash('sha256').update(fs.readFileSync(dbAbsPath)).digest('hex');
        if (dbHash === uploadedHash) {
          console.log(`[AI] Image matched authentic MongoDB wardrobe item by SHA-256: "${item.name}" (${item.category})`);
          return buildDbMatchResult(item);
        }
      }
    }
  } catch (dbMatchErr) {
    console.warn('[AI] MongoDB wardrobe image lookup error:', dbMatchErr.message);
  }

  // ── 1. Try Groq Vision AI ──────────────────────────────────────────────────
  if (process.env.GROQ_API_KEY) {
    try {
      console.log(`[AI] Using Groq Vision for: ${filename}`);
      const groqResult = await groqAnalyzeClothingImage(absolutePath);
      const normalized = normalizeAiPrediction(groqResult.data);
      return { success: true, isMock: false, isGroq: true, data: normalized };
    } catch (groqErr) {
      console.warn(`[AI] Groq Vision failed (${groqErr.message}). Falling back to OpenCV service.`);
    }
  } else {
    console.warn('[AI] GROQ_API_KEY not set. Skipping Groq Vision, trying OpenCV service.');
  }

  // ── 2. Try OpenCV Python AI service ───────────────────────────────────────
  const targetUrl = `${aiConfig.serviceUrl}${aiConfig.recognitionEndpoint}`;
  try {
    const fileBuffer = fs.readFileSync(absolutePath);
    const ext        = path.extname(filename).toLowerCase();
    const mimeType   = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

    const formData = new FormData();
    formData.append('image', new Blob([fileBuffer], { type: mimeType }), filename);

    const response = await fetch(targetUrl, {
      method: 'POST',
      body:   formData,
      signal: AbortSignal.timeout(aiConfig.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`OpenCV service returned HTTP ${response.status}`);
    }

    const json = await response.json();
    if (!json || json.success !== true || !json.data) {
      throw new Error('OpenCV service returned invalid prediction data.');
    }

    const normalizedData = normalizeAiPrediction(json.data);
    console.log(`[AI] OpenCV service succeeded for: ${filename}`);
    return { success: true, isMock: false, isGroq: false, data: normalizedData };

  } catch (opencvErr) {
    const isNetworkError =
      opencvErr.code === 'ECONNREFUSED' ||
      opencvErr.code === 'ENOTFOUND'    ||
      opencvErr.name === 'TimeoutError' ||
      opencvErr.name === 'AbortError'   ||
      opencvErr.message?.includes('fetch failed') ||
      opencvErr.message?.includes('ECONNREFUSED');

    if (isNetworkError || opencvErr.message?.includes('HTTP')) {
      console.warn(`[AI] OpenCV service unreachable (${opencvErr.message}).`);
    }
  }

  // ── 3. Mock fallback ───────────────────────────────────────────────────────
  if (aiConfig.mockFallback) {
    console.warn(`[AI] All AI services unavailable. Using mock adapter for: ${filename}`);
    const mockResult = getMockAiPrediction(filename);
    const normalizedData = normalizeAiPrediction(mockResult.data);
    return { success: true, isMock: true, isGroq: false, data: normalizedData };
  }

  const serviceError = new Error('All AI recognition services are unavailable and mock fallback is disabled.');
  serviceError.statusCode = 503;
  throw serviceError;
};

export default {
  recognizeClothingImage,
  normalizeAiPrediction,
  getMockAiPrediction,
};
