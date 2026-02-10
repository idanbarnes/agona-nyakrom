/**
 * Add event_tag to events table
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('events', (table) => {
    table.string('event_tag', 80)
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('events', (table) => {
    table.dropColumn('event_tag')
  })
}
