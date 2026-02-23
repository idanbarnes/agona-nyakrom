/**
 * One-time backfill for obituary funeral service fields.
 * Fills funeral_location and funeral_start_at from available legacy data.
 */

exports.up = async function up(knex) {
  const hasTable = await knex.schema.hasTable('obituaries');
  if (!hasTable) {
    return;
  }

  const hasColumn = async (name) => knex.schema.hasColumn('obituaries', name);

  const [
    hasLocation,
    hasFuneralLocation,
    hasFuneralStartAt,
    hasVisitationStartAt,
    hasDeathDate,
  ] = await Promise.all([
    hasColumn('location'),
    hasColumn('funeral_location'),
    hasColumn('funeral_start_at'),
    hasColumn('visitation_start_at'),
    hasColumn('death_date'),
  ]);

  if (hasLocation && hasFuneralLocation) {
    await knex.raw(`
      UPDATE obituaries
      SET funeral_location = NULLIF(TRIM(location), '')
      WHERE (funeral_location IS NULL OR TRIM(funeral_location) = '')
        AND NULLIF(TRIM(location), '') IS NOT NULL
    `);
  }

  if (hasFuneralStartAt && hasVisitationStartAt && hasDeathDate) {
    await knex.raw(`
      UPDATE obituaries
      SET funeral_start_at = COALESCE(
        visitation_start_at,
        death_date::timestamp
      )
      WHERE funeral_start_at IS NULL
        AND (visitation_start_at IS NOT NULL OR death_date IS NOT NULL)
    `);
  }
};

exports.down = async function down() {
  // No-op: irreversible data backfill.
};

