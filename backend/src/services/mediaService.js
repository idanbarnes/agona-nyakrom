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
  homepage: 'homepage',
};

const variants = [
  { key: 'original', width: null },
  { key: 'large', width: 1600 },
  { key: 'medium', width: 800 },
  { key: 'thumbnail', width: 400 },
];

const carouselVariants = [
  { key: 'desktop', width: 1920, height: 800 },
  { key: 'tablet', width: 1280, height: 533 },
  { key: 'mobile', width: 768, height: 320 },
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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getCarouselCropRect = ({ crop, width, height, uniqueId }) => {
  if (
    crop &&
    Number.isFinite(crop.x) &&
    Number.isFinite(crop.y) &&
    Number.isFinite(crop.w) &&
    Number.isFinite(crop.h)
  ) {
    const cropWidth = Math.round(clamp(crop.w, 0, 1) * width);
    const cropHeight = Math.round(clamp(crop.h, 0, 1) * height);
    const left = Math.round(clamp(crop.x, 0, 1) * width);
    const top = Math.round(clamp(crop.y, 0, 1) * height);

    const safeLeft = clamp(left, 0, Math.max(0, width - 1));
    const safeTop = clamp(top, 0, Math.max(0, height - 1));
    const safeWidth = clamp(cropWidth, 1, width - safeLeft);
    const safeHeight = clamp(cropHeight, 1, height - safeTop);

    return {
      left: safeLeft,
      top: safeTop,
      width: safeWidth,
      height: safeHeight,
    };
  }

  const targetRatio = carouselVariants[0].width / carouselVariants[0].height;
  const imageRatio = width / height;
  let cropWidth = width;
  let cropHeight = height;
  let left = 0;
  let top = 0;

  if (imageRatio > targetRatio) {
    cropWidth = Math.round(height * targetRatio);
    left = Math.round((width - cropWidth) / 2);
  } else if (imageRatio < targetRatio) {
    cropHeight = Math.round(width / targetRatio);
    top = Math.round((height - cropHeight) / 2);
  }

  console.warn(
    `Carousel image ${uniqueId} missing crop data. Applying centered ${targetRatio.toFixed(2)} crop.`
  );

  const safeLeft = clamp(left, 0, Math.max(0, width - 1));
  const safeTop = clamp(top, 0, Math.max(0, height - 1));
  const safeWidth = clamp(cropWidth, 1, width - safeLeft);
  const safeHeight = clamp(cropHeight, 1, height - safeTop);

  return {
    left: safeLeft,
    top: safeTop,
    width: safeWidth,
    height: safeHeight,
  };
};

const processCarouselImage = async (file, uniqueId, crop) => {
  validateInput(file, 'carousel', uniqueId);

  const buffer = await getFileBuffer(file);
  const sectionDir = SECTION_DIRS.carousel;
  const targetDir = path.join(uploadsRoot, sectionDir);

  await ensureDir(targetDir);

  const base = sharp(buffer).rotate();
  const metadata = await base.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions.');
  }

  const cropRect = getCarouselCropRect({
    crop,
    width: metadata.width,
    height: metadata.height,
    uniqueId,
  });

  const results = {};

  for (const { key, width, height } of carouselVariants) {
    const filename = buildFilename('carousel', uniqueId, key);
    const outputPath = path.join(targetDir, filename);

    await base
      .clone()
      .extract(cropRect)
      .resize({ width, height, fit: 'cover' })
      .webp({ quality: 82 })
      .toFile(outputPath);

    results[key] = path
      .join('uploads', path.basename(targetDir), filename)
      .replace(/\\+/g, '/');
  }

  results.large = results.desktop;
  results.medium = results.tablet;
  results.thumbnail = results.mobile;
  results.original = results.desktop;

  return results;
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
  processCarouselImage,
};
