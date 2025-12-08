/**
 * Homepage settings table
 * Holds singleton configuration for the homepage (hero, featured items).
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('homepage_settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('hero_title');
    table.string('hero_subtitle');
    table.string('hero_cta_text');
    table.string('hero_cta_url');
    table.specificType('featured_news_ids', 'uuid[]');
    table.specificType('featured_hall_of_fame_ids', 'uuid[]');
    table.specificType('featured_landmark_ids', 'uuid[]');
    table.boolean('published').notNullable().defaultTo(false);
    // Hero/banner image variants
    table.string('original_image_path');
    table.string('large_image_path');
    table.string('medium_image_path');
    table.string('thumbnail_image_path');
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('homepage_settings');
};
