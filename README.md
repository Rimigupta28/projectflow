# ProjectFlow

ProjectFlow is a collaborative project-management app built with React + Vite (JavaScript), a separate Node.js/Express API, and MongoDB. It includes server-enforced roles, task comments, project membership, a demo seed, and optimistic task-version conflict handling.

> **Database:** MongoDB Atlas is the selected and approved database for this project. The frontend and API run locally; Docker is not required. Store your private Atlas URI only in `server\.env`.

## Prerequisites

- Node.js 22 and npm
- A running MongoDB Atlas cluster and a database user

## Setup

1. Open a terminal in this project folder.
2. Install packages:

   ```bash
   npm install
   ```

3. Create the server environment file:

   ```bash
   cp server/.env.example server/.env
   ```

   On Windows PowerShell, use `if (!(Test-Path 'server\.env')) { Copy-Item 'server\.env.example' 'server\.env' }` to preserve existing settings.

4. Set a long random `JWT_SECRET` in `server/.env`. Keep the `.env` file private; `.gitignore` excludes it.
5. In Atlas, select **Connect > Drivers > Node.js**. Replace `MONGO_URI` in `server\.env` with that SRV connection string, replacing all placeholders and setting the database name to `projectflow`. URL-encode special characters in the password (for example, `@` becomes `%40`). Under **Network Access**, allow your current IP. Use a database user with read/write access to `projectflow`, not your Atlas website login. Do not add the local `replicaSet=rs0` option.

   The API and seed reject an unfinished template or local connection string with setup guidance. Never commit or share your actual URI.

6. Seed demo accounts and sample data:

   ```bash
   npm run seed
   ```

7. Start both applications:

   ```bash
   npm run dev
   ```

   Vite is at `http://localhost:5173`; the API is at `http://localhost:4000`. To run separately, use `npm run dev:server` and `npm run dev:client` in separate terminals.

## Demo accounts

All seeded accounts use `Password@123`:

| Email | Global role |
|---|---|
| `admin@demo.com` | ADMIN |
| `pm@demo.com` | PROJECT_MANAGER |
| `member@demo.com` | TEAM_MEMBER |
| `viewer@demo.com` | VIEWER |

These are development-only credentials. Do not deploy them or reuse the password.

## Tests and production build

```bash
npm test
npm run build
```

The API integration tests start an isolated MongoDB memory replica set. No running local database is required for tests; the first run may download the MongoDB test binary.

## Useful scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite and the API together |
| `npm run dev:client` | Start only the frontend |
| `npm run dev:server` | Start only the API |
| `npm run seed` | Idempotently seed demo data |
| `npm test` | Run API integration tests |
| `npm run build` | Validate server syntax and produce frontend production build |

## API overview

The API base is `/api`. Auth uses an HTTP-only cookie. The client is not an authorization boundary: project membership, role checks, archived state, assignee validity, and task versions are all verified by the server.

- `GET /health` — server readiness
- `/api/auth` — login, logout, current profile
- `/api/users` — ADMIN user management
- `/api/projects` — project and membership workflows
- `/api/projects/:id/tasks` and `/api/tasks/:id` — task CRUD, filters, version conflicts
- `/api/tasks/:id/comments` and `/api/comments/:id` — comments
- `/api/dashboard` — scoped task counts and work lists

Task update APIs require the current task `version`. A stale edit returns HTTP 409 with `current`; the UI presents a comparison and lets the user load the latest version or reapply allowed changes.

## Folder structure

```text
client/src/       React pages, components, API client, contexts, hooks
server/src/
  config/         environment and MongoDB connection
  middleware/     authentication and error handling
  models/         Mongoose schemas and indexes
  routes/         Express endpoints and request validation
  services/       project access decisions
  seed/           idempotent demo seed
  tests/          Supertest integration tests
```

See [PRD.md](PRD.md), [TRD.md](TRD.md), [UI-UX.md](UI-UX.md), [MONGODB-SCHEMA.md](MONGODB-SCHEMA.md), and [ARCHITECTURE.md](ARCHITECTURE.md) for the full requirements and design rationale.
