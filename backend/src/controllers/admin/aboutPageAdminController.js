const aboutPageService = require('../../services/aboutPageService');
const mediaService = require('../../services/mediaService');
const { success, error } = require('../../utils/response');

const getAboutPage = async (req, res) => {
  try {
    const page = await aboutPageService.getBySlug(req.params.slug);
    if (!page) {
      return error(res, 'About page not found', 404);
    }
    return success(res, page, 'About page fetched successfully');
  } catch (err) {
    if (err.status === 400) {
      return error(res, err.message, 400);
    }
    console.error('Error fetching about page (admin):', err.message);
    return error(res, 'Failed to fetch about page', 500);
  }
};

const upsertAboutPage = async (req, res) => {
  try {
    const slug = req.params.slug;
    const current = await aboutPageService.getBySlug(slug);
    const payload = {
      page_title: req.body?.page_title ?? current?.page_title ?? '',
      subtitle: req.body?.subtitle ?? current?.subtitle ?? null,
      body: req.body?.body ?? current?.body ?? null,
      published:
        req.body?.published !== undefined
          ? req.body.published === true || req.body.published === 'true'
          : current?.published ?? false,
      seo_meta_title: req.body?.seo_meta_title ?? current?.seo_meta_title ?? null,
      seo_meta_description:
        req.body?.seo_meta_description ?? current?.seo_meta_description ?? null,
      seo_share_image: req.body?.seo_share_image ?? current?.seo_share_image ?? null,
    };

    const page = await aboutPageService.upsertBySlug(slug, payload);
    return success(res, page, 'About page saved successfully');
  } catch (err) {
    if (err.status === 400) {
      return error(res, err.message, 400);
    }
    console.error('Error saving about page (admin):', err.message);
    return error(res, 'Failed to save about page', 500);
  }
};

const uploadAboutImage = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, 'Image is required', 400);
    }

    const images = await mediaService.processImage(
      req.file,
      'history',
      `about-${Date.now()}`
    );

    return success(
      res,
      { image_url: images.large || images.original, images },
      'Image uploaded successfully'
    );
  } catch (err) {
    console.error('Error uploading about page image:', err.message);
    return error(res, err.message || 'Failed to upload image', 500);
  }
};

module.exports = {
  getAboutPage,
  upsertAboutPage,
  uploadAboutImage,
};
