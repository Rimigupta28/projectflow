# Technical Requirements Document

## 1. Architecture

Use a simple JavaScript monorepo:

```text
hackathonchallenge/
  client/                 # React 18 + Vite SPA, port 5173
  server/                 # Express API, port 4000
  docker-compose.yml      # Optional compliant local MongoDB
  README.md
  ARCHITECTURE.md
  PRD.md
  TRD.md
  UI-UX.md
  MONGODB-SCHEMA.md
  BUILD-PROMPT.md
```

The client never connects to MongoDB. It calls `http://localhost:4000/api` using Axios with `withCredentials: true`. Express validates inputs, reloads the current user from MongoDB, authorizes every operation, calls service functions, and returns JSON. Mongoose is the source of schema and index definitions.

**Client:** React 18, Vite, JavaScript/JSX, Tailwind CSS, React Router v6, TanStack Query, Axios, React Hook Form, Zod, and lucide-react.  
**Server:** Node.js 22, Express, JavaScript, Mongoose, Zod, bcryptjs, jsonwebtoken, cookie-parser, cors, helmet, morgan, express-rate-limit, dotenv.  
**Tests:** Vitest or Jest, Supertest, and mongodb-memory-server; use a replica-set memory server for transaction tests.

## 2. Environment and runtime

- Server listens on port 4000; client on port 5173.
- Server environment: `PORT`, `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN`, `COOKIE_SECURE`, and optional rate-limit settings.
- Client environment: `VITE_API_URL` (defaults to `http://localhost:4000/api`).
- Keep `.env` files out of version control. Commit `.env.example` files with placeholders only.
- Require a strong non-placeholder JWT secret outside tests. Never log credentials, tokens, or password hashes.
- CORS allows the configured client origin and credentials; do not use `*` with credentials.
- Cookie: HTTP-only, sameSite `lax`, path `/`, and secure in production. Clear it on logout.
- MongoDB Atlas is the approved database selected by the user. Configure its SRV connection string exclusively through the private `MONGO_URI` environment variable; no local MongoDB or Docker setup is required.
- Use Helmet, JSON size limits, centralized error handling, structured status/code errors, and a login rate limit.

## 3. Backend module boundaries

```text
server/src/
  config/       env parsing, database connection
  models/       User, Project, Task, Comment
  middleware/   requireAuth, role checks, validation, errors
  routes/       route registration
  controllers/  HTTP request/response mapping only
  services/     authorization-aware business rules and persistence
  validators/   Zod request schemas
  utils/        async wrapper, typed errors, pagination
  seed/         idempotent development seed
  tests/        integration tests
```

Keep controllers thin. Put data integrity and permission decisions in services/middleware, not only in route declarations or UI code. Avoid an over-generalized repository framework.

## 4. Authentication and authorization

### Authentication

- `POST /api/auth/login`: validate email/password, compare bcrypt hash, reject inactive account, set signed JWT in HTTP-only cookie, return safe user data.
- `POST /api/auth/logout`: clear cookie and return 204.
- `GET /api/auth/me`: return the current safe user.
- `PATCH /api/auth/me`: allow only name and password changes; verify current password when changing password (or document an equally safe re-authentication rule).
- `requireAuth` verifies the JWT, then reloads the User record on every request. Missing, invalid, expired token, missing user, or inactive user returns 401.
- Never return `passwordHash`. Set it `select: false` and only select explicitly for login/password verification.

### Authorization middleware

- `requireGlobalRole(...roles)` checks the global role after authentication.
- Project authorization resolves a project directly from `projectId`, or through the task/comment document. Fail with 404 for a missing resource or a non-member project, then 403 for an insufficient role.
- Admin bypasses project membership and role checks.
- Check project archived state on every write; return 422 `PROJECT_ARCHIVED`.
- Recheck authorization and membership in service methods as needed for non-route entry points.

### Server-side permission matrix

| Resource/action | Required permission |
|---|---|
| User list/create/read/update/deactivate | Global ADMIN |
| Project list/read | ADMIN or project member |
| Project create/archive/delete/assign initial PM | Global ADMIN |
| Project metadata update | ADMIN or that project's PM |
| Member list | ADMIN or project member |
| Add/remove/change project role | ADMIN or project PM |
| Task read/list | ADMIN or project member |
| Task create/delete/assign/full update | ADMIN or project PM |
| Task partial update | ADMIN/PM full access; assigned TEAM_MEMBER may update only `status` and `description` |
| Comment list | ADMIN or project member |
| Comment create | ADMIN, project PM, or TEAM_MEMBER |
| Comment delete | ADMIN, project PM, or comment author |

