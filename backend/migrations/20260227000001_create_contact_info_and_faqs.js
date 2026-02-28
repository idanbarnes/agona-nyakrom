/**
 * Contact CMS tables
 * - contact_info stores a single editable contact section payload.
 * - contact_faqs stores FAQ entries for the contact page.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('contact_info', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.boolean('singleton').notNullable().defaultTo(true).unique();
    table.string('section_title').notNullable().defaultTo('Get in Touch');
    table.text('section_subtitle').notNullable().defaultTo('Have questions or feedback? Reach out to us.');
    table.jsonb('emails').notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.jsonb('phones').notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.jsonb('address').notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    table.jsonb('office_hours').notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    table
      .uuid('updated_by')
      .references('id')
      .inTable('admins')
      .onDelete('SET NULL');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('contact_faqs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.text('question').notNullable();
    table.text('answer').notNullable();
    table.integer('display_order').notNullable().defaultTo(1);
    table.boolean('is_active').notNullable().defaultTo(true);
    table
      .uuid('created_by')
      .references('id')
      .inTable('admins')
      .onDelete('SET NULL');
    table
      .uuid('updated_by')
      .references('id')
      .inTable('admins')
      .onDelete('SET NULL');
    table.timestamps(true, true);
  });

  await knex.schema.alterTable('contact_faqs', (table) => {
    table.index(['display_order']);
    table.index(['is_active']);
  });

  await knex('contact_info').insert({ singleton: true });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('contact_faqs');
  await knex.schema.dropTableIfExists('contact_info');
};
