import { sql } from "@vercel/postgres";

export async function POST(req) {
  try {
    const data = await req.json();

    // Tabelle erstellen, falls sie noch nicht existiert
    await sql`
      CREATE TABLE IF NOT EXISTS shotlist_projects (
        id SERIAL PRIMARY KEY,
        name TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Projekt speichern oder aktualisieren
    await sql`
      INSERT INTO shotlist_projects (name, data)
      VALUES (${data.name}, ${JSON.stringify(data)})
      ON CONFLICT (name) DO UPDATE
      SET data = EXCLUDED.data;
    `;

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
