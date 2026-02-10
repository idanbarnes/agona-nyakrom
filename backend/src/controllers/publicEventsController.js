const eventsService = require('../services/eventsService');
const { success, error } = require('../utils/response');

const getPublicEvents = async (req, res) => {
  try {
    const { state, tag, page, limit } = req.query || {};
    const normalizedState = state ? String(state).trim().toLowerCase() : undefined;

    if (normalizedState && !['coming_soon', 'upcoming', 'past', 'all'].includes(normalizedState)) {
      return error(res, 'state must be coming_soon, upcoming, past, or all', 400);
    }

    const result = await eventsService.listPublicEvents({
      state: normalizedState === 'all' ? undefined : normalizedState,
      tag: tag ? String(tag).trim() : undefined,
      page,
      limit,
    });

    return success(res, result, 'Events fetched successfully');
  } catch (err) {
    console.error('Error fetching public events:', err.message);
    return error(res, 'Failed to fetch events', 500);
  }
};

const getPublicEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await eventsService.getPublishedEventBySlug(slug);
    if (!event) {
      return error(res, 'Event not found', 404);
    }
    return success(res, event, 'Event fetched successfully');
  } catch (err) {
    console.error('Error fetching public event:', err.message);
    return error(res, 'Failed to fetch event', 500);
  }
};

module.exports = {
  getPublicEvents,
  getPublicEventBySlug,
};
