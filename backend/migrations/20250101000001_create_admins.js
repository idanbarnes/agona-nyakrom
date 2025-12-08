/**
 * Admins table
 * Stores backend admin users with hashed credentials and role-based access.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('admins', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('role').notNullable().defaultTo('admin');
    table.boolean('active').notNullable().defaultTo(true);
    table.timestamp('last_login_at');
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('admins');
};
