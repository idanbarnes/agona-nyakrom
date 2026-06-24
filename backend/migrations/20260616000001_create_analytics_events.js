/**
 * Privacy-conscious first-party visitor analytics.
 *
 * Raw events intentionally avoid IP addresses, user IDs, auth data, raw
 * referrer URLs, and arbitrary unvalidated payloads.
 */

exports.up = async function (knex) {
  await knex.schema.createTable('analytics_events', (table) => {
    table.bigIncrements('id').primary();
    table.timestamp('occurred_at', { useTz: true }).notNullable();
    table.timestamp('received_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.string('event_type', 64).notNullable();
    table.string('anon_session_id', 64).notNullable();
    table.text('route_path').notNullable();
    table.string('route_pattern', 128);
    table.string('page_title', 160);
    table.string('content_type', 64);
    table.string('content_id', 96);
    table.string('content_slug', 160);
    table.string('referrer_category', 32).notNullable().defaultTo('direct');
    table.string('device_category', 32).notNullable().defaultTo('unknown');
    table.string('campaign_source', 96);
    table.string('campaign_medium', 96);
    table.string('campaign_name', 128);
    table.string('campaign_term', 128);
    table.string('campaign_content', 128);
    table.integer('read_depth_percent');
    table.text('search_query');
    table.integer('search_result_count');
    table.integer('search_result_position');
    table.jsonb('metadata').notNullable().defaultTo(knex.raw("'{}'::jsonb"));

    table.index(['occurred_at']);
    table.index(['event_type', 'occurred_at']);
    table.index(['anon_session_id', 'occurred_at']);
    table.index(['route_path', 'occurred_at']);
    table.index(['content_type', 'content_id']);
    table.index(['referrer_category', 'occurred_at']);
    table.index(['device_category', 'occurred_at']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('analytics_events');
};
