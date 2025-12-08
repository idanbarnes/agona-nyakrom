/**
 * History table
 * Stores the town's historical content with optional featured imagery.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('title').notNullable();
    table.string('slug').notNullable().unique();
    table.text('summary');
    table.text('content').notNullable();
    // Image variants per media rules
    table.string('original_image_path');
    table.string('large_image_path');
    table.string('medium_image_path');
    table.string('thumbnail_image_path');
    table.boolean('published').notNullable().defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('history');
};
