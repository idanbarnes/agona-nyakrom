/**
 * Asafo companies table
 * Stores details and imagery for Asafo groups.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('asafo_companies', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('slug').notNullable().unique();
    table.text('history');
    table.text('description');
    table.text('events');
    // Image variants
    table.string('original_image_path');
    table.string('large_image_path');
    table.string('medium_image_path');
    table.string('thumbnail_image_path');
    table.boolean('published').notNullable().defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('asafo_companies');
};
