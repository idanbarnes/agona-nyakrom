const { verifyPreviewToken } = require('../services/admin/adminPreviewTokenService');

const parsePreviewToken = (req) => {
  const token = String(req?.query?.preview_token || req?.query?.token || '').trim();
  return token || null;
};

const resolvePreviewAccess = (req, expectedResource) => {
  const token = parsePreviewToken(req);

  if (!token) {
    return {
      isPreviewRequest: false,
      isAuthorized: false,
      previewId: null,
      errorMessage: null,
    };
  }

  let payload;
  try {
    payload = verifyPreviewToken(token);
  } catch (err) {
    return {
      isPreviewRequest: true,
      isAuthorized: false,
      previewId: null,
      errorMessage: 'Invalid or expired preview token.',
    };
  }

  if (payload?.typ !== 'admin_preview') {
    return {
      isPreviewRequest: true,
      isAuthorized: false,
      previewId: null,
      errorMessage: 'Invalid preview token type.',
    };
  }

  if (String(payload?.resource || '').trim() !== String(expectedResource || '').trim()) {
    return {
      isPreviewRequest: true,
      isAuthorized: false,
      previewId: null,
      errorMessage: 'Preview token does not match this resource.',
    };
  }

  const previewId = String(payload?.id || '').trim();
  if (!previewId) {
    return {
      isPreviewRequest: true,
      isAuthorized: false,
      previewId: null,
      errorMessage: 'Preview token is missing a target record.',
    };
  }

  return {
    isPreviewRequest: true,
    isAuthorized: true,
    previewId,
    errorMessage: null,
  };
};

module.exports = {
  resolvePreviewAccess,
};
