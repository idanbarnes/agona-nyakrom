const jwt = require('jsonwebtoken');
const { getPreviewTokenSecret } = require('../../config/env');

const PREVIEW_TOKEN_TTL_SECONDS = Math.max(
  60,
  Number(process.env.ADMIN_PREVIEW_TOKEN_TTL_SECONDS) || 15 * 60
);

const issuePreviewToken = ({ resource, previewId, adminId }) => {
  const previewTokenSecret = getPreviewTokenSecret();
  const token = jwt.sign(
    {
      typ: 'admin_preview',
      resource,
      id: String(previewId),
      admin_id: adminId ? String(adminId) : null,
    },
    previewTokenSecret,
    { expiresIn: PREVIEW_TOKEN_TTL_SECONDS }
  );

  const expiresAt = new Date(Date.now() + PREVIEW_TOKEN_TTL_SECONDS * 1000).toISOString();

  return {
    token,
    expiresAt,
    expiresInSeconds: PREVIEW_TOKEN_TTL_SECONDS,
  };
};

const verifyPreviewToken = (token) => {
  return jwt.verify(token, getPreviewTokenSecret());
};

module.exports = {
  issuePreviewToken,
  verifyPreviewToken,
  PREVIEW_TOKEN_TTL_SECONDS,
};
