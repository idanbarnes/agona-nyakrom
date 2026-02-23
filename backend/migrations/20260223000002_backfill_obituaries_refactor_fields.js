/**
 * One-time backfill for obituary refactor fields.
 * Populates new columns from legacy obituary data where possible.
 */

exports.up = async function up(knex) {
  const hasTable = await knex.schema.hasTable('obituaries');
  if (!hasTable) {
    return;
  }

  const hasColumn = async (name) => knex.schema.hasColumn('obituaries', name);

  const [
    hasDeceasedPhotoUrl,
    hasPosterImageUrl,
    hasVisitationStartAt,
    hasVisitationLocation,
    hasFuneralLocation,
    hasBurialLocation,
    hasLocation,
    hasBirthDate,
    hasDeathDate,
    hasAge,
  ] = await Promise.all([
    hasColumn('deceased_photo_url'),
    hasColumn('poster_image_url'),
    hasColumn('visitation_start_at'),
    hasColumn('visitation_location'),
    hasColumn('funeral_location'),
    hasColumn('burial_location'),
    hasColumn('location'),
    hasColumn('birth_date'),
    hasColumn('death_date'),
    hasColumn('age'),
  ]);

  if (hasDeceasedPhotoUrl) {
    await knex.raw(`
      UPDATE obituaries
      SET deceased_photo_url = COALESCE(
        NULLIF(TRIM(deceased_photo_url), ''),
        medium_image_path,
        large_image_path,
        thumbnail_image_path,
        original_image_path
      )
      WHERE (deceased_photo_url IS NULL OR TRIM(deceased_photo_url) = '')
        AND COALESCE(
          medium_image_path,
          large_image_path,
          thumbnail_image_path,
          original_image_path
        ) IS NOT NULL
    `);
  }

  if (hasPosterImageUrl) {
    await knex.raw(`
      UPDATE obituaries
      SET poster_image_url = COALESCE(
        NULLIF(TRIM(poster_image_url), ''),
        original_image_path,
        large_image_path,
        medium_image_path,
        thumbnail_image_path
      )
      WHERE (poster_image_url IS NULL OR TRIM(poster_image_url) = '')
        AND COALESCE(
          original_image_path,
          large_image_path,
          medium_image_path,
          thumbnail_image_path
        ) IS NOT NULL
    `);
  }

  if (hasVisitationStartAt) {
    await knex.raw(`
      UPDATE obituaries
      SET visitation_start_at = funeral_start_at
      WHERE visitation_start_at IS NULL
        AND funeral_start_at IS NOT NULL
    `);
  }

  if (hasLocation && hasVisitationLocation) {
    await knex.raw(`
      UPDATE obituaries
      SET visitation_location = NULLIF(TRIM(location), '')
      WHERE (visitation_location IS NULL OR TRIM(visitation_location) = '')
        AND NULLIF(TRIM(location), '') IS NOT NULL
    `);
  }

  if (hasLocation && hasFuneralLocation) {
    await knex.raw(`
      UPDATE obituaries
      SET funeral_location = NULLIF(TRIM(location), '')
      WHERE (funeral_location IS NULL OR TRIM(funeral_location) = '')
        AND NULLIF(TRIM(location), '') IS NOT NULL
    `);
  }

  if (hasLocation && hasBurialLocation) {
    await knex.raw(`
      UPDATE obituaries
      SET burial_location = NULLIF(TRIM(location), '')
      WHERE (burial_location IS NULL OR TRIM(burial_location) = '')
        AND NULLIF(TRIM(location), '') IS NOT NULL
    `);
  }

  if (hasBirthDate && hasDeathDate && hasAge) {
    await knex.raw(`
      UPDATE obituaries
      SET age = EXTRACT(YEAR FROM age(death_date::date, birth_date::date))::int
      WHERE birth_date IS NOT NULL
        AND death_date IS NOT NULL
        AND death_date::date >= birth_date::date
        AND (age IS NULL OR age < 0)
    `);
  }
};

exports.down = async function down() {
  // No-op: irreversible data backfill.
};

