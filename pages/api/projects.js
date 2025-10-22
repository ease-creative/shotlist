import { getPool } from '../../lib/db';
import { ensureProjectTable } from '../../lib/project-table';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const pool = getPool();
    await ensureProjectTable(pool);

    const { name } = req.query ?? {};

    if (name) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ error: 'Projektname fehlt' });
      }

      const result = await pool.query(
        `
        SELECT name, data, updated_at
        FROM shotlist_projects
        WHERE name = $1
        LIMIT 1;
      `,
        [trimmedName]
      );

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

    const result = await pool.query(`
      SELECT name, data, updated_at
      FROM shotlist_projects
      ORDER BY updated_at DESC NULLS LAST, name ASC;
    `);

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
