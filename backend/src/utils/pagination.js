/**
 * Extract and sanitize pagination params from the request query.
 * Defaults: page = 1, limit = 10.
 */
const getPaginationParams = (req) => {
  const pageRaw = Number(req?.query?.page);
  const limitRaw = Number(req?.query?.limit);

  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 10;
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

module.exports = { getPaginationParams };
