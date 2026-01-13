/**
 * History page table
 * Stores a single-record history page with optional highlights and imagery.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('history_page', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.text('title').notNullable();
    table.text('subtitle');
    table.text('content').notNullable();
    table.jsonb('highlights');
    table.string('original_image_path');
    table.string('large_image_path');
    table.string('medium_image_path');
    table.string('thumbnail_image_path');
    table.boolean('published').notNullable().defaultTo(false).index();
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('history_page');
};
