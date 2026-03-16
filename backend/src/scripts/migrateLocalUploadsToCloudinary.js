require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/db');
const { uploadsRoot } = require('../config/storage');
const {
  buildCloudinaryFolder,
  uploadImageBuffer,
} = require('../services/cloudinaryService');
const { validateCloudinaryEnv } = require('../config/env');

const DRY_RUN = process.argv.includes('--dry-run');

const quoteIdent = (value) => `"${String(value).replace(/"/g, '""')}"`;

const findPrimaryKeyColumns = async (tableName) => {
  const { rows } = await pool.query(
    `
      SELECT a.attname AS column_name
      FROM pg_index i
      JOIN pg_attribute a
        ON a.attrelid = i.indrelid
       AND a.attnum = ANY(i.indkey)
      JOIN pg_class c
        ON c.oid = i.indrelid
      JOIN pg_namespace n
        ON n.oid = c.relnamespace
      WHERE i.indisprimary = true
        AND n.nspname = 'public'
        AND c.relname = $1
      ORDER BY array_position(i.indkey, a.attnum)
    `,
    [tableName]
  );

  return rows.map((row) => row.column_name);
};

const getCandidateColumns = async () => {
  const { rows } = await pool.query(
    `
      SELECT table_name, column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          column_name ILIKE '%image%'
          OR column_name ILIKE '%photo%'
          OR column_name ILIKE '%poster%'
          OR column_name ILIKE '%thumbnail%'
        )
        AND udt_name IN ('varchar', 'text', 'json', 'jsonb')
      ORDER BY table_name, column_name
    `
  );

  return rows;
};

const extractUploadPath = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const match = parsed.pathname.match(/\/uploads\/.+$/i);
      if (!match) {
        return null;
      }
      return match[0].replace(/^\/+/, '');
    } catch {
      return null;
    }
  }

  if (/^\/?uploads\/.+$/i.test(trimmed)) {
    return trimmed.replace(/^\/+/, '');
  }

  return null;
};

const getLocalDiskPath = (uploadPath) => {
  const relativePath = String(uploadPath).replace(/^uploads\/?/i, '');
  return path.join(uploadsRoot, relativePath);
};

const getCloudinarySectionDir = (uploadPath) => {
  const normalized = String(uploadPath).replace(/\\/g, '/').replace(/^\/+/, '');
  const [, sectionDir = 'misc'] = normalized.split('/');
  return sectionDir || 'misc';
};

const uploadCache = new Map();
const missingFiles = [];

const migrateSingleUploadPath = async (rawValue) => {
  const uploadPath = extractUploadPath(rawValue);
  if (!uploadPath) {
    return rawValue;
  }

  if (uploadCache.has(uploadPath)) {
    return uploadCache.get(uploadPath);
  }

  const diskPath = getLocalDiskPath(uploadPath);
  const filename = path.basename(diskPath);
  const publicId = filename.replace(path.extname(filename), '');

  let fileBuffer;
  try {
    fileBuffer = await fs.readFile(diskPath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      missingFiles.push(uploadPath);
      console.warn(`Missing local upload file: ${uploadPath}`);
      uploadCache.set(uploadPath, rawValue);
      return rawValue;
    }
    throw error;
  }

  if (DRY_RUN) {
    const mockUrl = `cloudinary://${buildCloudinaryFolder(getCloudinarySectionDir(uploadPath))}/${publicId}`;
    uploadCache.set(uploadPath, mockUrl);
    return mockUrl;
  }

  const uploadedUrl = await uploadImageBuffer({
    buffer: fileBuffer,
    folder: buildCloudinaryFolder(getCloudinarySectionDir(uploadPath)),
    publicId,
    filename,
  });

  uploadCache.set(uploadPath, uploadedUrl);
  return uploadedUrl;
};

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === '[object Object]';

const replaceUploadPathsDeep = async (value) => {
  if (typeof value === 'string') {
    const nextValue = await migrateSingleUploadPath(value);
    return {
      changed: nextValue !== value,
      value: nextValue,
    };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const nextArray = [];
    for (const item of value) {
      const result = await replaceUploadPathsDeep(item);
      changed = changed || result.changed;
      nextArray.push(result.value);
    }
    return { changed, value: nextArray };
  }

  if (isPlainObject(value)) {
    let changed = false;
    const nextObject = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      const result = await replaceUploadPathsDeep(nestedValue);
      changed = changed || result.changed;
      nextObject[key] = result.value;
    }
    return { changed, value: nextObject };
  }

  return {
    changed: false,
    value,
  };
};

const buildRowIdentifier = (row, primaryKeyColumns) => {
  const parts = primaryKeyColumns.map((column) => `${column}=${row[column]}`);
  return parts.join(', ');
};

