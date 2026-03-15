const path = require('path');

const uploadsRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
const tmpUploadsRoot = path.join(uploadsRoot, 'tmp');

module.exports = {
  uploadsRoot,
  tmpUploadsRoot,
};
