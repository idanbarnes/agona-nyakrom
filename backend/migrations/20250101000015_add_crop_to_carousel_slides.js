/**
 * Add normalized crop data for carousel slides (0-1 floats).
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('carousel_slides', (table) => {
    table.decimal('crop_x', 6, 5);
    table.decimal('crop_y', 6, 5);
    table.decimal('crop_w', 6, 5);
    table.decimal('crop_h', 6, 5);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('carousel_slides', (table) => {
    table.dropColumn('crop_x');
    table.dropColumn('crop_y');
    table.dropColumn('crop_w');
    table.dropColumn('crop_h');
  });
};
