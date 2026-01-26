/**
 * Homepage blocks table
 * Stores modular homepage blocks with shared content fields and type-specific settings.
 */

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('homepage_blocks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title');
    table.string('block_type').notNullable();
    table.integer('display_order').notNullable().defaultTo(0);
    table.boolean('is_published').notNullable().defaultTo(false);
    table.timestamp('published_at');

    table.string('subtitle');
    table.text('body');
    table.string('cta_label');
    table.string('cta_href');
    table.string('theme_variant').notNullable().defaultTo('default');
    table.string('container_width').notNullable().defaultTo('standard');

    table.text('media_image_id');
    table.text('media_alt_text');
    table.string('layout_variant').notNullable().defaultTo('image_right');

    table.string('hof_selection_mode').notNullable().defaultTo('random');
    table.integer('hof_items_count').notNullable().defaultTo(3);
    table.specificType('hof_manual_item_ids', 'uuid[]');
    table.string('hof_filter_tag');
    table.boolean('hof_show_cta').notNullable().defaultTo(true);
    table.string('hof_cta_label').notNullable().defaultTo('View Hall of Fame');
    table.string('hof_cta_href').notNullable().defaultTo('/hall-of-fame');

    table.string('news_source').notNullable().defaultTo('news');
    table.string('news_feature_mode').notNullable().defaultTo('latest');
    table.uuid('news_featured_item_id');
    table.integer('news_list_count').notNullable().defaultTo(4);
    table.boolean('news_show_dates').notNullable().defaultTo(true);
    table.string('news_cta_label').notNullable().defaultTo('View Updates');
    table.string('news_cta_href').notNullable().defaultTo('/updates');

    table.text('quote_text');
    table.string('quote_author');
    table.string('background_style').notNullable().defaultTo('solid');
    table.text('background_image_id');
    table.string('background_overlay_strength').notNullable().defaultTo('medium');

    table.jsonb('gateway_items').notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.integer('gateway_columns_desktop').notNullable().defaultTo(3);
    table.integer('gateway_columns_tablet').notNullable().defaultTo(2);
    table.integer('gateway_columns_mobile').notNullable().defaultTo(1);

    table.timestamps(true, true);

    table.index(['is_published'], 'homepage_blocks_published_idx');
    table.index(['display_order'], 'homepage_blocks_display_order_idx');
    table.index(['block_type'], 'homepage_blocks_type_idx');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('homepage_blocks');
};
