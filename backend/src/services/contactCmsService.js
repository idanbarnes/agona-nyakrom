const { pool } = require('../config/db');

const DEFAULT_CONTACT_INFO = {
  section_title: 'Get in Touch',
  section_subtitle: 'Have questions or feedback? Reach out to us.',
  emails: [],
  phones: [],
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  },
  office_hours: {
    days: 'Monday - Friday',
    hours: '9:00 AM - 6:00 PM',
    timezone: 'GMT',
  },
};

const toSafeString = (value, maxLength = 500) => {
  if (value === undefined || value === null) return '';
  return String(value).trim().slice(0, maxLength);
};

const toBoolean = (value) => {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }
  return undefined;
};

const toDisplayOrder = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const normalizeEmails = (input) => {
  if (!Array.isArray(input)) return [];

  const mapped = input
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null;

      const email = toSafeString(entry.email, 320).toLowerCase();
      const label = toSafeString(entry.label, 120);
      if (!email) return null;

      return {
        email,
        label,
        display_order: toDisplayOrder(entry.display_order, index + 1),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.display_order - right.display_order)
    .map((entry, index) => ({
      ...entry,
      display_order: index + 1,
    }));

  return mapped;
};

const normalizePhones = (input) => {
  if (!Array.isArray(input)) return [];

  const mapped = input
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null;

      const number = toSafeString(entry.number, 50);
      const availability = toSafeString(entry.availability, 200);
      if (!number) return null;

      return {
        number,
        availability,
        display_order: toDisplayOrder(entry.display_order, index + 1),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.display_order - right.display_order)
    .map((entry, index) => ({
      ...entry,
      display_order: index + 1,
    }));

  return mapped;
};

const normalizeAddress = (input = {}) => {
  const address = input && typeof input === 'object' ? input : {};

  return {
    street: toSafeString(address.street, 200),
    city: toSafeString(address.city, 120),
    state: toSafeString(address.state, 120),
    zip: toSafeString(address.zip, 40),
    country: toSafeString(address.country, 120),
  };
};

const normalizeOfficeHours = (input = {}) => {
  const hours = input && typeof input === 'object' ? input : {};

  return {
    days: toSafeString(hours.days, 120),
    hours: toSafeString(hours.hours, 120),
    timezone: toSafeString(hours.timezone, 80),
  };
};

const normalizeContactPayload = (input = {}) => {
  const payload = input && typeof input === 'object' ? input : {};

  return {
    section_title:
      toSafeString(payload.section_title, 160) || DEFAULT_CONTACT_INFO.section_title,
    section_subtitle:
      toSafeString(payload.section_subtitle, 600) ||
      DEFAULT_CONTACT_INFO.section_subtitle,
    emails: normalizeEmails(payload.emails),
    phones: normalizePhones(payload.phones),
    address: normalizeAddress(payload.address),
    office_hours: normalizeOfficeHours(payload.office_hours),
  };
};

const contactInfoSelect = `
  id,
  section_title,
  section_subtitle,
  emails,
  phones,
  address,
  office_hours,
  updated_by,
  created_at,
  updated_at
`;

