/**
 * One-time backfill for obituary age values.
 * Computes age from birth_date and death_date so historical records
 * are permanently populated in the database.
 */

exports.up = async function up(knex) {
  const hasTable = await knex.schema.hasTable('obituaries');
  if (!hasTable) {
    return;
  }

  // Populate age for valid lifespans.
  await knex.raw(`
    UPDATE obituaries
    SET age = EXTRACT(YEAR FROM age(death_date::date, birth_date::date))::int
    WHERE birth_date IS NOT NULL
      AND death_date IS NOT NULL
      AND death_date::date >= birth_date::date
  `);

  // Clear age where dates are incomplete or invalid.
  await knex.raw(`
    UPDATE obituaries
    SET age = NULL
    WHERE birth_date IS NULL
      OR death_date IS NULL
      OR death_date::date < birth_date::date
  `);
};

exports.down = async function down() {
  // Irreversible data backfill; keep as no-op.
};

