import { sql } from '@vercel/postgres';

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!process.env.POSTGRES_URL && connectionString) {
  process.env.POSTGRES_URL = connectionString;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!connectionString) {
    return res.status(500).json({
      error: 'Keine Datenbank-Verbindung. POSTGRES_URL oder DATABASE_URL fehlt.',
    });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (err) {
        return res.status(400).json({ error: 'Request-Body ist kein gültiges JSON' });
      }
    }
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Ungültiger Request-Body' });
    }

    const { name, data } = payload;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Projektname fehlt' });
    }
    const trimmedName = name.trim();

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

    await sql`
      INSERT INTO shotlist_projects (name, data)
      VALUES (${trimmedName}, ${JSON.stringify(data ?? {})}::jsonb)
      ON CONFLICT (name) DO UPDATE
      SET data = EXCLUDED.data,
          updated_at = NOW();
    `;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Fehler beim Speichern des Projekts:', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : String(err) });
  }
}
