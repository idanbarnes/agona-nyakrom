const { pool } = require('../../config/db');

const baseSelect = `
  id,
  site_name,
  tagline,
  contact_email,
  contact_phone,
  address,
  social_links,
  navigation_links,
  footer_text,
  published,
  created_at,
  updated_at
`;

const normalizeJsonInput = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
};

const mapSettings = (row) => {
  if (!row) return null;
  const {
    id,
    site_name,
    tagline,
    contact_email,
    contact_phone,
    address,
    social_links,
    navigation_links,
    footer_text,
    published,
    created_at,
    updated_at,
  } = row;

  return {
    id,
    site_name,
    tagline,
    contact_email,
    contact_phone,
    address,
    social_links,
    navigation_links,
    footer_text,
    published,
    created_at,
    updated_at,
  };
};

const getCurrent = async () => {
  const { rows } = await pool.query(
    `SELECT ${baseSelect}
     FROM global_settings
     ORDER BY updated_at DESC NULLS LAST, created_at DESC
     LIMIT 1`
  );
  return mapSettings(rows[0]);
};

const create = async (data) => {
  const {
    site_name = null,
    tagline = null,
    contact_email = null,
    contact_phone = null,
    address = null,
    social_links = null,
    navigation_links = null,
    footer_text = null,
    published = false,
  } = data;

  const query = `
    INSERT INTO global_settings
      (site_name, tagline, contact_email, contact_phone, address, social_links, navigation_links, footer_text, published, created_at, updated_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING ${baseSelect}
  `;

  const values = [
    site_name,
    tagline,
    contact_email,
    contact_phone,
    address,
    normalizeJsonInput(social_links),
    normalizeJsonInput(navigation_links),
    footer_text,
    published,
  ];

  const { rows } = await pool.query(query, values);
  return mapSettings(rows[0]);
};

const update = async (data) => {
  const current = await getCurrent();

  // If no record exists yet, create one to avoid multiple active records later.
  if (!current) {
    return create(data);
  }

  const fields = [];
  const values = [];
  let idx = 1;

  const setField = (column, value) => {
    fields.push(`${column} = $${idx}`);
    values.push(value);
    idx += 1;
  };

  if (data.site_name !== undefined) setField('site_name', data.site_name);
  if (data.tagline !== undefined) setField('tagline', data.tagline);
  if (data.contact_email !== undefined) setField('contact_email', data.contact_email);
  if (data.contact_phone !== undefined) setField('contact_phone', data.contact_phone);
  if (data.address !== undefined) setField('address', data.address);
  if (data.social_links !== undefined) {
    setField('social_links', normalizeJsonInput(data.social_links));
  }
  if (data.navigation_links !== undefined) {
    setField('navigation_links', normalizeJsonInput(data.navigation_links));
  }
  if (data.footer_text !== undefined) setField('footer_text', data.footer_text);
  if (data.published !== undefined) setField('published', data.published);

  if (!fields.length) {
    throw new Error('No fields provided to update.');
  }

  setField('updated_at', new Date());

  values.push(current.id);

  const query = `
    UPDATE global_settings
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING ${baseSelect}
  `;

  const { rows } = await pool.query(query, values);
  return mapSettings(rows[0]);
};

module.exports = {
  getCurrent,
  update,
};
