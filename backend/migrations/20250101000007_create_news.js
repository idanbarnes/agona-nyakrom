/**
 * News table
 * Stores news articles with cover and thumbnail imagery.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('news', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('title').notNullable();
    table.string('slug').notNullable().unique();
    table.text('excerpt');
    table.text('content').notNullable();
    table.string('reporter');
    table.timestamp('published_at');
    table.string('status').notNullable().defaultTo('draft'); // draft, published, archived
    table.specificType('tags', 'text[]');
    table.specificType('categories', 'text[]');
    // Image variants (cover + thumbnail generation)
    table.string('original_image_path');
    table.string('large_image_path');
    table.string('medium_image_path');
    table.string('thumbnail_image_path');
    table.boolean('published').notNullable().defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('news');
};
