const eventsService = require('../services/eventsService');
const announcementsService = require('../services/announcementsService');
const { success, error } = require('../utils/response');

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const getPublicAnnouncementsEvents = async (req, res) => {
  try {
    const {
      events_limit,
      coming_soon_limit,
      upcoming_limit,
      past_limit,
      announcements_limit,
      announcements_page,
    } = req.query || {};

    const defaultEventsLimit = toPositiveInt(events_limit, 10);

    const events = await eventsService.listPublicEventsByState({
      comingSoonLimit: toPositiveInt(coming_soon_limit, defaultEventsLimit),
      upcomingLimit: toPositiveInt(upcoming_limit, defaultEventsLimit),
      pastLimit: toPositiveInt(past_limit, defaultEventsLimit),
    });

    const announcements = await announcementsService.listPublicAnnouncements({
      limit: toPositiveInt(announcements_limit, 10),
      page: toPositiveInt(announcements_page, 1),
    });

    return success(
      res,
      {
        events,
        announcements: announcements.items,
      },
      'Announcements and events fetched successfully'
    );
  } catch (err) {
    console.error('Error fetching announcements & events:', err.message);
    return error(res, 'Failed to fetch announcements and events', 500);
  }
};

module.exports = {
  getPublicAnnouncementsEvents,
};
