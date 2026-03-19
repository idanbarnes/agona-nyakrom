const {
  clearPublicDataCache,
  clearPublicDataCacheByPrefix,
} = require('./publicDataCache');

function clearMany(keys = []) {
  keys.forEach((key) => {
    if (key) {
      clearPublicDataCache(key);
    }
  });
}

function clearManyByPrefix(prefixes = []) {
  prefixes.forEach((prefix) => {
    if (prefix) {
      clearPublicDataCacheByPrefix(prefix);
    }
  });
}

function invalidatePublicGlobalSettings() {
  clearMany(['public:global-settings']);
}

function invalidatePublicHomepage() {
  clearMany(['public:homepage']);
}

function invalidatePublicAboutPage(slug = '') {
  const normalizedSlug = String(slug || '').trim();
  if (normalizedSlug) {
    clearMany([`public:about:${normalizedSlug}`]);
    return;
  }

  clearManyByPrefix(['public:about:']);
}

function invalidatePublicHistoryPage() {
  clearMany(['public:history-page']);
}

function invalidatePublicContactContent() {
  clearMany(['public:contact', 'public:faqs', 'public:contact-sections']);
}

function invalidatePublicAsafo(entry = {}) {
  clearMany(['public:asafo:list']);

  const detailKeys = new Set([
    entry?.slug,
    entry?.company_key,
    entry?.id,
  ]);

  const exactKeys = [];
  detailKeys.forEach((value) => {
    const normalized = String(value || '').trim();
    if (normalized) {
      exactKeys.push(`public:asafo:detail:${normalized}`);
    }
  });

  if (exactKeys.length > 0) {
    clearMany(exactKeys);
    return;
  }

  clearManyByPrefix(['public:asafo:detail:']);
}

function invalidatePublicHallOfFame(entry = {}) {
  clearMany(['public:hall-of-fame:list']);

  const detailKeys = new Set([entry?.slug, entry?.id]);
  const exactKeys = [];
  detailKeys.forEach((value) => {
    const normalized = String(value || '').trim();
    if (normalized) {
      exactKeys.push(`public:hall-of-fame:detail:${normalized}`);
    }
  });

  if (exactKeys.length > 0) {
    clearMany(exactKeys);
    return;
  }

  clearManyByPrefix(['public:hall-of-fame:detail:']);
}

function invalidatePublicLeaders(entry = {}) {
  clearManyByPrefix(['public:leaders:list:', 'public:leaders:detail:']);

  const detailKeys = new Set([entry?.slug, entry?.id]);
  const exactKeys = [];
  detailKeys.forEach((value) => {
    const normalized = String(value || '').trim();
    if (normalized) {
      exactKeys.push(`public:leaders:detail:${normalized}`);
    }
  });

  clearMany(exactKeys);
}

function invalidatePublicCarousel() {
  clearMany(['public:carousel:list']);
}

function invalidatePublicClans(entry = {}) {
  clearMany(['public:clans:list']);

  const detailKeys = new Set([entry?.slug, entry?.id]);
  const exactKeys = [];
  detailKeys.forEach((value) => {
    const normalized = String(value || '').trim();
    if (normalized) {
      exactKeys.push(`public:clans:detail:${normalized}`);
    }
  });

  if (exactKeys.length > 0) {
    clearMany(exactKeys);
    return;
  }

  clearManyByPrefix(['public:clans:detail:']);
}

function invalidatePublicLandmarks(entry = {}) {
  clearManyByPrefix(['public:landmarks:list:']);

  const detailKeys = new Set([entry?.slug, entry?.id]);
  const exactKeys = [];
  detailKeys.forEach((value) => {
    const normalized = String(value || '').trim();
    if (normalized) {
      exactKeys.push(`public:landmarks:detail:${normalized}`);
    }
  });

  if (exactKeys.length > 0) {
    clearMany(exactKeys);
    return;
  }

  clearManyByPrefix(['public:landmarks:detail:']);
}

module.exports = {
  invalidatePublicGlobalSettings,
  invalidatePublicHomepage,
  invalidatePublicAboutPage,
  invalidatePublicHistoryPage,
  invalidatePublicContactContent,
  invalidatePublicAsafo,
  invalidatePublicHallOfFame,
  invalidatePublicLeaders,
  invalidatePublicCarousel,
  invalidatePublicClans,
  invalidatePublicLandmarks,
};
