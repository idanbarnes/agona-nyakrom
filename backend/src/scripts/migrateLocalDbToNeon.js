require('dotenv').config();
const { Pool } = require('pg');

const EXCLUDED_TABLES = new Set(['knex_migrations', 'knex_migrations_lock']);

const TARGET_SSL =
  String(process.env.DB_SSL || '').trim().toLowerCase() === 'true'
    ? { rejectUnauthorized: false }
    : false;

const SOURCE_SSL =
  String(process.env.SOURCE_DB_SSL || '').trim().toLowerCase() === 'true'
    ? { rejectUnauthorized: false }
    : false;

function createSourcePool() {
  if (process.env.SOURCE_DATABASE_URL) {
    return new Pool({
      connectionString: process.env.SOURCE_DATABASE_URL,
      ssl: SOURCE_SSL,
    });
  }

  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
  if (!DB_HOST || !DB_PORT || !DB_NAME || !DB_USER || !DB_PASSWORD) {
    throw new Error(
      'Local source database settings are missing. Set DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD, or provide SOURCE_DATABASE_URL.'
    );
  }

  return new Pool({
    host: DB_HOST,
    port: Number(DB_PORT) || 5432,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    ssl: SOURCE_SSL,
  });
}

function createTargetPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for the Neon target database.');
  }

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: TARGET_SSL,
  });
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function getPublicTables(client) {
  const { rows } = await client.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename ASC
  `);

  return rows
    .map((row) => row.tablename)
    .filter((tableName) => !EXCLUDED_TABLES.has(tableName));
}

async function getDependencies(client) {
  const { rows } = await client.query(`
    SELECT
      child.relname AS table_name,
      parent.relname AS depends_on
    FROM pg_constraint AS constraint_def
    JOIN pg_class AS child
      ON child.oid = constraint_def.conrelid
    JOIN pg_namespace AS child_ns
      ON child_ns.oid = child.relnamespace
    JOIN pg_class AS parent
      ON parent.oid = constraint_def.confrelid
    JOIN pg_namespace AS parent_ns
      ON parent_ns.oid = parent.relnamespace
    WHERE constraint_def.contype = 'f'
      AND child_ns.nspname = 'public'
      AND parent_ns.nspname = 'public'
  `);

  return rows;
}

function sortTablesByDependencies(tableNames, dependencyRows) {
  const dependencyMap = new Map();
  const dependentsMap = new Map();

  tableNames.forEach((tableName) => {
    dependencyMap.set(tableName, new Set());
    dependentsMap.set(tableName, new Set());
  });

  dependencyRows.forEach(({ table_name: tableName, depends_on: dependsOn }) => {
    if (!dependencyMap.has(tableName) || !dependencyMap.has(dependsOn)) {
      return;
    }

    dependencyMap.get(tableName).add(dependsOn);
    dependentsMap.get(dependsOn).add(tableName);
  });

  const ready = tableNames
    .filter((tableName) => dependencyMap.get(tableName).size === 0)
    .sort();
  const ordered = [];

  while (ready.length) {
    const next = ready.shift();
    ordered.push(next);

    [...dependentsMap.get(next)]
      .sort()
      .forEach((dependent) => {
        const remaining = dependencyMap.get(dependent);
        remaining.delete(next);
        if (remaining.size === 0 && !ordered.includes(dependent) && !ready.includes(dependent)) {
          ready.push(dependent);
          ready.sort();
        }
      });
  }

  if (ordered.length !== tableNames.length) {
    throw new Error(
      'Unable to derive a safe table copy order. Resolve cyclic dependencies manually before running migration.'
    );
  }

  return ordered;
}

async function truncateTargetTables(client, orderedTables) {
  const reverseOrder = [...orderedTables].reverse();
  if (!reverseOrder.length) {
    return;
  }

  const joined = reverseOrder.map((tableName) => quoteIdentifier(tableName)).join(', ');
  await client.query(`TRUNCATE TABLE ${joined} RESTART IDENTITY CASCADE`);
}

async function getTableColumns(client, tableName) {
  const { rows } = await client.query(
    `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position ASC
    `,
    [tableName]
  );

  return rows.map((row) => ({
    name: row.column_name,
    dataType: row.data_type,
    udtName: row.udt_name,
  }));
}

function normalizeJsonValue(value, tableName, columnName) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      return JSON.stringify(JSON.parse(trimmed));
    } catch {
      throw new Error(
        `Invalid JSON in ${tableName}.${columnName}. The local database contains a string that is not valid JSON.`
      );
    }
  }

  try {
    return JSON.stringify(value);
  } catch {
    throw new Error(
      `Invalid JSON in ${tableName}.${columnName}. The value could not be serialized as JSON.`
    );
  }
}

function normalizeValueForTargetColumn(value, column, tableName) {
  if (!column) {
    return value;
  }

  if (column.dataType === 'json' || column.dataType === 'jsonb') {
    return normalizeJsonValue(value, tableName, column.name);
  }

  return value;
}

async function copyTable(sourceClient, targetClient, tableName) {
  const columns = await getTableColumns(sourceClient, tableName);
  if (!columns.length) {
    return 0;
  }

  const columnSql = columns.map((column) => quoteIdentifier(column.name)).join(', ');
  const { rows } = await sourceClient.query(`SELECT ${columnSql} FROM ${quoteIdentifier(tableName)}`);

  if (!rows.length) {
    return 0;
  }

  const batchSize = 200;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const values = [];
    const placeholders = batch.map((row, rowIndex) => {
      const rowPlaceholders = columns.map((column, columnIndex) => {
        values.push(normalizeValueForTargetColumn(row[column.name], column, tableName));
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });
      return `(${rowPlaceholders.join(', ')})`;
    });

    try {
      await targetClient.query(
        `INSERT INTO ${quoteIdentifier(tableName)} (${columnSql}) VALUES ${placeholders.join(', ')}`,
        values
      );
    } catch (error) {
      throw new Error(`Failed while copying table "${tableName}": ${error.message}`);
    }
  }

  return rows.length;
}

async function resetSequences(targetClient) {
  const { rows } = await targetClient.query(`
    SELECT
      table_name,
      column_name,
      pg_get_serial_sequence(format('%I.%I', table_schema, table_name), column_name) AS sequence_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_default LIKE 'nextval(%'
  `);

  for (const row of rows) {
    if (!row.sequence_name || EXCLUDED_TABLES.has(row.table_name)) {
      continue;
    }

    const tableNameSql = quoteIdentifier(row.table_name);
    const columnNameSql = quoteIdentifier(row.column_name);
    const { rows: maxRows } = await targetClient.query(
      `SELECT MAX(${columnNameSql}) AS max_value FROM ${tableNameSql}`
    );

    const maxValue = maxRows[0]?.max_value;
    if (maxValue === null || maxValue === undefined) {
      await targetClient.query('SELECT setval($1, 1, false)', [row.sequence_name]);
      continue;
    }

    await targetClient.query('SELECT setval($1, $2, true)', [row.sequence_name, Number(maxValue)]);
  }
}

async function verifyDifferentDatabases(sourceClient, targetClient) {
  const [{ rows: sourceRows }, { rows: targetRows }] = await Promise.all([
    sourceClient.query('SELECT current_database() AS name'),
    targetClient.query('SELECT current_database() AS name'),
  ]);

  const sourceName = sourceRows[0]?.name;
  const targetName = targetRows[0]?.name;

  if (sourceName && targetName && sourceName === targetName && !process.env.SOURCE_DATABASE_URL) {
    console.warn(
      `Warning: source and target databases are both "${sourceName}". Confirm DATABASE_URL points to Neon before continuing.`
    );
  }
}

async function main() {
  const sourcePool = createSourcePool();
  const targetPool = createTargetPool();

  try {
    const sourceClient = await sourcePool.connect();
    const targetClient = await targetPool.connect();

    try {
      await verifyDifferentDatabases(sourceClient, targetClient);

      const sourceTables = await getPublicTables(sourceClient);
      const targetTables = await getPublicTables(targetClient);
      const sharedTables = sourceTables.filter((tableName) => targetTables.includes(tableName));
      const dependencies = await getDependencies(targetClient);
      const orderedTables = sortTablesByDependencies(sharedTables, dependencies);

      await targetClient.query('BEGIN');
      await truncateTargetTables(targetClient, orderedTables);

      const copiedCounts = [];
      for (const tableName of orderedTables) {
        console.log(`Copying ${tableName}...`);
        const count = await copyTable(sourceClient, targetClient, tableName);
        copiedCounts.push({ tableName, count });
      }

      await resetSequences(targetClient);
      await targetClient.query('COMMIT');

      console.log('Local Postgres data copied into Neon successfully.');
      copiedCounts.forEach(({ tableName, count }) => {
        console.log(`${tableName}: ${count} row(s)`);
      });
    } catch (error) {
      try {
        await targetClient.query('ROLLBACK');
      } catch {
        // Ignore rollback failures after the primary error.
      }
      throw error;
    } finally {
      sourceClient.release();
      targetClient.release();
    }
  } finally {
    await Promise.allSettled([sourcePool.end(), targetPool.end()]);
  }
}

main().catch((error) => {
  console.error(error.message || 'Failed to migrate local Postgres data into Neon.');
  process.exit(1);
});
