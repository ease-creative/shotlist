import { sql } from '@vercel/postgres';

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.NEON_POSTGRES_URL;

if (!process.env.POSTGRES_URL && connectionString) {
  process.env.POSTGRES_URL = connectionString;
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS shotlist_projects (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    ALTER TABLE shotlist_projects
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  `;

  await sql`
    ALTER TABLE shotlist_projects
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!connectionString) {
    return res.status(500).json({
      error: 'Keine Datenbank-Verbindung. POSTGRES_URL oder DATABASE_URL fehlt.',
    });
  }

  try {
    await ensureTable();

    const { name } = req.query ?? {};

    if (name) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ error: 'Projektname fehlt' });
      }

      const result = await sql`
        SELECT name, data, updated_at
        FROM shotlist_projects
        WHERE name = ${trimmedName}
        LIMIT 1;
      `;

      if (!result || result.rowCount === 0) {
        return res.status(404).json({ error: 'Projekt nicht gefunden.' });
      }

      const row = result.rows[0];
      return res.status(200).json({
        ok: true,
        project: {
          name: row.name,
          updatedAt: row.updated_at,
          data: row.data,
        },
      });
    }

    const result = await sql`
      SELECT name, data, updated_at
      FROM shotlist_projects
      ORDER BY updated_at DESC NULLS LAST, name ASC;
    `;

    const projects = Array.isArray(result?.rows)
      ? result.rows.map((row) => ({
          name: row.name,
          updatedAt: row.updated_at,
          data: row.data,
        }))
      : [];

    return res.status(200).json({ ok: true, projects });
  } catch (err) {
    console.error('Fehler beim Laden der Projekte:', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : String(err) });
  }
}
