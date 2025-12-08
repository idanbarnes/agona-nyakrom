/**
 * Hall of fame table
 * Stores honorees with portrait imagery.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('hall_of_fame', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('title');
    table.text('bio');
    table.text('achievements');
    table.boolean('is_featured').notNullable().defaultTo(false);
    table.integer('display_order');
    // Portrait variants
    table.string('original_image_path');
    table.string('large_image_path');
    table.string('medium_image_path');
    table.string('thumbnail_image_path');
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('hall_of_fame');
};
