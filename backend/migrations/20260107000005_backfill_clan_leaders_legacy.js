/**
 * Backfill legacy clan_leaders columns into the new schema fields.
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('clan_leaders');
  if (!hasTable) {
    return;
  }

  await knex.raw(`
    UPDATE clan_leaders
    SET clan_id = family_clan_id
    WHERE clan_id IS NULL AND family_clan_id IS NOT NULL
  `);

  await knex.raw(`
    UPDATE clan_leaders
    SET type = CASE
      WHEN is_current IS TRUE THEN 'current'
      WHEN is_current IS FALSE THEN 'past'
      ELSE type
    END
    WHERE type IS NULL
  `);

  await knex.raw(`
    UPDATE clan_leaders
    SET position = COALESCE(position, title, 'Unknown position')
    WHERE position IS NULL
  `);
};

exports.down = async function () {
  // No-op: legacy columns are not restored.
};