Only allow explicit fields per operation; discarding unknown keys silently is not sufficient. Validate an exact whitelist. A member who sends `assignee`, `priority`, or `title` must be rejected with 403, not have those fields applied.

## 5. API contract

Base path: `/api`. JSON request/response bodies. IDs are Mongo ObjectId strings. Success lists use:

```json
{ "data": [], "meta": { "page": 1, "limit": 20, "total": 0 } }
```

Errors use:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Request is invalid", "details": [] } }
```

For task version conflicts, return HTTP 409:

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "Task was modified by someone else"
  },
  "current": { "_id": "...", "version": 8, "title": "...", "description": "...", "status": "IN_PROGRESS" }
}
```

### Routes

| Method/path | Purpose and access |
|---|---|
| `POST /auth/login` | Authenticate; rate limited |
| `POST /auth/logout` | End session |
| `GET /auth/me` | Current safe user |
| `PATCH /auth/me` | Update own name/password only |
| `GET /users` | ADMIN list, paginated |
| `POST /users` | ADMIN create |
| `GET /users/:id` | ADMIN read |
| `PATCH /users/:id` | ADMIN update name/email/global role |
| `POST /users/:id/deactivate` | ADMIN deactivate, never hard delete |
| `GET /projects` | ADMIN all; others only member projects |
| `POST /projects` | ADMIN create; accept initial PM assignment |
| `GET /projects/:id` | ADMIN or member |
| `PATCH /projects/:id` | ADMIN or project PM; metadata only |
| `DELETE /projects/:id` | ADMIN; delete project and related tasks/comments |
| `POST /projects/:id/archive` | ADMIN; set `ARCHIVED` |
| `GET /projects/:id/members` | ADMIN or project member |
| `POST /projects/:id/members` | ADMIN or project PM; add user and project role |
| `PATCH /projects/:id/members/:userId` | ADMIN or project PM; change role |
| `DELETE /projects/:id/members/:userId` | ADMIN or project PM; protect last PM |
| `GET /projects/:id/tasks` | ADMIN or project member; filter and paginate |
| `POST /projects/:id/tasks` | ADMIN or project PM |
| `GET /tasks/:id` | ADMIN or project member |
| `PATCH /tasks/:id` | ADMIN/PM full update; assigned member whitelist; requires version |
| `PATCH /tasks/:id/status` | ADMIN/PM or assigned member; requires version |
| `DELETE /tasks/:id` | ADMIN or project PM; cascades comments |
| `GET /tasks/:id/comments` | ADMIN or project member |
| `POST /tasks/:id/comments` | ADMIN, project PM, or team member |
| `DELETE /comments/:id` | ADMIN, project PM, or author |
| `GET /dashboard` | Authenticated; scoped counts, assigned tasks, overdue |

Task query filters: `status`, `assignee`, `priority`, `search`, `page`, `limit`. Use a bounded page size (default 20, max 100), stable sort (e.g. `updatedAt` descending then `_id`), and case-insensitive search backed by the declared text index or a safely escaped search strategy.

## 6. Validation, status codes, and errors

- Zod validates params, query strings, and request bodies. Reject invalid enums, malformed IDs, unknown write fields, invalid pagination, and invalid dates with 400 `VALIDATION_ERROR`.
- 401 `UNAUTHENTICATED`: not logged in, invalid/expired JWT, inactive/deleted account.
- 403 `FORBIDDEN`: authenticated but role/action is disallowed.
- 404 `NOT_FOUND`: absent resource or project that must be concealed from a non-member.
- 409 `EMAIL_EXISTS`: Mongo duplicate key (`11000`) for unique email.
- 409 `VERSION_CONFLICT`: stale task version; include latest `current`.
- 422 `BUSINESS_RULE_VIOLATION`: archived project writes, assignee is not a project member, last PM removal/demotion, or other validly shaped but impossible operation.
- CastError maps to 400 `VALIDATION_ERROR`; unexpected failures are logged server-side and return generic 500 without stack traces/secrets.
- Every client mutation produces a success or error toast; map 401/403/404/409/422 to actionable UI feedback.

## 7. Task optimistic concurrency (mandatory)

Every `PATCH /tasks/:id` and `PATCH /tasks/:id/status` body includes integer `version`. Validate permission and allowed fields, then perform one atomic operation:

```ts
Task.findOneAndUpdate(
  { _id: taskId, version: body.version },
  { $set: allowedFields, $inc: { version: 1 } },
  { new: true, runValidators: true }
)
```

Do **not** fetch then save, use an unconditional update, or silently ignore a version mismatch. If the atomic operation returns `null`, load the current task. If it still exists and remains authorized, return 409 with `current`; if deleted/inaccessible, use the appropriate 404. Ensure the failed attempt changes no data.

