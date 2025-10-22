export function getPool() {
  if (globalThis.__shotlistPgPool) {
    return globalThis.__shotlistPgPool;
  }

  const { Pool } = eval('require')('pg');

  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NEON_POSTGRES_URL;

  if (!connectionString) {
    throw new Error(
      'Keine Datenbank-Verbindung. POSTGRES_URL oder kompatible Variable fehlt.'
    );
  }

  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
  });

  globalThis.__shotlistPgPool = pool;
  return pool;
}
