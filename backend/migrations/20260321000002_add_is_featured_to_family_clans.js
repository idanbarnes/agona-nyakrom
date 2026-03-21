/**
 * Add is_featured flag to family_clans for featured clan rollouts.
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('family_clans', (table) => {
    table.boolean('is_featured').notNullable().defaultTo(false);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('family_clans', (table) => {
    table.dropColumn('is_featured');
  });
};
