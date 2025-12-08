/**
 * Obituaries table
 * Stores obituary details and poster imagery.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('obituaries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('slug').notNullable().unique();
    table.date('birth_date');
    table.date('death_date');
    table.integer('age');
    table.timestamp('funeral_start_at');
    table.timestamp('funeral_end_at');
    table.string('location');
    table.text('description'); // optional eulogy or extra notes
    table.string('map_link');
    table.boolean('published').notNullable().defaultTo(false);
    // Poster variants (main and thumbnail generation)
    table.string('original_image_path');
    table.string('large_image_path');
    table.string('medium_image_path');
    table.string('thumbnail_image_path');
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('obituaries');
};
