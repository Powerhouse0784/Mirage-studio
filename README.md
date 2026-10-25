# MIRAGE Studio

**A hands-on cybersecurity deception and incident-investigation lab.**

MIRAGE Studio is a browser-based learning environment for exploring how deception assets can help defenders identify simulated attacker activity. Configure a scenario, observe an animated network path, review generated evidence, and manage investigation records from a single workspace.

> **Safety notice:** MIRAGE Studio is a simulation and training tool. It does not monitor, detect, or protect real systems, and its scenarios do not execute real attacks. Use it for learning, demonstrations, and controlled evaluation only.

[Source code](https://github.com/Powerhouse0784/Mirage-studio) · Built with Next.js, React, TypeScript, PostgreSQL, and Prisma

---

## Contents

- [What you can do](#what-you-can-do)
- [Screens and routes](#screens-and-routes)
- [Technology stack](#technology-stack)
- [Requirements](#requirements)
- [Run locally](#run-locally)
- [Environment variables](#environment-variables)
- [Common commands](#common-commands)
- [Testing and quality checks](#testing-and-quality-checks)
- [Database and data model](#database-and-data-model)
- [Security design](#security-design)
- [Deploying to Vercel](#deploying-to-vercel)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## What you can do

### Explore simulated attack scenarios

- Choose from four scenarios: **Web exploit**, **Phished insider**, **Stolen credentials**, and **Ransomware probe**.
- Adjust simulation speed and enable or disable deception assets.
- Follow the simulated path through a network topology and inspect generated events.
- Review the risk score, simulation outcomes, and detection gaps.

### Manage investigations

- Create, open, rename, and delete saved investigations.
- Keep scenario configuration, simulation counters, and evidence associated with an investigation.
- Set a case status: **Open**, **In review**, or **Resolved**.
- Assign a priority: **Low**, **Medium**, **High**, or **Critical**.
- Save analyst notes and search the investigation list by relevant case information.
- Search the latest loaded evidence events and compare investigation outcomes.

### Review evidence and reports

- Inspect an investigation's evidence timeline and linked simulation history.
- Verify the investigation's tamper-evident event chain.
- Export supported event and simulation data as CSV.
- Print a case report or use the browser's **Save as PDF** option.

### Learn through repeated practice

- Complete guided learning missions and daily challenges.
- Track saved simulation runs and unlockable achievements.
- Review analytics such as detection outcomes, scenario comparisons, decoy outcomes, and recent simulation activity.

### Collaborate within a case record

- Add comments to an investigation and see the comment author and timestamp.
- Review a chronological activity feed for supported case changes.
- Keep investigation records private to the authenticated user's workspace under the current access model.

> **Workspace scope:** The current application creates a private workspace for each user. The schema includes membership-related foundations, but fully functional cross-account shared workspaces, invitations, role administration, and assignment workflows should not be considered available unless separately implemented and tested.

## Screens and routes

| Route | Purpose |
| --- | --- |
| `/` | Main lab, overview, scenario simulation, investigation command center, and learning tools |
| `/login` | Register an account or sign in |
| `/analytics` | Analytics for saved simulation runs |
| `/investigations/[id]` | Investigation details, evidence, notes, comments, activity, and report actions |
| `/investigations/compare` | Compare saved investigations in the current workspace |
| `/api/health` | Health check; returns a failure status when the database is unavailable |

The API also provides authenticated routes for sessions, investigations, workspace preferences, learning progress, simulation history, and analytics. See the route handlers under `app/api/` for the current request and response contracts.

## Technology stack

- **Application:** Next.js 15 App Router, React 19, TypeScript
- **Styling and icons:** CSS, Tailwind CSS tooling, Lucide React
- **Database:** PostgreSQL
- **Data access and migrations:** Prisma 7 with the PostgreSQL adapter
- **Authentication:** Server-managed sessions using secure random tokens, hashed session-token storage, and `HttpOnly` cookies
- **Validation:** Zod
- **Tests:** Vitest and PostgreSQL-backed integration tests
- **Deployment options:** Vercel or Docker-based hosting with a managed PostgreSQL database

## Requirements

- Node.js **20.9 or newer** (Node.js 22 LTS is recommended)
- npm
- PostgreSQL 14 or newer, either locally or through a managed provider such as Neon
- Git, if cloning the repository

For the Docker-based local database option, install Docker Desktop and make sure Docker is running.

## Run locally

### 1. Get the code

Clone the repository and enter the project directory:

```bash
git clone https://github.com/Powerhouse0784/Mirage-studio.git
cd Mirage-studio
```

Alternatively, download the repository ZIP from GitHub and extract it.

### 2. Configure PostgreSQL

Choose one of these options.

**Option A — Start a local PostgreSQL database with Docker Compose**

```bash
docker compose up -d
```

The included `docker-compose.yml` creates a local database on port `5432` with the development database name and credentials shown in that file. These defaults are for local development only; do not reuse them in production.

**Option B — Use an existing PostgreSQL database**

Create a database and have its connection string ready. For Neon or another hosted provider, use the provider's PostgreSQL connection string and follow its connection-pooling and SSL recommendations.

### 3. Create your local environment file

Create a file named `.env` in the project root. Do not commit it or share it in screenshots, issue reports, or chat messages.

Add these values and replace the placeholders with your own configuration:

```dotenv
DATABASE_URL="postgresql://mirage:mirage@localhost:5432/mirage?schema=public"
AUDIT_HMAC_SECRET="REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS_LONG"
```

Generate a suitable secret with Node.js:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into `AUDIT_HMAC_SECRET`. Keep this secret stable for the lifetime of the audit records. If it is changed without a planned key-rotation process, existing audit-chain verification will fail.

If you use a hosted database, replace `DATABASE_URL` with its connection string. Never paste database credentials into public repositories or share them in support messages.

### 4. Install dependencies and prepare the database

```bash
npm install
npx prisma generate
npm run db:deploy
```

`db:deploy` applies the migrations included in `prisma/migrations/` to the database configured by `DATABASE_URL`. It does not reset the database.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, sign in, and create or open an investigation.

### Windows PowerShell notes

The equivalent commands can be run with the `.cmd` suffix if your Windows shell requires it:

```powershell
npm.cmd install
npx.cmd prisma generate
npm.cmd run db:deploy
npm.cmd run dev
```

If dependencies are already installed, you usually do not need to repeat `npm install` every time you start the app.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma and the application. |
| `AUDIT_HMAC_SECRET` | Yes for audit operations | Random secret of at least 32 characters used to authenticate audit-chain hashes. Keep it private and stable. |

The application validates these values when the relevant services are used. Keep local secrets in `.env` and production secrets in your hosting provider's environment-variable or secret-management settings. Do not commit `.env` files.

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Start the production server after building |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking without emitting files |
| `npm test` | Run the Vitest test suite |
| `npx prisma generate` | Generate the Prisma Client |
| `npm run db:deploy` | Apply committed database migrations |
| `npm run db:migrate` | Create/apply a migration during development |
| `npm run db:studio` | Open Prisma Studio to inspect database records |

Before a release, run the checks that apply to your environment:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

The test suite includes unit and database-backed tests. Some integration tests start a disposable PostgreSQL process and may require permission to bind a local port. A successful build does not replace a manual browser test or a migration test against a staging database.

## Database and data model

Prisma schema and migration files are located in `prisma/`.

Core records include:

- **User and Session:** accounts and server-managed login sessions.
- **Workspace:** the user's private workspace and display preferences.
- **Investigation:** case title, status, priority, scenario configuration, analyst notes, and counters.
- **InvestigationEvent:** ordered evidence events in the audit chain.
- **SimulationRun:** saved outcomes from completed simulations.
- **InvestigationComment and InvestigationActivity:** case discussion and supported case-change history.
- **LearningMission, DailyChallenge, and AchievementUnlock:** learning progress and achievements.
- **WorkspaceMembership:** membership-related schema foundation; do not assume all team-management workflows are enabled in the UI or API.

Apply migrations using `npm run db:deploy` after setting `DATABASE_URL` and generating the Prisma Client. Back up important data before deploying schema changes to a production database.

## Security design

MIRAGE Studio includes several safeguards intended for a learning application:

- Passwords are hashed with a password-hashing function rather than stored as plain text.
- Session tokens are stored as hashes in the database and delivered through an `HttpOnly` cookie.
- Authenticated data access is scoped to the current user's workspace; unauthorized investigation lookups are treated as not found.
- Mutating API requests include same-origin checks and request validation.
- Authentication endpoints use an in-process rate limiter.
- Investigation events are linked by a keyed HMAC-SHA256 chain. The verifier checks sequence continuity, event contents, links, and the recorded chain head.
- Baseline browser security headers are configured in `next.config.ts`.

### Understanding audit verification

The audit chain is **tamper-evident**, not proof that the simulation event was factually true. It can reveal changes to recorded event fields, missing or reordered events, and removed trailing events, provided the verification secret remains protected. Anyone who obtains `AUDIT_HMAC_SECRET` may be able to create valid-looking hashes. Store it separately from the database and keep a secure backup.

These controls are not a substitute for a formal security review, centralized logging, managed rate limiting, or a production incident-response process.

## Deploying to Vercel

1. Push the project to a Git repository and import it into Vercel.
2. Provision a PostgreSQL database, such as Neon.
3. Add `DATABASE_URL` and `AUDIT_HMAC_SECRET` in the Vercel project's environment-variable settings for the intended deployment environments.
4. Before the application relies on new schema changes, run migrations against the intended database using the same code version and `DATABASE_URL`:

   ```bash
   npm ci
   npx prisma generate
   npm run db:deploy
   ```

   Run this as a controlled release step. Do not run destructive database commands against production as a troubleshooting shortcut.
5. Trigger a deployment and review the complete build log. A successful compilation alone does not guarantee that the production database has the correct schema.
6. After deployment, test `/api/health`, register and sign in, create an investigation, run a simulation, inspect its events, and verify the audit chain.
7. Enable database backups and test recovery. Keep production secrets private and stable.

The project also contains a `Dockerfile` and `docker-compose.yml` for container-based workflows. Production hosting should use a managed PostgreSQL service, HTTPS, secure runtime secrets, database backups, monitoring, and a shared rate-limit store if the application runs across multiple instances.

## Known limitations

- **Simulation only:** the app does not connect to real networks or provide production security monitoring.
- **Private workspace model:** cross-account shared workspaces, invitation flows, complete role administration, and team assignment workflows are not yet available as a complete feature set.
- **Rate limiting:** the current in-memory limiter is per process and is not sufficient on its own for horizontally scaled public deployments.
- **Analytics scope:** reports use saved simulation records; charts may be empty until simulations have been completed and saved. The analytics API applies a result limit.
- **PDF export:** case reports use the browser's print dialog; select **Save as PDF** rather than expecting a server-generated PDF file.
- **Legacy browser state:** older browser-local storage from earlier prototypes is not automatically imported into the database.
- **Production readiness:** run dependency auditing, end-to-end tests, accessibility checks, database restore tests, and a security review before relying on a public deployment.

## Troubleshooting

### `DATABASE_URL is not set`

Make sure a `.env` file exists in the project root and includes a valid `DATABASE_URL`. Restart the development server after changing environment variables.

### Prisma reports a missing table or column

Generate the client and apply the committed migrations:

```bash
npx prisma generate
npm run db:deploy
```

If the error persists, check `npx prisma migrate status` and confirm that the application and migration command are using the same database. Do not reset a database that contains data you need.

### The application cannot connect to PostgreSQL

Confirm the database is running, the hostname and port are correct, credentials are valid, and your provider permits the connection. For hosted databases, use the provider's recommended SSL and pooling configuration. Never include the full connection string in a public issue.

### `next build` fails on Vercel

Read the **first actual error** in the build log, not just the final exit status. Fix syntax, TypeScript, or ESLint errors locally, then run:

```bash
npm run lint
npm run typecheck
npm run build
```

### Audit verification fails

Check whether event records were changed or removed, and confirm that the same `AUDIT_HMAC_SECRET` used to create the records is configured. Do not casually rotate the secret on an existing dataset.

## Contributing

Contributions that improve clarity, accessibility, reliability, testing, or safe educational value are welcome.

1. Create a branch for your change.
2. Keep changes focused and explain the user-facing impact.
3. Add or update tests for changed behavior.
4. Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` where possible.
5. Never commit `.env`, database dumps, credentials, or real sensitive data.
6. Include migration files when changing the Prisma schema.

## License

No license file is currently included in the repository. Unless a license is added, the project should not be assumed to be available for unrestricted reuse or redistribution. Add a `LICENSE` file with the intended terms before publishing it as open source.
