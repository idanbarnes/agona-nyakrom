/**
 * Contact submissions table
 * Stores messages from the public contact form.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('contact_submissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('email').notNullable();
    table.string('phone');
    table.string('purpose');
    table.text('message').notNullable();
    table.string('status').notNullable().defaultTo('pending'); // pending, handled
    table.timestamp('handled_at');
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('contact_submissions');
};
