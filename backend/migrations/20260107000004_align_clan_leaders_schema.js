/**
 * Align clan_leaders table to latest schema (adds missing columns/constraints/indexes).
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  const hasTable = await knex.schema.hasTable('clan_leaders');
  if (!hasTable) {
    await knex.schema.createTable('clan_leaders', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table
        .uuid('clan_id')
        .notNullable()
        .references('id')
        .inTable('family_clans')
        .onDelete('CASCADE');
      table.string('type').notNullable();
      table.string('name');
      table.string('title');
      table.string('position').notNullable();
      table.integer('display_order').notNullable().defaultTo(0);
      table.string('original_image_path');
      table.string('large_image_path');
      table.string('medium_image_path');
      table.string('thumbnail_image_path');
      table.timestamps(true, true);
    });

    await knex.raw(
      "ALTER TABLE clan_leaders ADD CONSTRAINT clan_leaders_type_check CHECK (type IN ('current', 'past'))"
    );
  } else {
    await knex.raw(`
      ALTER TABLE clan_leaders
        ADD COLUMN IF NOT EXISTS clan_id uuid,
        ADD COLUMN IF NOT EXISTS type varchar(255),
        ADD COLUMN IF NOT EXISTS name varchar(255),
        ADD COLUMN IF NOT EXISTS title varchar(255),
        ADD COLUMN IF NOT EXISTS position varchar(255),
        ADD COLUMN IF NOT EXISTS display_order integer,
        ADD COLUMN IF NOT EXISTS original_image_path varchar(255),
        ADD COLUMN IF NOT EXISTS large_image_path varchar(255),
        ADD COLUMN IF NOT EXISTS medium_image_path varchar(255),
        ADD COLUMN IF NOT EXISTS thumbnail_image_path varchar(255),
        ADD COLUMN IF NOT EXISTS created_at timestamptz,
        ADD COLUMN IF NOT EXISTS updated_at timestamptz
    `);

    await knex.raw(`
      UPDATE clan_leaders
      SET display_order = COALESCE(display_order, 0)
    `);

    await knex.raw(`
      UPDATE clan_leaders
      SET position = COALESCE(position, 'Unknown position')
      WHERE position IS NULL
    `);

    await knex.raw(`
      ALTER TABLE clan_leaders
        ALTER COLUMN type SET NOT NULL,
        ALTER COLUMN position SET NOT NULL,
        ALTER COLUMN display_order SET NOT NULL,
        ALTER COLUMN display_order SET DEFAULT 0,
        ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
        ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP
    `);

    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'clan_leaders_clan_id_fkey'
        ) THEN
          ALTER TABLE clan_leaders
          ADD CONSTRAINT clan_leaders_clan_id_fkey
          FOREIGN KEY (clan_id)
          REFERENCES family_clans(id)
          ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'clan_leaders_type_check'
        ) THEN
          ALTER TABLE clan_leaders
          ADD CONSTRAINT clan_leaders_type_check CHECK (type IN ('current', 'past'));
        END IF;

        IF EXISTS (
          SELECT 1 FROM clan_leaders WHERE clan_id IS NULL LIMIT 1
        ) THEN
          -- Keep clan_id nullable when legacy rows are missing a clan reference.
          NULL;
        ELSE
          ALTER TABLE clan_leaders ALTER COLUMN clan_id SET NOT NULL;
        END IF;
      END $$;
    `);
  }

  await knex.raw(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clan_leaders' AND column_name = 'clan_id'
      ) THEN
        CREATE INDEX IF NOT EXISTS clan_leaders_clan_id_idx ON clan_leaders (clan_id);
        CREATE INDEX IF NOT EXISTS clan_leaders_clan_type_order_idx
          ON clan_leaders (clan_id, type, display_order);
      END IF;
    END $$;
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('clan_leaders');
};
