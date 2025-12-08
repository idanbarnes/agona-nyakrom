/**
 * Landmarks table
 * Stores virtual tour landmarks with primary and thumbnail imagery.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('landmarks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('slug').notNullable().unique();
    table.string('category');
    table.text('description');
    table.string('address');
    table.decimal('latitude', 9, 6);
    table.decimal('longitude', 9, 6);
    table.string('video_url');
    table.boolean('published').notNullable().defaultTo(false);
    // Image variants
    table.string('original_image_path');
    table.string('large_image_path');
    table.string('medium_image_path');
    table.string('thumbnail_image_path');
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('landmarks');
};
