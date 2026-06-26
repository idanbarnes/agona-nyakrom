const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { tmpUploadsRoot } = require('../config/storage');

const MAX_FILE_SIZE = 5 * 1024 * 1024; //5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const FALLBACK_EXTENSION_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const ensureTmpDir = async () => {
  await fs.mkdir(tmpUploadsRoot, { recursive: true });
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await ensureTmpDir();
      cb(null, tmpUploadsRoot);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const originalBase = path.basename(file.originalname || 'upload');
    const parsed = path.parse(originalBase);
    const safeStem =
      parsed.name
        .normalize('NFKD')
        .replace(/[^\w.-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'upload';
    const safeExt =
      FALLBACK_EXTENSION_BY_MIME[file.mimetype] || parsed.ext.toLowerCase() || '.bin';

    // mediaService renames final managed variants; this only hardens the tmp path.
    cb(null, `${Date.now()}-${safeStem}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  const isAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype);
  if (!isAllowed) {
    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image');
    error.message = 'Invalid file type. Allowed: jpg, jpeg, png, webp.';
    return cb(error);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
  
});

// Export a ready-to-use middleware for single image uploads
module.exports = {
  single: (fieldName = 'image') => upload.single(fieldName),
  fields: (fieldDefinitions = []) => upload.fields(fieldDefinitions),
  any: () => upload.any(),
};
