/**
 * Add dedicated Who We Are fields to homepage_blocks.
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('homepage_blocks', (table) => {
    table.text('secondary_cta_label');
    table.text('secondary_cta_href');
    table.text('who_we_are_paragraph_one');
    table.text('who_we_are_paragraph_two');
    table.jsonb('who_we_are_stats').notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.jsonb('who_we_are_gallery').notNullable().defaultTo(knex.raw("'[]'::jsonb"));
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('homepage_blocks', (table) => {
    table.dropColumn('who_we_are_gallery');
    table.dropColumn('who_we_are_stats');
    table.dropColumn('who_we_are_paragraph_two');
    table.dropColumn('who_we_are_paragraph_one');
    table.dropColumn('secondary_cta_href');
    table.dropColumn('secondary_cta_label');
  });
};
