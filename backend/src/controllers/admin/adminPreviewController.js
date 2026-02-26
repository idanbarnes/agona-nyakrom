const {
  getPreviewResource,
  listPreviewResources,
  normalizeResource,
} = require('../../services/admin/adminPreviewRegistry');
const { issuePreviewToken } = require('../../services/admin/adminPreviewTokenService');
const { success, error } = require('../../utils/response');

const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || '';

const buildPublicUrl = (publicPathWithQuery) => {
  const path = String(publicPathWithQuery || '').trim();
  const base = String(PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');

  if (!path) {
    return '';
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (!base) {
    return path;
  }

  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const listResources = async (req, res) => {
  return success(
    res,
    { resources: listPreviewResources() },
    'Preview resources fetched successfully'
  );
};

const getPreview = async (req, res) => {
  const resourceInput = req.params?.resource;
  const requestedId = String(req.params?.id || '').trim();
  const normalizedResource = normalizeResource(resourceInput);
  const resource = getPreviewResource(normalizedResource);

  if (!requestedId) {
    return error(res, 'Preview id is required.', 400);
  }

  if (!resource) {
    return error(res, `Preview is not configured for resource "${normalizedResource}".`, 404);
  }

  let record;
  try {
    record = await resource.loadById(requestedId);
  } catch (err) {
    if (err?.status === 400 || err?.status === 404 || err?.code === '22P02') {
      return error(res, err.message || 'Content not found for preview.', 404);
    }
    console.error('Error loading preview content:', err.message);
    return error(res, 'Failed to load preview content.', 500);
  }

  if (!record) {
    return error(res, 'Content not found for preview.', 404);
  }

  if (!resource.canPreview(record)) {
    return error(res, 'Preview is currently unavailable for this content item.', 422);
  }

  const previewId = String(resource.getPreviewId(record, requestedId) || '').trim();
  if (!previewId) {
    return error(res, 'Preview could not determine a valid content identifier.', 422);
  }

  const publicPath = resource.toPublicPath(record, requestedId);
  if (!publicPath) {
    return error(res, 'Preview path could not be generated for this content.', 422);
  }

  const issued = issuePreviewToken({
    resource: resource.key,
    previewId,
    adminId: req.admin?.id,
  });

  const separator = publicPath.includes('?') ? '&' : '?';
  const publicPathWithToken = `${publicPath}${separator}preview_token=${encodeURIComponent(
    issued.token
  )}`;

  return success(
    res,
    {
      resource: resource.key,
      requested_resource: normalizedResource,
      id: previewId,
      public_path: publicPathWithToken,
      public_url: buildPublicUrl(publicPathWithToken),
      token_expires_at: issued.expiresAt,
      token_expires_in_seconds: issued.expiresInSeconds,
    },
    'Preview URL generated successfully'
  );
};

module.exports = {
  listResources,
  getPreview,
};
