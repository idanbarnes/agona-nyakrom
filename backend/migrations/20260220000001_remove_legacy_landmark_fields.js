/**
 * Remove legacy landmark fields no longer used by admin/public flows.
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('landmarks', (table) => {
    table.dropColumn('title');
    table.dropColumn('category');
    table.dropColumn('address');
    table.dropColumn('latitude');
    table.dropColumn('longitude');
    table.dropColumn('video_url');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('landmarks', (table) => {
    table.string('title');
    table.string('category');
    table.string('address');
    table.decimal('latitude', 9, 6);
    table.decimal('longitude', 9, 6);
    table.string('video_url');
  });
};
