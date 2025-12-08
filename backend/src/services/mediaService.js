const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Valid sections map to folder names under /uploads
const SECTION_DIRS = {
  news: 'news',
  obituaries: 'obituaries',
  clans: 'clans',
  leaders: 'leaders',
  asafo: 'asafo',
  landmarks: 'landmarks',
  'hall-of-fame': 'hall-of-fame',
  carousel: 'carousel',
  history: 'history',
};

const variants = [
  { key: 'original', width: null },
  { key: 'large', width: 1600 },
  { key: 'medium', width: 800 },
  { key: 'thumbnail', width: 400 },
];

const uploadsRoot = path.join(process.cwd(), 'uploads');

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const getFileBuffer = async (file) => {
  if (file?.buffer) return file.buffer;
  if (file?.path) return fs.readFile(file.path);
  throw new Error('Uploaded file is missing a buffer or path.');
};

const validateInput = (file, section, uniqueId) => {
  if (!file) throw new Error('No file provided.');
  if (!SECTION_DIRS[section]) throw new Error(`Unsupported section "${section}".`);
  if (!uniqueId) throw new Error('uniqueId is required.');

  const mime = file.mimetype || file.type;
  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    throw new Error('Unsupported file type. Allowed: webp, jpeg/jpg, png.');
  }

  if (file.size && file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum allowed size is 5 MB.');
  }
};

const buildFilename = (section, uniqueId, variantKey) =>
  `${section}-${uniqueId}-${variantKey}.webp`;

const saveVariant = async (buffer, dir, filename, width) => {
  let pipeline = sharp(buffer).rotate(); // auto-orient based on EXIF

  if (width) {
    pipeline = pipeline.resize({ width, withoutEnlargement: true });
  }

  const outputPath = path.join(dir, filename);
  await pipeline.webp({ quality: 80 }).toFile(outputPath);

  // Return a normalized, DB-friendly relative path
  return path.join('uploads', path.basename(dir), filename).replace(/\\+/g, '/');
};

/**
 * Process an uploaded image into multiple optimized variants.
 * @param {Object} file - Uploaded file (expects buffer/mimetype/size; path supported).
 * @param {string} section - One of the predefined sections (e.g., "news", "obituaries").
 * @param {string} uniqueId - Unique identifier to embed in filenames.
 * @returns {Promise<{original: string, large: string, medium: string, thumbnail: string}>}
 */
const processImage = async (file, section, uniqueId) => {
  validateInput(file, section, uniqueId);

  const buffer = await getFileBuffer(file);
  const sectionDir = SECTION_DIRS[section];
  const targetDir = path.join(uploadsRoot, sectionDir);

  await ensureDir(targetDir);

  const results = {};

  for (const { key, width } of variants) {
    const filename = buildFilename(section, uniqueId, key);
    results[key] = await saveVariant(buffer, targetDir, filename, width);
  }

  return results;
};

module.exports = {
  processImage,
};
