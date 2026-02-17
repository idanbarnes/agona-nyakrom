exports.up = async function up(knex) {
  const hasEntryType = await knex.schema.hasColumn('asafo_companies', 'entry_type');
  if (!hasEntryType) {
    await knex.schema.alterTable('asafo_companies', (table) => {
      table.string('entry_type').notNullable().defaultTo('company');
      table.string('company_key');
      table.string('title');
      table.string('subtitle');
      table.text('body');
      table.integer('display_order').notNullable().defaultTo(0);
      table.string('seo_meta_title');
      table.text('seo_meta_description');
      table.string('seo_share_image');
    });
  }

  await knex.raw(`
    UPDATE asafo_companies
    SET
      entry_type = 'company',
      company_key = COALESCE(company_key, slug),
      title = COALESCE(title, name),
      subtitle = COALESCE(subtitle, description),
      body = COALESCE(
        body,
        CONCAT(
          CASE WHEN history IS NOT NULL AND history <> '' THEN '<p>' || history || '</p>' ELSE '' END,
          CASE WHEN description IS NOT NULL AND description <> '' THEN '<p>' || description || '</p>' ELSE '' END,
          CASE WHEN events IS NOT NULL AND events <> '' THEN '<p>' || events || '</p>' ELSE '' END
        )
      ),
      display_order = CASE
        WHEN slug = 'adonten' THEN 20
        WHEN slug = 'kyeremu' THEN 30
        ELSE COALESCE(display_order, 100)
      END
    WHERE entry_type = 'company' OR entry_type IS NULL
  `);

  await knex.raw(`
    UPDATE asafo_companies
    SET company_key = NULL
    WHERE entry_type = 'introduction'
  `);

  await knex.raw(`
    INSERT INTO asafo_companies
      (name, slug, title, subtitle, body, entry_type, company_key, published, display_order, created_at, updated_at)
    SELECT
      'Introduction',
      'introduction',
      'Introduction',
      'Asafo Company and Agona Nyakrom tradition',
      '<p>Add introduction content for Asafo Company.</p>',
      'introduction',
      NULL,
      false,
      10,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM asafo_companies WHERE entry_type = 'introduction'
    )
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS asafo_companies_one_introduction_idx
    ON asafo_companies ((entry_type))
    WHERE entry_type = 'introduction'
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS asafo_companies_unique_company_key_idx
    ON asafo_companies ((lower(company_key)))
    WHERE entry_type = 'company' AND company_key IS NOT NULL
  `);
};

exports.down = async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS asafo_companies_one_introduction_idx');
  await knex.raw('DROP INDEX IF EXISTS asafo_companies_unique_company_key_idx');

  const hasEntryType = await knex.schema.hasColumn('asafo_companies', 'entry_type');
  if (hasEntryType) {
    await knex.schema.alterTable('asafo_companies', (table) => {
      table.dropColumn('entry_type');
      table.dropColumn('company_key');
      table.dropColumn('title');
      table.dropColumn('subtitle');
      table.dropColumn('body');
      table.dropColumn('display_order');
      table.dropColumn('seo_meta_title');
      table.dropColumn('seo_meta_description');
      table.dropColumn('seo_share_image');
    });
  }
};
