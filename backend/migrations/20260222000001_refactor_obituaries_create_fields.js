/**
 * Refactor obituary create fields
 * Adds URL/service-specific fields used by the admin obituary create flow.
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('obituaries');
  if (!hasTable) {
    return;
  }

  const addColumnIfMissing = async (columnName, builder) => {
    const exists = await knex.schema.hasColumn('obituaries', columnName);
    if (exists) {
      return;
    }

    await knex.schema.alterTable('obituaries', (table) => {
      builder(table);
    });
  };

  await addColumnIfMissing('deceased_photo_url', (table) => {
    table.string('deceased_photo_url');
  });

  await addColumnIfMissing('poster_image_url', (table) => {
    table.string('poster_image_url');
  });

  await addColumnIfMissing('visitation_start_at', (table) => {
    table.timestamp('visitation_start_at', { useTz: true });
  });

  await addColumnIfMissing('visitation_location', (table) => {
    table.string('visitation_location');
  });

  await addColumnIfMissing('funeral_location', (table) => {
    table.string('funeral_location');
  });

  await addColumnIfMissing('burial_location', (table) => {
    table.string('burial_location');
  });
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('obituaries');
  if (!hasTable) {
    return;
  }

  const dropColumnIfExists = async (columnName) => {
    const exists = await knex.schema.hasColumn('obituaries', columnName);
    if (!exists) {
      return;
    }

    await knex.schema.alterTable('obituaries', (table) => {
      table.dropColumn(columnName);
    });
  };

  await dropColumnIfExists('burial_location');
  await dropColumnIfExists('funeral_location');
  await dropColumnIfExists('visitation_location');
  await dropColumnIfExists('visitation_start_at');
  await dropColumnIfExists('poster_image_url');
  await dropColumnIfExists('deceased_photo_url');
};