const mapContactInfo = (row) => {
  if (!row) {
    return {
      id: null,
      ...DEFAULT_CONTACT_INFO,
      updated_by: null,
      created_at: null,
      updated_at: null,
    };
  }

  return {
    id: row.id,
    section_title: row.section_title || DEFAULT_CONTACT_INFO.section_title,
    section_subtitle:
      row.section_subtitle || DEFAULT_CONTACT_INFO.section_subtitle,
    emails: normalizeEmails(row.emails),
    phones: normalizePhones(row.phones),
    address: normalizeAddress(row.address),
    office_hours: normalizeOfficeHours(row.office_hours),
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const getContactInfo = async () => {
  const { rows } = await pool.query(
    `SELECT ${contactInfoSelect}
     FROM contact_info
     WHERE singleton = true
     LIMIT 1`
  );

  return mapContactInfo(rows[0]);
};

const upsertContactInfo = async (input, adminId = null) => {
  const payload = normalizeContactPayload(input);

  const { rows } = await pool.query(
    `INSERT INTO contact_info
      (singleton, section_title, section_subtitle, emails, phones, address, office_hours, updated_by, created_at, updated_at)
     VALUES
      (true, $1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7, NOW(), NOW())
     ON CONFLICT (singleton)
     DO UPDATE SET
      section_title = EXCLUDED.section_title,
      section_subtitle = EXCLUDED.section_subtitle,
      emails = EXCLUDED.emails,
      phones = EXCLUDED.phones,
      address = EXCLUDED.address,
      office_hours = EXCLUDED.office_hours,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
     RETURNING ${contactInfoSelect}`,
    [
      payload.section_title,
      payload.section_subtitle,
      JSON.stringify(payload.emails),
      JSON.stringify(payload.phones),
      JSON.stringify(payload.address),
      JSON.stringify(payload.office_hours),
      adminId,
    ]
  );

  return mapContactInfo(rows[0]);
};

const patchContactInfo = async (partialInput, adminId = null) => {
  const current = await getContactInfo();
  const merged = {
    section_title:
      partialInput.section_title !== undefined
        ? partialInput.section_title
        : current.section_title,
    section_subtitle:
      partialInput.section_subtitle !== undefined
        ? partialInput.section_subtitle
        : current.section_subtitle,
    emails: partialInput.emails !== undefined ? partialInput.emails : current.emails,
    phones: partialInput.phones !== undefined ? partialInput.phones : current.phones,
    address:
      partialInput.address !== undefined ? partialInput.address : current.address,
    office_hours:
      partialInput.office_hours !== undefined
        ? partialInput.office_hours
        : current.office_hours,
  };

  return upsertContactInfo(merged, adminId);
};

const faqSelect = `
  id,
  question,
  answer,
  display_order,
  is_active,
  created_by,
  updated_by,
  created_at,
  updated_at
`;

const mapFaq = (row) => {
  if (!row) return null;
  const isActive = Boolean(row.is_active);
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    display_order: row.display_order,
    sort_order: row.display_order,
    sortOrder: row.display_order,
    is_active: isActive,
    is_published: isActive,
    published: isActive,
    status: isActive ? 'published' : 'draft',
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const parseFaqActiveState = (payload = {}) => {
  if (payload.status !== undefined) {
    const status = String(payload.status).trim().toLowerCase();
    if (status === 'published') return true;
    if (status === 'draft') return false;
  }

  const publishedValue =
    payload.published !== undefined ? payload.published : payload.is_published;
  const published = toBoolean(publishedValue);
  if (published !== undefined) return published;

  return toBoolean(payload.is_active);
};

const normalizeFaqPayload = (input = {}) => {
  const payload = input && typeof input === 'object' ? input : {};
  const active = parseFaqActiveState(payload);

  return {
    question: toSafeString(payload.question, 240),
    answer: toSafeString(payload.answer, 20000),
    display_order:
      payload.display_order === undefined || payload.display_order === null
        ? null
        : Number(payload.display_order),
    is_active: active,
  };
};

const validateFaqPayload = (payload, { partial = false } = {}) => {
  if (!partial && !payload.question) {
    const err = new Error('question is required');
    err.status = 400;
    throw err;
  }

  if (!partial && !payload.answer) {
    const err = new Error('answer is required');
    err.status = 400;
    throw err;
  }

  if (partial && payload.question !== undefined && !payload.question) {
    const err = new Error('question is required');
    err.status = 400;
    throw err;
  }

  if (partial && payload.answer !== undefined && !payload.answer) {
    const err = new Error('answer is required');
    err.status = 400;
    throw err;
  }

  if (
    payload.display_order !== null &&
    payload.display_order !== undefined &&
    (!Number.isInteger(payload.display_order) || payload.display_order <= 0)
  ) {
    const err = new Error('display_order must be a positive integer');
    err.status = 400;
    throw err;
  }
};

const getNextFaqDisplayOrder = async () => {
  const { rows } = await pool.query(
    'SELECT COALESCE(MAX(display_order), 0) AS max_order FROM contact_faqs'
  );
  const maxOrder = Number(rows[0]?.max_order || 0);
  return maxOrder + 1;
};

const listFaqs = async ({
  activeOnly = false,
  status = 'all',
  search = '',
  page = 1,
  limit = 25,
  paginated = false,
} = {}) => {
  const conditions = [];
  const values = [];

  const normalizedStatus = String(status || 'all').trim().toLowerCase();
  if (activeOnly || normalizedStatus === 'published') {
    values.push(true);
    conditions.push(`is_active = $${values.length}`);
  } else if (normalizedStatus === 'draft') {
    values.push(false);
    conditions.push(`is_active = $${values.length}`);
  }

  const normalizedSearch = String(search || '').trim();
  if (normalizedSearch) {
    values.push(`%${normalizedSearch}%`);
    conditions.push(
      `(question ILIKE $${values.length} OR answer ILIKE $${values.length})`
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const normalizedPage =
    Number.isFinite(Number(page)) && Number(page) > 0 ? Math.floor(Number(page)) : 1;
  const normalizedLimitRaw =
    Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.floor(Number(limit)) : 25;
  const normalizedLimit = Math.min(100, normalizedLimitRaw);
  const offset = (normalizedPage - 1) * normalizedLimit;

  if (!paginated) {
    const { rows } = await pool.query(
      `SELECT ${faqSelect}
       FROM contact_faqs
       ${where}
       ORDER BY display_order ASC, created_at ASC`,
      values
    );
    return rows.map(mapFaq);
  }

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM contact_faqs
     ${where}`,
    values
  );
  const total = Number(countResult.rows[0]?.total || 0);

  const listValues = [...values, normalizedLimit, offset];
  const { rows } = await pool.query(
    `SELECT ${faqSelect}
     FROM contact_faqs
     ${where}
     ORDER BY display_order ASC, created_at ASC
     LIMIT $${listValues.length - 1}
     OFFSET $${listValues.length}`,
    listValues
  );

  return {
    items: rows.map(mapFaq),
    total,
    page: normalizedPage,
    limit: normalizedLimit,
  };
};

const getFaqById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${faqSelect}
     FROM contact_faqs
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return mapFaq(rows[0]);
};

const createFaq = async (input, adminId = null) => {
  const payload = normalizeFaqPayload(input);
  validateFaqPayload(payload, { partial: false });

  const displayOrder =
    payload.display_order === null
      ? await getNextFaqDisplayOrder()
      : payload.display_order;

  const { rows } = await pool.query(
    `INSERT INTO contact_faqs
      (question, answer, display_order, is_active, created_by, updated_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING ${faqSelect}`,
    [
      payload.question,
      payload.answer,
      displayOrder,
      payload.is_active === undefined ? true : payload.is_active,
      adminId,
      adminId,
    ]
  );

  return mapFaq(rows[0]);
};

const updateFaq = async (id, input, adminId = null) => {
  const payload = normalizeFaqPayload(input);
  validateFaqPayload(payload, { partial: true });

  const fields = [];
  const values = [];
  let index = 1;

  const setField = (column, value) => {
    fields.push(`${column} = $${index}`);
    values.push(value);
    index += 1;
  };

  if (input.question !== undefined) setField('question', payload.question);
  if (input.answer !== undefined) setField('answer', payload.answer);
  if (input.display_order !== undefined) {
    if (payload.display_order === null) {
      const err = new Error('display_order must be a positive integer');
      err.status = 400;
      throw err;
    }
    setField('display_order', payload.display_order);
  }
  if (input.is_active !== undefined) setField('is_active', payload.is_active);

  if (!fields.length) {
    const err = new Error('No fields provided to update');
    err.status = 400;
    throw err;
  }

  setField('updated_by', adminId);
  fields.push('updated_at = NOW()');

  values.push(id);

  const { rows } = await pool.query(
    `UPDATE contact_faqs
     SET ${fields.join(', ')}
     WHERE id = $${index}
     RETURNING ${faqSelect}`,
    values
  );

  return mapFaq(rows[0]);
};

const deleteFaq = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM contact_faqs WHERE id = $1', [id]);
  return rowCount > 0;
};

const toggleFaq = async (id, adminId = null) => {
  const { rows } = await pool.query(
    `UPDATE contact_faqs
     SET is_active = NOT is_active,
         updated_by = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING ${faqSelect}`,
    [adminId, id]
  );

  return mapFaq(rows[0]);
};

const reorderFaqs = async (items = [], adminId = null) => {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('items array is required for reordering');
    err.status = 400;
    throw err;
  }

  const normalized = items
    .map((item, index) => ({
      id: item?.id,
      display_order: toDisplayOrder(item?.display_order, index + 1),
    }))
    .filter((item) => item.id);

  if (!normalized.length) {
    const err = new Error('No valid FAQ ids provided for reordering');
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of normalized) {
      await client.query(
        `UPDATE contact_faqs
         SET display_order = $1,
             updated_by = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [item.display_order, adminId, item.id]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return listFaqs({ activeOnly: false });
};

const bulkFaqAction = async ({ ids = [], action, adminId = null }) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    const err = new Error('ids array is required');
    err.status = 400;
    throw err;
  }

  const filteredIds = ids.filter(Boolean);
  if (!filteredIds.length) {
    const err = new Error('No valid FAQ ids provided');
    err.status = 400;
    throw err;
  }

  if (!['activate', 'deactivate', 'delete'].includes(action)) {
    const err = new Error('Unsupported bulk action');
    err.status = 400;
    throw err;
  }

  if (action === 'delete') {
    const { rowCount } = await pool.query(
      'DELETE FROM contact_faqs WHERE id = ANY($1::uuid[])',
      [filteredIds]
    );

    return { affected: rowCount };
  }

  const nextStatus = action === 'activate';
  const { rowCount } = await pool.query(
    `UPDATE contact_faqs
     SET is_active = $1,
         updated_by = $2,
         updated_at = NOW()
     WHERE id = ANY($3::uuid[])`,
    [nextStatus, adminId, filteredIds]
  );

  return { affected: rowCount };
};

module.exports = {
  DEFAULT_CONTACT_INFO,
  getContactInfo,
  upsertContactInfo,
  patchContactInfo,
  listFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
  toggleFaq,
  reorderFaqs,
  bulkFaqAction,
};
