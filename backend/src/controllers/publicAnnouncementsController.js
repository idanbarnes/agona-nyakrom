const announcementsService = require('../services/announcementsService');
const { success, error } = require('../utils/response');

const getPublicAnnouncements = async (req, res) => {
  try {
    const { page, limit } = req.query || {};
    const result = await announcementsService.listPublicAnnouncements({ page, limit });
    return success(res, result, 'Announcements fetched successfully');
  } catch (err) {
    console.error('Error fetching public announcements:', err.message);
    return error(res, 'Failed to fetch announcements', 500);
  }
};

const getPublicAnnouncementBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const announcement = await announcementsService.getPublishedAnnouncementBySlug(slug);
    if (!announcement) {
      return error(res, 'Announcement not found', 404);
    }
    return success(res, announcement, 'Announcement fetched successfully');
  } catch (err) {
    console.error('Error fetching public announcement:', err.message);
    return error(res, 'Failed to fetch announcement', 500);
  }
};

module.exports = {
  getPublicAnnouncements,
  getPublicAnnouncementBySlug,
};
