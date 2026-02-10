const Event = require('../models/Event');
const { getEventState } = require('../utils/events');

const mapEvent = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    body: row.body,
    event_tag: row.event_tag,
    event_date: row.event_date,
    flyer_image_path: row.flyer_image_path,
    flyer_alt_text: row.flyer_alt_text,
    is_published: row.is_published,
    created_at: row.created_at,
    updated_at: row.updated_at,
    state: row.state || getEventState(row.event_date),
  };
};

const normalizeTag = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = String(value).trim().replace(/\s+/g, ' ');
  return trimmed.length ? trimmed : null;
};

const normalizePagination = ({ page = 1, limit = 10 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 10);
  const offset = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, offset };
};

const createEvent = async (data) => {
  const created = await Event.create({
    ...data,
    event_tag: normalizeTag(data.event_tag),
  });
  return mapEvent(created);
};

const updateEvent = async (id, data) => {
  const updated = await Event.update(id, {
    ...data,
    event_tag: normalizeTag(data.event_tag),
  });
  return mapEvent(updated);
};

const deleteEvent = async (id) => {
  return Event.delete(id);
};

const getEventById = async (id) => {
  const row = await Event.findById(id);
  return mapEvent(row);
};

const getEventBySlug = async (slug) => {
  const row = await Event.findBySlug(slug);
  return mapEvent(row);
};

const getPublishedEventBySlug = async (slug) => {
  const row = await Event.findPublishedBySlug(slug);
  return mapEvent(row);
};

const listAdminEvents = async ({
  search,
  isPublished,
  state,
  dateFrom,
  dateTo,
  tag,
  page = 1,
  limit = 10,
} = {}) => {
  const { page: currentPage, limit: pageLimit, offset } = normalizePagination({ page, limit });

  const result = await Event.findAdminList({
    search,
    isPublished,
    state,
    dateFrom,
    dateTo,
    tag,
    limit: pageLimit,
    offset,
  });

  return {
    items: result.items.map(mapEvent),
    total: result.total,
    page: currentPage,
    limit: pageLimit,
  };
};

const listPublicEvents = async ({ state, tag, page = 1, limit = 10 } = {}) => {
  const { page: currentPage, limit: pageLimit, offset } = normalizePagination({ page, limit });

  const result = await Event.findPublicList({
    state,
    tag,
    limit: pageLimit,
    offset,
  });

  return {
    items: result.items.map(mapEvent),
    total: result.total,
    page: currentPage,
    limit: pageLimit,
  };
};

const listPublicEventsByState = async ({
  comingSoonLimit = 10,
  upcomingLimit = 10,
  pastLimit = 10,
} = {}) => {
  const [comingSoon, upcoming, past] = await Promise.all([
    Event.findPublicList({ state: 'coming_soon', limit: comingSoonLimit, offset: 0 }),
    Event.findPublicList({ state: 'upcoming', limit: upcomingLimit, offset: 0 }),
    Event.findPublicList({ state: 'past', limit: pastLimit, offset: 0 }),
  ]);

  return {
    comingSoon: comingSoon.items.map(mapEvent),
    upcoming: upcoming.items.map(mapEvent),
    past: past.items.map(mapEvent),
  };
};

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  getEventBySlug,
  getPublishedEventBySlug,
  listAdminEvents,
  listPublicEvents,
  listPublicEventsByState,
};
