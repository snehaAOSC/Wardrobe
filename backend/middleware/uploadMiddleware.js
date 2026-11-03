import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Target directory for clothing images
const UPLOAD_DIR = path.resolve('uploads', 'clothing');

// Ensure destination directory exists on startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Supported MIME types and file extensions
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Configure Multer Disk Storage with UUID filenames
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueFilename = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueFilename);
  },
});

/**
 * File filter to validate image type and extension
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  const isMimeValid = ALLOWED_MIME_TYPES.includes(mimeType);
  const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file format. Only JPEG, JPG, PNG, and WEBP images are supported.');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

/**
 * Multer instance configuration with 5 MB size limit
 */
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 5, // Flexible file count limit
  },
  fileFilter,
});

/**
 * Middleware wrapper for clothing image upload.
 * Accepts either 'image' or 'file' form field seamlessly.
 * Catches Multer errors and returns clear, consistent JSON error responses
 */
export const uploadClothingImageMiddleware = (req, res, next) => {
  const multiUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]);

  multiUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Image exceeds the maximum allowed size of 5 MB.',
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (err.code === 'INVALID_FILE_TYPE' || err.message) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Failed to process file upload.',
      });
    }

    if (req.files) {
      req.file = req.files['image']?.[0] || req.files['file']?.[0] || null;
    }

    next();
  });
};

export default uploadClothingImageMiddleware;
