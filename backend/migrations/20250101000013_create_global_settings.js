/**
 * Global settings table
 * Stores site-wide configuration such as contact info and social links.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('global_settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('site_name');
    table.string('tagline');
    table.string('contact_email');
    table.string('contact_phone');
    table.string('address');
    table.jsonb('social_links');
    table.jsonb('navigation_links');
    table.text('footer_text');
    table.boolean('published').notNullable().defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('global_settings');
};
