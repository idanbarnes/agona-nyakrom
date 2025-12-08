/**
 * Past leaders table
 * Historical leaders tied to family clans.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('past_leaders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('family_clan_id')
      .references('id')
      .inTable('family_clans')
      .onDelete('CASCADE')
      .notNullable();
    table.string('name').notNullable();
    table.string('title');
    table.text('bio');
    table.date('tenure_start');
    table.date('tenure_end');
    // Portrait variants
    table.string('original_image_path');
    table.string('large_image_path');
    table.string('medium_image_path');
    table.string('thumbnail_image_path');
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('past_leaders');
};
