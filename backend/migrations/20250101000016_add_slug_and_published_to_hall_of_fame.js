/**
 * Add slug and published columns to hall_of_fame.
 * Backfills slugs safely for existing data and enforces uniqueness.
 */

exports.up = async function (knex) {
  // Add columns (slug initially nullable for backfill; published with default)
  await knex.schema.alterTable('hall_of_fame', (table) => {
    table.string('slug');
    table.boolean('published').notNullable().defaultTo(false);
  });

  // Backfill slug using a slugified name; ensure uniqueness by suffixing with id for duplicates/empties
  await knex.raw(`
    WITH base AS (
      SELECT
        id,
        LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) AS base_slug,
        ROW_NUMBER() OVER (
          PARTITION BY LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
          ORDER BY created_at, id
        ) AS rn
      FROM hall_of_fame
    )
    UPDATE hall_of_fame h
    SET slug = CASE
      WHEN NULLIF(base.base_slug, '') IS NULL THEN h.id::text
      WHEN base.rn = 1 THEN base.base_slug
      ELSE base.base_slug || '-' || SUBSTRING(h.id::text, 1, 8)
    END
    FROM base
    WHERE h.id = base.id
  `);

  // Enforce NOT NULL and uniqueness
  await knex.schema.alterTable('hall_of_fame', (table) => {
    table.string('slug').notNullable().alter();
  });
  await knex.schema.alterTable('hall_of_fame', (table) => {
    table.unique(['slug'], 'hall_of_fame_slug_unique_idx');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('hall_of_fame', (table) => {
    table.dropUnique(['slug'], 'hall_of_fame_slug_unique_idx');
  });
  await knex.schema.alterTable('hall_of_fame', (table) => {
    table.dropColumn('slug');
    table.dropColumn('published');
  });
};
