// Starts a disposable PostgreSQL (with the schema applied) and keeps it running. Handy for demos/e2e without Docker.
import { startTestDb } from './pg';
(async () => {
  const t = await startTestDb(Number(process.env.PORT ?? 54340));
  console.log('READY ' + t.url);
  process.on('SIGTERM', async () => { await t.stop(); process.exit(0); });
  setInterval(() => {}, 1 << 30);
})();
