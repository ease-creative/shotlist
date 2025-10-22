import { getPool } from '../../lib/db';
import { ensureProjectTable } from '../../lib/project-table';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
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

    const { name, project, data } = payload;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Projektname fehlt' });
    }
    const trimmedName = name.trim();

    const projectData = project ?? data;
    if (!projectData || typeof projectData !== 'object') {
      return res.status(400).json({ error: 'Projektdaten fehlen' });
    }

    const pool = getPool();
    await ensureProjectTable(pool);

    const result = await pool.query(
      `
      INSERT INTO shotlist_projects (name, data)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (name) DO UPDATE
      SET data = EXCLUDED.data,
          updated_at = NOW()
      RETURNING name, data, updated_at;
    `,
      [trimmedName, JSON.stringify(projectData ?? {})]
    );

    const saved = result.rows?.[0] ?? null;

    return res.status(200).json({
      ok: true,
      project: saved
        ? {
            name: saved.name,
            updatedAt: saved.updated_at,
            data: saved.data,
          }
        : null,
    });
  } catch (err) {
    console.error('Fehler beim Speichern des Projekts:', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : String(err) });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};
