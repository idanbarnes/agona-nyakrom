/**
 * Drop legacy clan_leaders columns no longer used by the app.
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('clan_leaders');
  if (!hasTable) {
    return;
  }

  await knex.schema.alterTable('clan_leaders', (table) => {
    table.dropColumn('family_clan_id');
    table.dropColumn('bio');
    table.dropColumn('tenure_start');
    table.dropColumn('tenure_end');
    table.dropColumn('is_current');
  });
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('clan_leaders');
  if (!hasTable) {
    return;
  }

  await knex.schema.alterTable('clan_leaders', (table) => {
    table.uuid('family_clan_id');
    table.text('bio');
    table.date('tenure_start');
    table.date('tenure_end');
    table.boolean('is_current');
  });
};
