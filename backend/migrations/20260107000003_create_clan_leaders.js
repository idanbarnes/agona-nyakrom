/**
 * Clan leaders table (current + past leaders).
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  const exists = await knex.schema.hasTable('clan_leaders');
  if (exists) {
    return;
  }

  await knex.schema.createTable('clan_leaders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('clan_id')
      .notNullable()
      .references('id')
      .inTable('family_clans')
      .onDelete('CASCADE');
    table.string('type').notNullable();
    table.string('name');
    table.string('title');
    table.string('position').notNullable();
    table.integer('display_order').notNullable().defaultTo(0);
    table.string('original_image_path');
    table.string('large_image_path');
    table.string('medium_image_path');
    table.string('thumbnail_image_path');
    table.timestamps(true, true);
  });

  await knex.raw(
    "ALTER TABLE clan_leaders ADD CONSTRAINT clan_leaders_type_check CHECK (type IN ('current', 'past'))"
  );

  await knex.schema.alterTable('clan_leaders', (table) => {
    table.index('clan_id');
    table.index(['clan_id', 'type', 'display_order']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('clan_leaders');
};
