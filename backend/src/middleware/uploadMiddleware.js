const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');

const MAX_FILE_SIZE = 5 * 1024 * 1024; //5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const tmpDir = path.join(process.cwd(), 'uploads', 'tmp');

const ensureTmpDir = async () => {
  await fs.mkdir(tmpDir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await ensureTmpDir();
      cb(null, tmpDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    // Preserve original name; mediaService will rename when processing
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const isAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype);
  if (!isAllowed) {
    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image');
    error.message = 'Invalid file type. Allowed: jpg, jpeg, png, webp, gif.';
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
};
