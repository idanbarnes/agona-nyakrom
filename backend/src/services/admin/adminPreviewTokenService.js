const jwt = require('jsonwebtoken');

const PREVIEW_TOKEN_SECRET = process.env.PREVIEW_TOKEN_SECRET || process.env.JWT_SECRET;
const PREVIEW_TOKEN_TTL_SECONDS = Math.max(
  60,
  Number(process.env.ADMIN_PREVIEW_TOKEN_TTL_SECONDS) || 15 * 60
);

if (!PREVIEW_TOKEN_SECRET) {
  throw new Error('PREVIEW_TOKEN_SECRET or JWT_SECRET must be configured.');
}

const issuePreviewToken = ({ resource, previewId, adminId }) => {
  const token = jwt.sign(
    {
      typ: 'admin_preview',
      resource,
      id: String(previewId),
      admin_id: adminId ? String(adminId) : null,
    },
    PREVIEW_TOKEN_SECRET,
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
  return jwt.verify(token, PREVIEW_TOKEN_SECRET);
};

module.exports = {
  issuePreviewToken,
  verifyPreviewToken,
  PREVIEW_TOKEN_TTL_SECONDS,
};
