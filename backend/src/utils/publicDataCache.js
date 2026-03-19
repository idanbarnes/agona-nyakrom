const DEFAULT_PUBLIC_DATA_CACHE_TTL_MS = 30 * 1000;

const valueCache = new Map();
const inFlightCache = new Map();

function getNow() {
  return Date.now();
}

function isExpired(entry, ttlMs) {
  if (!entry) {
    return true;
  }

  return getNow() - entry.timestamp >= ttlMs;
}

function isCacheableValue(value) {
  return value !== null && value !== undefined;
}

async function rememberPublicData(cacheKey, loader, options = {}) {
  const ttlMs = Math.max(0, Number(options.ttlMs) || DEFAULT_PUBLIC_DATA_CACHE_TTL_MS);

  if (!cacheKey || typeof loader !== 'function' || ttlMs <= 0) {
    const value = await loader();
    return { value, cacheStatus: 'BYPASS' };
  }

  const cached = valueCache.get(cacheKey);
  if (cached && !isExpired(cached, ttlMs)) {
    return { value: cached.value, cacheStatus: 'HIT' };
  }

  if (cached && isExpired(cached, ttlMs)) {
    valueCache.delete(cacheKey);
  }

  const inFlight = inFlightCache.get(cacheKey);
  if (inFlight) {
    const value = await inFlight;
    return { value, cacheStatus: 'HIT' };
  }

  const request = Promise.resolve()
    .then(() => loader())
    .then((value) => {
      if (isCacheableValue(value)) {
        valueCache.set(cacheKey, {
          value,
          timestamp: getNow(),
        });
      } else {
        valueCache.delete(cacheKey);
      }
      return value;
    })
    .finally(() => {
      inFlightCache.delete(cacheKey);
    });

  inFlightCache.set(cacheKey, request);
  const value = await request;
  return { value, cacheStatus: 'MISS' };
}

function clearPublicDataCache(cacheKey = '') {
  if (!cacheKey) {
    valueCache.clear();
    inFlightCache.clear();
    return;
  }

  valueCache.delete(cacheKey);
  inFlightCache.delete(cacheKey);
}

function clearPublicDataCacheByPrefix(prefix = '') {
  const normalizedPrefix = String(prefix || '').trim();
  if (!normalizedPrefix) {
    return;
  }

  for (const cacheKey of valueCache.keys()) {
    if (cacheKey.startsWith(normalizedPrefix)) {
      valueCache.delete(cacheKey);
    }
  }

  for (const cacheKey of inFlightCache.keys()) {
    if (cacheKey.startsWith(normalizedPrefix)) {
      inFlightCache.delete(cacheKey);
    }
  }
}

module.exports = {
  DEFAULT_PUBLIC_DATA_CACHE_TTL_MS,
  rememberPublicData,
  clearPublicDataCache,
  clearPublicDataCacheByPrefix,
};
