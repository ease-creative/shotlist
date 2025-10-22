const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS shotlist_projects (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

const ADD_CREATED_AT_SQL = `
ALTER TABLE shotlist_projects
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
`;

const ADD_UPDATED_AT_SQL = `
ALTER TABLE shotlist_projects
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
`;

let ensured = false;

export async function ensureProjectTable(pool) {
  if (ensured) return;
  await pool.query(CREATE_TABLE_SQL);
  await pool.query(ADD_CREATED_AT_SQL);
  await pool.query(ADD_UPDATED_AT_SQL);
  ensured = true;
}
