const path = require('path');

const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

const uploadsRoot = path.resolve(BACKEND_ROOT, process.env.UPLOAD_DIR || 'uploads');
const tmpUploadsRoot = path.join(uploadsRoot, 'tmp');

module.exports = {
  uploadsRoot,
  tmpUploadsRoot,
};
