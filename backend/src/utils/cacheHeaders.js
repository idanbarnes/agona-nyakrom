const DEFAULT_BROWSER_SECONDS = 60;
const DEFAULT_SHARED_SECONDS = 300;
const DEFAULT_STALE_WHILE_REVALIDATE_SECONDS = 600;

const setPublicCacheHeaders = (
  res,
  {
    browserSeconds = DEFAULT_BROWSER_SECONDS,
    sharedSeconds = DEFAULT_SHARED_SECONDS,
    staleWhileRevalidateSeconds = DEFAULT_STALE_WHILE_REVALIDATE_SECONDS,
  } = {},
) => {
  const directives = [
    'public',
    `max-age=${Math.max(0, Number(browserSeconds) || 0)}`,
    `s-maxage=${Math.max(0, Number(sharedSeconds) || 0)}`,
  ];

  const staleWhileRevalidate = Math.max(0, Number(staleWhileRevalidateSeconds) || 0);
  if (staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  res.set('Cache-Control', directives.join(', '));
  res.set('Vary', 'Origin');
  return res;
};

const setNoStoreHeaders = (res) => {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  return res;
};

module.exports = {
  setPublicCacheHeaders,
  setNoStoreHeaders,
};
