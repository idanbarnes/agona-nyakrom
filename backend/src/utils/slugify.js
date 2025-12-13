/**
 * Generate a URL-friendly slug from a title.
 *
 * Rules:
 * - Lowercase
 * - Spaces to hyphens
 * - Remove non-alphanumeric except hyphens
 * - Collapse multiple hyphens
 * - Trim hyphens at start/end
 */
const generateSlug = (title = '') => {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/[^a-z0-9-]/g, '') // remove non-alphanumeric except hyphen
    .replace(/-{2,}/g, '-') // collapse multiple hyphens
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
};

module.exports = { generateSlug };
