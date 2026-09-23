/**
 * Creates the PostgreSQL database from DATABASE_URL if it does not exist.
 * Connects to the default "postgres" maintenance DB first.
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is missing in apps/backend/.env');
    process.exit(1);
  }

  const url = new URL(databaseUrl);
  const dbName = url.pathname.replace(/^\//, '').split('?')[0];
  if (!dbName) {
    console.error('Could not parse database name from DATABASE_URL');
    process.exit(1);
  }

  // Connect to maintenance DB to create the target database
  url.pathname = '/postgres';
  const adminUrl = url.toString();

  const client = new Client({ connectionString: adminUrl });
  try {
    await client.connect();
    const exists = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );

    if (exists.rowCount > 0) {
      console.log(`Database "${dbName}" already exists`);
    } else {
      // CREATE DATABASE cannot run inside a prepared statement / parameterized query
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
      console.log(`Database "${dbName}" created`);
    }
  } catch (err) {
    console.error('Failed to create database:', err.message);
    console.error(
      'Check apps/backend/.env — set postgres user password in DATABASE_URL',
    );
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
