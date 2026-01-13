/**
 * Carousel slides table
 * Stores homepage slider content with optional CTA and imagery.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('carousel_slides', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.text('title');
    table.text('subtitle');
    table.text('caption');
    table.text('cta_text');
    table.text('cta_url');
    table.string('original_image_path');
    table.string('large_image_path');
    table.string('medium_image_path');
    table.string('thumbnail_image_path');
    table.integer('display_order').notNullable().defaultTo(0).index();
    table.boolean('published').notNullable().defaultTo(false).index();
    table.timestamps(true, true);

    table.index(['published', 'display_order']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('carousel_slides');
};