const updateScalarColumn = async ({
  tableName,
  columnName,
  primaryKeyColumns,
}) => {
  const quotedTable = quoteIdent(tableName);
  const quotedColumn = quoteIdent(columnName);
  const pkSelect = primaryKeyColumns.map((column) => quoteIdent(column)).join(', ');

  const { rows } = await pool.query(
    `
      SELECT ${pkSelect}, ${quotedColumn} AS column_value
      FROM ${quotedTable}
      WHERE ${quotedColumn} IS NOT NULL
        AND (
          ${quotedColumn} LIKE 'uploads/%'
          OR ${quotedColumn} LIKE '/uploads/%'
          OR ${quotedColumn} LIKE 'http://%/uploads/%'
          OR ${quotedColumn} LIKE 'https://%/uploads/%'
        )
    `
  );

  let updated = 0;
  for (const row of rows) {
    const nextValue = await migrateSingleUploadPath(row.column_value);
    if (nextValue === row.column_value) {
      continue;
    }

    const whereClause = primaryKeyColumns
      .map((column, index) => `${quoteIdent(column)} = $${index + 2}`)
      .join(' AND ');
    const values = [nextValue, ...primaryKeyColumns.map((column) => row[column])];

    if (!DRY_RUN) {
      await pool.query(
        `UPDATE ${quotedTable} SET ${quotedColumn} = $1 WHERE ${whereClause}`,
        values
      );
    }

    updated += 1;
    console.log(
      `${DRY_RUN ? '[dry-run] would update' : 'updated'} ${tableName}.${columnName} for ${buildRowIdentifier(
        row,
        primaryKeyColumns
      )}`
    );
  }

  return updated;
};

const updateJsonColumn = async ({
  tableName,
  columnName,
  primaryKeyColumns,
  udtName,
}) => {
  const quotedTable = quoteIdent(tableName);
  const quotedColumn = quoteIdent(columnName);
  const pkSelect = primaryKeyColumns.map((column) => quoteIdent(column)).join(', ');

  const { rows } = await pool.query(
    `
      SELECT ${pkSelect}, ${quotedColumn} AS column_value
      FROM ${quotedTable}
      WHERE ${quotedColumn} IS NOT NULL
        AND CAST(${quotedColumn} AS text) LIKE '%uploads/%'
    `
  );

  let updated = 0;
  const castType = udtName === 'jsonb' ? 'jsonb' : 'json';

  for (const row of rows) {
    const result = await replaceUploadPathsDeep(row.column_value);
    if (!result.changed) {
      continue;
    }

    const whereClause = primaryKeyColumns
      .map((column, index) => `${quoteIdent(column)} = $${index + 2}`)
      .join(' AND ');
    const values = [JSON.stringify(result.value), ...primaryKeyColumns.map((column) => row[column])];

    if (!DRY_RUN) {
      await pool.query(
        `UPDATE ${quotedTable} SET ${quotedColumn} = $1::${castType} WHERE ${whereClause}`,
        values
      );
    }

    updated += 1;
    console.log(
      `${DRY_RUN ? '[dry-run] would update' : 'updated'} ${tableName}.${columnName} for ${buildRowIdentifier(
        row,
        primaryKeyColumns
      )}`
    );
  }

  return updated;
};

const main = async () => {
  validateCloudinaryEnv();

  const columns = await getCandidateColumns();
  let totalUpdated = 0;
  let processedColumns = 0;
  const uniqueMissingFiles = new Set();

  for (const column of columns) {
    const primaryKeyColumns = await findPrimaryKeyColumns(column.table_name);
    if (!primaryKeyColumns.length) {
      console.warn(
        `Skipping ${column.table_name}.${column.column_name}: no primary key found.`
      );
      continue;
    }

    processedColumns += 1;
    console.log(`Scanning ${column.table_name}.${column.column_name}...`);

    if (column.udt_name === 'json' || column.udt_name === 'jsonb') {
      totalUpdated += await updateJsonColumn({
        tableName: column.table_name,
        columnName: column.column_name,
        primaryKeyColumns,
        udtName: column.udt_name,
      });
      continue;
    }

    totalUpdated += await updateScalarColumn({
      tableName: column.table_name,
      columnName: column.column_name,
      primaryKeyColumns,
    });
  }

  console.log('');
  console.log(`Processed ${processedColumns} candidate columns.`);
  console.log(
    `${DRY_RUN ? 'Would update' : 'Updated'} ${totalUpdated} database value(s).`
  );
  for (const uploadPath of missingFiles) {
    uniqueMissingFiles.add(uploadPath);
  }
  console.log(`Uploaded ${uploadCache.size - uniqueMissingFiles.size} unique local file(s).`);

  if (uniqueMissingFiles.size) {
    console.log('');
    console.log('Missing local files that still need manual attention:');
    for (const uploadPath of uniqueMissingFiles) {
      console.log(`- ${uploadPath}`);
    }
  }
};

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
