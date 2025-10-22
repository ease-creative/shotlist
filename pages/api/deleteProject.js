import { getPool } from '../../lib/db';
import { ensureProjectTable } from '../../lib/project-table';

export default async function handler(req, res) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    res.setHeader('Allow', ['DELETE', 'POST']);
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

    const { name } = payload;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Projektname fehlt' });
    }
    const trimmedName = name.trim();

    const pool = getPool();
    await ensureProjectTable(pool);

    const result = await pool.query(
      `
      DELETE FROM shotlist_projects
      WHERE name = $1
      RETURNING id;
    `,
      [trimmedName]
    );

    if (!result || result.rowCount === 0) {
      return res.status(404).json({ error: 'Projekt nicht gefunden.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Fehler beim Löschen des Projekts:', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : String(err) });
  }
}
