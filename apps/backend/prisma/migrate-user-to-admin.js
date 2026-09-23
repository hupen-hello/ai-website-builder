/**
 * Copies existing Admin-role rows from "User" into "Admin", then
 * Prisma db push will drop User. Run once before/with schema sync.
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
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const userExists = await client.query(`
      SELECT to_regclass('public."User"') AS name
    `);
    if (!userExists.rows[0]?.name) {
      console.log('No User table — nothing to migrate');
      return;
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Admin" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "name" TEXT,
        "passwordHash" TEXT NOT NULL,
        "phone" TEXT,
        "location" TEXT,
        "state" TEXT,
        "zip" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Detect optional columns on User
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'User'
    `);
    const colSet = new Set(cols.rows.map((r) => r.column_name));

    const hasRole = colSet.has('role');
    const where = hasRole ? `WHERE "role"::text = 'ADMIN'` : '';

    const phone = colSet.has('phone') ? `"phone"` : 'NULL';
    const location = colSet.has('location') ? `"location"` : 'NULL';
    const state = colSet.has('state') ? `"state"` : 'NULL';
    const zip = colSet.has('zip') ? `"zip"` : 'NULL';

    const result = await client.query(`
      INSERT INTO "Admin" ("id", "email", "name", "passwordHash", "phone", "location", "state", "zip", "createdAt", "updatedAt")
      SELECT "id", "email", "name", "passwordHash", ${phone}, ${location}, ${state}, ${zip}, "createdAt", "updatedAt"
      FROM "User"
      ${where}
      ON CONFLICT ("email") DO NOTHING
    `);

    console.log(`Migrated ${result.rowCount} admin row(s) from User → Admin`);

    // Drop FK from Site → User so User can be removed
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'Site_ownerId_fkey'
        ) THEN
          ALTER TABLE "Site" DROP CONSTRAINT "Site_ownerId_fkey";
        END IF;
      END $$;
    `);
    console.log('Dropped Site → User foreign key (if present)');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
