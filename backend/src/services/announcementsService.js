const Announcement = require('../models/Announcement');

const mapAnnouncement = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    body: row.body,
    flyer_image_path: row.flyer_image_path,
    flyer_alt_text: row.flyer_alt_text,
    is_published: row.is_published,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const normalizePagination = ({ page = 1, limit = 10 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 10);
  const offset = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, offset };
};

const createAnnouncement = async (data) => {
  const created = await Announcement.create(data);
  return mapAnnouncement(created);
};

const updateAnnouncement = async (id, data) => {
  const updated = await Announcement.update(id, data);
  return mapAnnouncement(updated);
};

const deleteAnnouncement = async (id) => {
  return Announcement.delete(id);
};

const getAnnouncementById = async (id) => {
  const row = await Announcement.findById(id);
  return mapAnnouncement(row);
};

const getAnnouncementBySlug = async (slug) => {
  const row = await Announcement.findBySlug(slug);
  return mapAnnouncement(row);
};

const getPublishedAnnouncementBySlug = async (slug) => {
  const row = await Announcement.findPublishedBySlug(slug);
  return mapAnnouncement(row);
};

const listAdminAnnouncements = async ({ search, isPublished, page = 1, limit = 10 } = {}) => {
  const { page: currentPage, limit: pageLimit, offset } = normalizePagination({ page, limit });

  const result = await Announcement.findAdminList({
    search,
    isPublished,
    limit: pageLimit,
    offset,
  });

  return {
    items: result.items.map(mapAnnouncement),
    total: result.total,
    page: currentPage,
    limit: pageLimit,
  };
};

const listPublicAnnouncements = async ({ page = 1, limit = 10 } = {}) => {
  const { page: currentPage, limit: pageLimit, offset } = normalizePagination({ page, limit });

  const result = await Announcement.findPublicList({ limit: pageLimit, offset });

  return {
    items: result.items.map(mapAnnouncement),
    total: result.total,
    page: currentPage,
    limit: pageLimit,
  };
};

module.exports = {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  getAnnouncementBySlug,
  getPublishedAnnouncementBySlug,
  listAdminAnnouncements,
  listPublicAnnouncements,
};
