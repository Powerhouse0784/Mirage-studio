import EmbeddedPostgres from 'embedded-postgres';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';

/** Starts a throwaway PostgreSQL and applies the migration SQL. Used by tests and the e2e smoke script. */
export async function startTestDb(port = 54329) {
  const dir = mkdtempSync(join(tmpdir(), 'mirage-pg-'));
  const server = new EmbeddedPostgres({ databaseDir: dir, user: 'mirage', password: 'mirage', port, persistent: false, initdbFlags: ['--no-locale', '--encoding=UTF8', '--lc-messages=C'], onLog: m => process.env.PG_DEBUG && console.log(m), onError: m => process.env.PG_DEBUG && console.error(m) });
  await server.initialise(); await server.start(); await server.createDatabase('mirage');
  const url = `postgresql://mirage:mirage@localhost:${port}/mirage`;
  const c = new pg.Client({ connectionString: url }); await c.connect();
  await c.query(readFileSync('prisma/migrations/20261025000000_init/migration.sql', 'utf8'));
  await c.end();
  return { url, stop: () => server.stop() };
}