The client retains the submitted changes, opens **This task was updated by someone else**, compares **My changes** and **Latest values**, and offers:

- **Use latest:** discard local draft and refresh cached task/query data.
- **Reapply my changes:** apply the retained allowed edits to the latest values with the latest version; if that attempt conflicts again, present the new conflict.

For a Kanban drag conflict, revert the optimistic move first and offer a **Review** action that opens the same conflict flow.

## 8. MongoDB model and integrity requirements

Detailed schema is in `MONGODB-SCHEMA.md`. Summary:

- `User`: unique lowercase email, bcrypt `passwordHash` with `select: false`, global role, `isActive`.
- `Project`: name, description, active/archive status, creator, embedded unique member entries with project role and `addedAt`.
- `Task`: project, title, description, task status, priority, due date, nullable assignee, creator, integer version.
- `Comment`: task, author, body.
- Timestamps on all models.
- Indexes: unique `users.email`; `projects.members.user`, project status; `tasks(project,status)`, assignee, text(title+description); `comments(task,createdAt)`.
- Service integrity: unique user once per project; assignee must be project member; tasks/comments cascade on task deletion; tasks/comments for project cascade on project deletion; archived project rejects writes; no hard-delete users.
- Use a MongoDB transaction for multi-collection cascade deletion where the selected Mongo topology supports it. Atlas supports transactions; local development must use a replica set if transaction-backed cascades are enabled. Otherwise implement and test an explicit failure-safe cleanup strategy and document that choice.

## 9. Frontend implementation contract

- AuthContext loads `/auth/me`; unauthenticated requests lead to `/login`.
- `ProtectedRoute({ roles })` guards global-role pages and displays “Not authorized” for insufficient role.
- `useProjectRole(project)` and `can(action)` are presentation helpers only.
- TanStack Query owns server state, invalidation, retries, and optimistic updates; never treat cached client role as authorization.
- Axios uses `withCredentials: true`; central response handling maps API errors to toast/dialog behavior.
- React Hook Form + Zod provide client validation aligned with server schemas.
- Required routes: `/login`, `/dashboard`, `/projects`, `/projects/:id`, `/projects/:id/tasks`, `/projects/:id/team`, `/tasks/:id`, `/users`, `/profile`.
- Project detail has Tasks, Team, and Settings tabs. Tasks has Kanban/table toggle, filters, pagination. Users is ADMIN-only.

## 10. Seed and demo data

`npm run seed` in `server` is idempotent. Seed:

- `admin@demo.com` / `Password@123` / ADMIN
- `pm@demo.com` / `Password@123` / PROJECT_MANAGER
- `member@demo.com` / `Password@123` / TEAM_MEMBER
- `viewer@demo.com` / `Password@123` / VIEWER
- Two projects, with the PM assigned as project-level PM, and member/viewer memberships.
- About eight tasks covering statuses and priorities; include tasks assigned to member, unassigned tasks, and overdue tasks; include several comments.

Hash passwords with bcrypt. Use stable seed identifiers (email/name) and upsert/replace only seed-owned records; repeated runs must not duplicate users, projects, tasks, or comments. Warn that seeded credentials are development-only.

## 11. Test plan

Use integration tests through Express with Supertest and a disposable mongodb-memory-server replica set. Test setup must clear data between tests and close connections/processes.

Required tests:

1. TEAM_MEMBER `DELETE /tasks/:id` returns 403 and task remains.
2. VIEWER `POST /tasks/:id/comments` returns 403 and no comment is created.
3. Non-member `GET /projects/:id` returns 404.
4. Stale version `PATCH /tasks/:id` returns 409 with `current`; newest data remains unchanged.
5. TEAM_MEMBER cannot update another user's task or update fields outside `status`/`description`; verify persisted fields do not change.

Also test login wrong password/inactive user, auth DB reload/deactivation, admin bypass, PM membership operations and last-PM rule, archived write rejection, non-member assignee 422, safe user serialization, duplicate email 409, task/comment and project cascade behavior, and dashboard scoping.

## 12. Build quality and completion checks

- `npm run build`/type-check in each package and targeted tests pass.
- No `.env`, secrets, cloud credentials, or password hashes are committed or returned.
- A clean checkout can follow README from database startup through both app processes and tests.
- API access checks are covered by integration tests; do not consider hidden buttons sufficient.
- Document architectural decisions and trade-offs in `ARCHITECTURE.md`, especially embedded members, separate tasks/comments, version conflicts, and MongoDB's lack of SQL migrations.
