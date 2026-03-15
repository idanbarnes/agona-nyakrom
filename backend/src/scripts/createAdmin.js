require('dotenv').config();
const { pool } = require('../config/db');
const adminUserService = require('../services/admin/adminUserService');

const parseArgs = (argv) => {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('--')) {
      continue;
    }

    const key = item.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      args[key] = 'true';
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  try {
    const created = await adminUserService.createAdmin({
      email: args.email || process.env.ADMIN_CREATE_EMAIL,
      password: args.password || process.env.ADMIN_CREATE_PASSWORD,
      name: args.name || process.env.ADMIN_CREATE_NAME,
      role: args.role || 'admin',
      active: args.active !== 'false',
    });

    console.log('Admin account created successfully:');
    console.log(JSON.stringify(created, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err.message || 'Failed to create admin account.');
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();
