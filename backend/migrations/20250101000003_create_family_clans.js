/**
 * Family clans table
 * Stores clan info and logo imagery.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('family_clans', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('slug').notNullable().unique();
    table.text('intro');
    table.text('history');
    table.text('key_contributions');
    // Clan logo variants
    table.string('original_image_path');
    table.string('large_image_path');
    table.string('medium_image_path');
    table.string('thumbnail_image_path');
    table.boolean('published').notNullable().defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('family_clans');
};
