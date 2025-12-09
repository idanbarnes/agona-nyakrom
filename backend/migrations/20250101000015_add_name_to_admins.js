exports.up = async function (knex) {
  await knex.schema.alterTable('admins', (table) => {
    table.string('name').defaultTo('Default Admin');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('admins', (table) => {
    table.dropColumn('name');
  });
};
