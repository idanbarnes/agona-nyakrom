/**
 * Add normalized rich-text body to hall_of_fame and backfill legacy content.
 */

exports.up = async function up(knex) {
  await knex.schema.alterTable('hall_of_fame', (table) => {
    table.text('body');
  });

  await knex.raw(`
    UPDATE hall_of_fame
    SET body = COALESCE(NULLIF(body, ''), NULLIF(bio, ''), NULLIF(achievements, ''))
  `);
};

exports.down = async function down(knex) {
  await knex.schema.alterTable('hall_of_fame', (table) => {
    table.dropColumn('body');
  });
};
