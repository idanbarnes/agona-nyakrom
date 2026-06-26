const LOOPBACK_HOST_PATTERN = /^(localhost|127(?:\.\d{1,3}){3}|::1)$/i;

const normalizeUploadPath = (value = '') => {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return '';
  }

  let candidate = rawValue;
  if (/^https?:\/\//i.test(rawValue)) {
    try {
      const parsed = new URL(rawValue);
      if (!LOOPBACK_HOST_PATTERN.test(parsed.hostname)) {
        return rawValue;
      }
      candidate = `${parsed.pathname || ''}${parsed.search || ''}${parsed.hash || ''}`;
    } catch {
      return rawValue;
    }
  }

  const normalized = candidate.replace(/\\+/g, '/');
  const uploadMatch = normalized.match(/^\/?uploads\/.+$/i);
  if (!uploadMatch) {
    return rawValue;
  }

  return `/${uploadMatch[0].replace(/^\/+/, '')}`;
};

module.exports = {
  normalizeUploadPath,
};
