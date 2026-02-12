exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  const hasAboutPages = await knex.schema.hasTable('about_pages');
  if (!hasAboutPages) {
    await knex.schema.createTable('about_pages', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('slug').notNullable().unique();
      table.text('page_title').defaultTo('');
      table.text('subtitle');
      table.text('body');
      table.boolean('published').notNullable().defaultTo(false).index();
      table.text('seo_meta_title');
      table.text('seo_meta_description');
      table.string('seo_share_image');
      table.timestamps(true, true);
    });

    await knex.raw(
      "ALTER TABLE about_pages ADD CONSTRAINT about_pages_slug_check CHECK (slug IN ('history', 'who-we-are', 'about-agona-nyakrom-town'))"
    );
  }

  const hasLeaders = await knex.schema.hasTable('leaders');
  if (!hasLeaders) {
    await knex.schema.createTable('leaders', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('category').notNullable();
      table.integer('display_order');
      table.boolean('published').notNullable().defaultTo(false).index();
      table.text('role_title');
      table.text('name');
      table.string('photo');
      table.text('short_bio_snippet');
      table.text('full_bio');
      table.string('slug').notNullable().unique();
      table.timestamps(true, true);
    });

    await knex.raw(
      "ALTER TABLE leaders ADD CONSTRAINT leaders_category_check CHECK (category IN ('traditional', 'community_admin'))"
    );

    await knex.schema.alterTable('leaders', (table) => {
      table.index(['category', 'display_order']);
      table.index(['published', 'category']);
    });
  }

  const hasHistoryPage = await knex.schema.hasTable('history_page');
  if (hasHistoryPage) {
    await knex.raw(`
      INSERT INTO about_pages (slug, page_title, subtitle, body, published, seo_meta_title, seo_meta_description, seo_share_image, created_at, updated_at)
      SELECT
        'history',
        COALESCE(title, ''),
        subtitle,
        content,
        COALESCE(published, false),
        title,
        NULL,
        COALESCE(large_image_path, medium_image_path, thumbnail_image_path, original_image_path),
        COALESCE(created_at, NOW()),
        COALESCE(updated_at, NOW())
      FROM history_page
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
      LIMIT 1
      ON CONFLICT (slug)
      DO UPDATE SET
        page_title = EXCLUDED.page_title,
        subtitle = EXCLUDED.subtitle,
        body = EXCLUDED.body,
        published = EXCLUDED.published,
        seo_meta_title = EXCLUDED.seo_meta_title,
        seo_share_image = EXCLUDED.seo_share_image,
        updated_at = NOW();
    `);
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('leaders');
  await knex.schema.dropTableIfExists('about_pages');
};
