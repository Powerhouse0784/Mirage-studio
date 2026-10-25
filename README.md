# MIRAGE — Cyber Deception Lab

A responsive Next.js + TypeScript starter for a safe cybersecurity deception simulation. This is a local, browser-based demo: it does not connect to or protect real infrastructure.

## Requirements
- Node.js 20.9+ (Node.js 22 LTS recommended)
- npm

## Milestone 3 — backend, auth and persistent data

Stack: Next.js 15 route handlers · PostgreSQL · Prisma 7 (`@prisma/adapter-pg`) · cookie sessions · HMAC-SHA256 audit chain.

### Setup (Windows PowerShell or any terminal)
1. Start PostgreSQL. Easiest: install Docker Desktop, then `docker compose up -d` (uses `docker-compose.yml`). Or use any PostgreSQL 14+ and edit `DATABASE_URL`.
2. Copy the env file and set a secret:
   ```powershell
   copy .env.example .env
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Paste the output as `AUDIT_HMAC_SECRET` in `.env`. Keep it stable: changing it makes existing audit chains fail verification.
3. Install, create tables, run:
   ```bash
   npm install
   npm run db:deploy
   npm run dev
   ```
4. Open http://localhost:3000, create an account, and run a simulation. Everything is saved to your private workspace.

`npm test` runs the unit tests; the database tests start their own throwaway PostgreSQL automatically (no Docker needed).

### What was added
- **Accounts**: register/login/logout. Passwords hashed with scrypt; sessions are random tokens in an HttpOnly, SameSite=Lax cookie (only a SHA-256 of the token is stored); login/registration rate-limited; same-origin check on all writes.
- **Individual workspaces**: each user gets one private workspace. Every query is filtered by the signed-in owner, and another user's investigation returns 404 for read, edit, delete, append and verify.
- **Saved investigations**: scenario, speed, decoy settings, counters and risk score autosave; create, open, rename and delete from the Investigations tab. Theme is saved per workspace. The old browser-localStorage state is no longer used.
- **Reliable audit verification**: every event is appended server-side to a hash chain (`HMAC-SHA256(secret, prevHash + investigation + seq + timestamp + title + detail + severity + node)`). Appends are row-locked so concurrent writes can't fork the chain. "Verify audit" re-checks the whole chain and reports the first broken event. It detects edited fields, deleted/reordered/inserted events, and removed trailing events (the investigation stores its chain head). Because it is keyed, someone with only database write access cannot forge a valid chain.

### API
`POST /api/auth/{register,login,logout}` · `GET /api/auth/me` · `GET|POST /api/investigations` · `GET|PATCH|DELETE /api/investigations/:id` · `POST /api/investigations/:id/events` · `GET /api/investigations/:id/verify` · `PATCH /api/workspace`

### Known limits
- The audit chain proves events were not altered after the server recorded them. The simulation itself runs in the browser, so it does not prove the events were truthful.
- Whoever holds `AUDIT_HMAC_SECRET` can forge chains; keep it out of the database and source control.
- The rate limiter is in-memory (per server process); use a shared store if you run several instances.
- Old localStorage data from Milestone 2 is not imported.
- `npm audit` reports advisories in the Next 15.5 line; review before public deployment.

## Next
Scenario authoring, learning missions, report history, end-to-end and accessibility tests, deployment config.

## Milestone 5 — verification, accessibility and deployment

### Automated checks
Run these before merging or deploying:

```bash
npm test       # unit + PostgreSQL integration tests
npm run lint   # ESLint
npx tsc --noEmit
npm run build  # production Next.js build
```

The integration suite starts a disposable local PostgreSQL instance; make sure the test process can bind localhost port `54330`. Tests cover password hashing, tenant isolation, investigation lifecycle, concurrent event appends, and audit-chain tampering. API guard tests cover same-origin checks and the in-process rate limiter. These checks do not replace browser-based end-to-end testing.

### Manual end-to-end smoke test
1. Register a new user and confirm the app opens an initial investigation.
2. Sign out, sign in again, and confirm the investigation persists.
3. Run each of the four scenarios with decoys enabled, then disable a decoy and repeat; verify the simulated outcome and event feed change as expected.
4. Change speed, rename/create/open/delete an investigation, and confirm changes persist after refresh.
5. Search events, export a report, and run **Verify audit**. Expect a successful verification for an untouched chain.
6. Open **Missions & progress**, toggle a checklist item, refresh, and confirm its browser-local progress remains.
7. Attempt invalid/oversized form values and cross-origin writes; requests should be rejected with a clear error response.
8. With keyboard only, navigate the main controls, toggle switches, open/close the guide, and verify focus indicators and status announcements. Check at 200% zoom and narrow mobile widths.
9. Simulate a database outage and a lost network connection; confirm the app shows a recoverable error and does not claim unsaved events were saved.

### Production deployment (Docker)
Requirements: a managed PostgreSQL database, Docker, a stable secret, and TLS at the hosting platform/reverse proxy. Do not use the sample database password or sample audit secret in production.

1. Set `DATABASE_URL` to the production PostgreSQL connection string and `AUDIT_HMAC_SECRET` to a randomly generated secret of at least 32 characters. Store both in your deployment secret manager.
2. Build the image: `docker build -t mirage-studio:latest .`
3. Before shifting traffic, run the schema migration as a release job from the project directory/environment: `npm ci && npx prisma generate && npm run db:deploy`. The release job must use the same `DATABASE_URL` and the exact code version being deployed.
4. Run the image with `DATABASE_URL` and `AUDIT_HMAC_SECRET` injected as runtime secrets, publish port `3000`, and configure the platform health check to `GET /api/health`. It returns `200` only when PostgreSQL is reachable and `503` otherwise.
5. Confirm `/api/health`, register/login, create an investigation, append an event, and verify the audit chain before routing real users to the release.
6. Enable automated database backups and test a restore. Keep `AUDIT_HMAC_SECRET` stable and backed up separately from the database; rotating it without a planned migration will make existing audit verification fail.

`next.config.ts` enables standalone output, disables the `X-Powered-By` header, and sets baseline browser security headers. Enforce HTTPS, configure a shared rate-limit store for multi-instance deployments, monitor logs/health checks, and review dependency advisories (`npm audit`) before public launch. The in-memory rate limiter is only a single-process safeguard. MIRAGE remains a simulation-only training lab; it does not monitor or protect real infrastructure.
