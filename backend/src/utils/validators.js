/**
 * Basic validation helpers for incoming payloads.
 *
 * Example:
 *   const { requireFields, isValidSlugFormat, sanitizeInput } = require('../utils/validators');
 *   const { valid, missing } = requireFields(body, ['title', 'slug']);
 *   if (!valid) return error(res, `Missing fields: ${missing.join(', ')}`, 400);
 *
 *   if (!isValidSlugFormat(body.slug)) return error(res, 'Invalid slug format', 400);
 *
 *   const safeTitle = sanitizeInput(body.title);
 */

// Ensure all required keys exist in the object (value may be falsy but key must exist)
const requireFields = (obj = {}, fields = []) => {
  const missing = fields.filter((field) => !(field in obj));
  if (missing.length) {
    return { valid: false, missing };
  }
  return { valid: true };
};

// Slug: lowercase letters, numbers, and hyphens only
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isValidSlugFormat = (slug = '') => slugRegex.test(slug);

// Very basic sanitization: trim and escape `<`, `>`, `&`, `"`, `'`
const sanitizeInput = (value = '') => {
  const trimmed = String(value).trim();
  return trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

module.exports = {
  requireFields,
  isValidSlugFormat,
  sanitizeInput,
};
