/**
 * Add title column to landmarks to support admin UI.
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('landmarks', (table) => {
    table.string('title');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('landmarks', (table) => {
    table.dropColumn('title');
  });
};
