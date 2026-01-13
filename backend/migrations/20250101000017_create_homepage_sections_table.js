/**
 * Homepage sections table
 * Stores configurable homepage content blocks with optional imagery.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('homepage_sections', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('section_key').notNullable().unique();
    table.string('title').notNullable();
    table.text('content');
    table.boolean('is_featured').notNullable().defaultTo(false);
    table.integer('display_order').notNullable().defaultTo(0);
    table.text('original_image_path');
    table.text('large_image_path');
    table.text('medium_image_path');
    table.text('thumbnail_image_path');
    table.boolean('published').notNullable().defaultTo(false);
    table.timestamps(true, true);

    table.index(['published'], 'homepage_sections_published_idx');
    table.index(['display_order'], 'homepage_sections_display_order_idx');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('homepage_sections');
};
