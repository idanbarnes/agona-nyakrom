const crypto = require('crypto');

const isCloudinaryStorageEnabled = () =>
  String(process.env.MEDIA_STORAGE || 'local').trim().toLowerCase() === 'cloudinary';

const getCloudinaryConfig = () => {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim();
  const baseFolder = String(process.env.CLOUDINARY_BASE_FOLDER || 'agonanyakrom').trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary storage is enabled but CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is missing.'
    );
  }

  return {
    apiKey,
    apiSecret,
    baseFolder,
    cloudName,
  };
};

const buildSignature = (params, apiSecret) => {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
};

const uploadImageBuffer = async ({ buffer, folder, publicId, filename }) => {
  if (typeof fetch !== 'function' || typeof FormData !== 'function' || typeof Blob !== 'function') {
    throw new Error('Cloudinary uploads require a Node.js runtime with fetch, FormData, and Blob support.');
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder,
    overwrite: 'true',
    public_id: publicId,
    timestamp,
  };

  const signature = buildSignature(params, apiSecret);
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/webp' }), filename);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', folder);
  form.append('public_id', publicId);
  form.append('overwrite', 'true');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Cloudinary upload failed.');
  }

  return payload.secure_url || payload.url;
};

const buildCloudinaryFolder = (sectionDir = '') => {
  const { baseFolder } = getCloudinaryConfig();
  return [baseFolder, sectionDir].filter(Boolean).join('/');
};

module.exports = {
  buildCloudinaryFolder,
  isCloudinaryStorageEnabled,
  uploadImageBuffer,
};
