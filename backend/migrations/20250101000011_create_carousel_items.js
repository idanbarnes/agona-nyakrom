/**
 * Carousel items table
 * Stores homepage hero/banner slides with optimized imagery.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('carousel_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('title').notNullable();
    table.string('subtitle');
    table.string('cta_text');
    table.string('cta_url');
    table.string('target_slug');
    table.integer('sort_order').notNullable().defaultTo(0);
    table.boolean('active').notNullable().defaultTo(true);
    // Hero image variants
    table.string('original_image_path');
    table.string('large_image_path');
    table.string('medium_image_path');
    table.string('thumbnail_image_path');
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('carousel_items');
};
