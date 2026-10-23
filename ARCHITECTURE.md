# Architecture

## Runtime overview

```text
Browser (React + Vite, port 5173)
        │ Axios, credentialed HTTP
        ▼
Express API (Node.js, port 4000)
        │ Mongoose
        ▼
MongoDB Atlas (private MONGO_URI configured in server/.env)
```

The browser handles presentation and navigation only. Express validates every request, authenticates the cookie, reloads the user, resolves project membership, enforces role rules, and invokes Mongoose. The API is deliberately separated from Vite and does not let the browser connect to MongoDB.

## Why JavaScript

The application uses JavaScript and JSX rather than TypeScript, as requested for the final challenge. The file layout and function names are kept explicit to make the call path easy to follow: route → validation/auth middleware → access helper → Mongoose model. Environment setup examples and comments explain Atlas configuration and security choices.

## MongoDB model decisions

- `Project.members` embeds project membership and its project-level role because membership is read with the project, typically remains small, and defines access to that project. The service checks duplicate membership and protects the last project manager.
- `Task` and `Comment` are separate collections because they can grow independently, need their own indexes and pagination, and are queried/updated without rewriting the parent project document.
- `User` is referenced rather than copied into project/task/comment records so identity and active state have a single source of truth.
- Mongoose models define fields, enums, timestamps, and indexes. MongoDB does not use SQL migrations; indexes are synchronized from model definitions in development and the seed creates only demo data.

## Authorization flow

1. `requireAuth` reads the HTTP-only JWT cookie.
2. It verifies the token, reloads the user record on every request, and rejects missing/inactive accounts. This makes deactivation effective without waiting for a token to expire.
3. `requireGlobalRole` gates ADMIN-only user operations.
4. Project-scoped routes resolve their project directly or through a task/comment. A non-member receives 404; a member with the wrong project role receives 403. ADMIN bypasses membership checks.
5. Service helpers reject writes to archived projects and check business invariants such as active assignees belonging to the same project.

UI role checks hide or disable controls to improve the experience. They do not grant permission and are never relied on as the security boundary.

## Optimistic task locking

Every task mutation includes the version the client originally read. The API uses MongoDB's atomic `findOneAndUpdate` filter `{ _id, version }` with `$inc: { version: 1 }`. Only one concurrent request can update a given version. A stale request gets HTTP 409 and the latest task in `current`; its attempted changes are not written. The frontend compares attempted and latest values and supports **Use latest** and **Reapply my changes**.

## Deletion and transaction setup

Deleting a task removes comments; deleting a project removes its tasks and comments. These multi-collection changes run in a MongoDB transaction. The selected Atlas cluster supports transactions without local replica-set setup or Docker. Automated tests use an isolated test replica set, never the application's Atlas database.

## Database configuration

The user confirmed that Atlas is allowed for the final challenge. Runtime setup uses an Atlas SRV URI from the ignored `server/.env`; there is no localhost fallback. Startup rejects missing, local, or unfinished template URIs with actionable setup guidance. The developer must provide their own Atlas database user, URL-encoded password, cluster hostname, and IP allowlist entry.

## Explainable module map

- `server/src/config/env.js`: loads env variables, defines the single configurable database target.
- `server/src/config/db.js`: opens the Mongoose connection.
- `server/src/models`: schemas and indexes.
- `server/src/middleware/auth.js`: cookie/JWT authentication and global role guard.
- `server/src/middleware/errorHandler.js`: consistent JSON errors and Mongo error mapping.
- `server/src/services/access.js`: project membership, role, and archived-write checks.
- `server/src/routes/index.js`: API endpoints, Zod validation, business operations, and atomic task version update.
- `server/src/seed/seed.js`: demo data upsert.
- `server/src/tests/api.test.js`: integration tests for permissions and concurrency.
- `client/src/api/client.js`: one credentialed Axios client and API shapes.
- `client/src/context`: user session and toast state shared across routes.
- `client/src/pages`: app pages and task conflict UI.
