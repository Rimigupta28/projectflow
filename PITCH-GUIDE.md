# ProjectFlow — Pitch & Explanation Guide

Use this document to pitch the project and answer technical questions from judges.
It follows the PRD, TRD, MONGODB-SCHEMA and UI-UX documents in this folder.

---

## 1. 30-second elevator pitch

> "ProjectFlow is a collaborative project-management platform where admins, project managers,
> team members and viewers work on the same projects with **different permissions**.
> Two things make it trustworthy: **every permission is enforced on the server**, not just hidden
> in the UI, and **two people editing the same task can never silently overwrite each other**.
> The second save gets a 409 conflict, and the UI shows a 'review latest' dialog so the user can choose
> what to keep. It's a React + Express + MongoDB app that runs completely locally."

---

## 2. Problem → Solution

| Problem in real teams | How ProjectFlow solves it |
|---|---|
| Anyone can change anything; UI-only permission checks are easy to bypass with Postman/curl | Role checks run in Express middleware + services on **every request** |
| Two people edit the same task → last save wins, work is lost | **Optimistic concurrency** with a `version` number → HTTP 409 + conflict dialog |
| A deactivated employee still has a valid session | `requireAuth` **reloads the user from the DB on every request** → deactivation is instant |
| Users can see projects they shouldn't even know exist | Non-members get **404** (not 403), so a project's existence is hidden |
| Deleting things leaves orphan data | **Cascading deletes**: project → tasks → comments |

---

## 3. Roles & permissions (what to say)

There are **two layers of roles**:

1. **Global role** on the user: `ADMIN | PROJECT_MANAGER | TEAM_MEMBER | VIEWER`
2. **Project role** stored per member inside each project: `PROJECT_MANAGER | TEAM_MEMBER | VIEWER`

**Rule:** *Effective permission = user is ADMIN **OR** the user's role inside that project.*
A global PM is **not** automatically a PM of every project. They must be added to that project.

| Action | Admin | Project PM | Team Member | Viewer |
|---|---|---|---|---|
| Manage users | ✅ | ❌ | ❌ | ❌ |
| See projects | All | Own | Own | Own |
| Create / archive / delete project | ✅ | ❌ | ❌ | ❌ |
| Edit project info, manage team | ✅ | ✅ | ❌ | ❌ |
| Create / assign / delete tasks | ✅ | ✅ | ❌ | ❌ |
| Update task | ✅ all fields | ✅ all fields | Only **own** task, only `status` + `description` | ❌ |
| Comment | ✅ | ✅ | ✅ | ❌ |
| Delete comment | ✅ | ✅ any | Own only | ❌ |

**Status codes for security:**
- **401**: not logged in / token invalid / user deactivated
- **404**: not a member of the project (we hide that it exists)
- **403**: you are a member, but your role isn't allowed to do this
- **422**: business-rule violation (archived project, assignee not a member, removing the last PM)

---

## 4. Architecture

```
 Browser (React, :5173)
     │  HTTP/JSON + httpOnly cookie (Axios withCredentials)
     ▼
 Express API (:4000)
   helmet → cors → cookie-parser → rate-limit(login) → routes
   routes → middleware (requireAuth, role checks, Zod validation)
          → controllers (HTTP in/out only)
          → services (business rules + permissions)
          → Mongoose models
     ▼
 MongoDB (:27017, local via docker-compose mongo:7)
```

**Why layers?**
- **Routes**: just the URL list. Easy to read the whole API in one file.
- **Middleware**: cross-cutting checks (who are you, are you allowed, is input valid).
- **Controllers**: thin. Read `req`, call a service, send JSON.
- **Services**: the "brain". All rules live here, so they're applied no matter which route calls them.
- **Models**: schema, enums, indexes.

**Tech stack in one line:**
React 18 + Vite + TypeScript + Tailwind + React Router + TanStack Query + Axios + React Hook Form + Zod
| Node 22 + Express + TypeScript + Mongoose + Zod + bcryptjs + JWT + helmet + cors
| MongoDB 7 (local) | Vitest + Supertest + mongodb-memory-server.

---

## 5. Full request lifecycle (walk judges through this)

Example: a Team Member drags their task from **TODO** to **IN_PROGRESS**.

1. **UI**: Kanban card moves immediately (optimistic UI). TanStack Query sends
   `PATCH /api/tasks/:id/status` with `{ status: "IN_PROGRESS", version: 3 }`.
2. **Cookie**: The browser automatically sends the httpOnly JWT cookie.
3. **requireAuth**: Verifies the JWT, then **loads the user from MongoDB**. If the user is missing or inactive, it returns 401.
4. **Zod validation**: The body must contain exactly the allowed fields with valid enum values. Otherwise it returns 400.
5. **requireProjectRole**: Finds the task, then its project. Admin passes. A non-member gets 404. A wrong role gets 403.
6. **Service rules**:
   - Is the project archived? If so, return 422.
   - Team Member: is the task assigned to *me*? Am I only touching `status`/`description`? If not, return 403.
7. **Atomic versioned update** (one DB operation):
   ```ts
   Task.findOneAndUpdate(
     { _id: taskId, version: 3 },              // only if nobody changed it
     { $set: { status }, $inc: { version: 1 } },
     { new: true, runValidators: true }
   )
   ```
8. **Result**:
   - Document returned: 200 with the task at version 4. The UI keeps the move.
   - `null`: someone else changed it first. Return **409** with the latest task. The UI reverts the card and shows **Review**.

---

## 6. The concurrency feature (the "wow" moment)

**Scenario from the acceptance criteria:**
1. Task is at **version 7**. Alice and Bob both open it.
2. Alice saves. The server matches `version: 7`, applies her change and moves the task to **8**.
3. Bob saves, still sending `version: 7`. No document matches `{_id, version: 7}`, so the update does nothing.
4. The server returns:
   ```json
   { "error": { "code": "VERSION_CONFLICT", "message": "Task was modified by someone else" },
     "current": { "_id": "...", "version": 8, "title": "...", "status": "..." } }
   ```
5. Bob sees **"This task was updated by someone else"** with **My changes** and **Latest values** side by side:
   - **Use latest**: discard his draft and refresh.
   - **Reapply my changes**: resend his edits on top of version 8. If it conflicts again, the dialog reopens.

**Why it's correct:** The check and the write happen in **one atomic MongoDB operation**. We never "read, compare in JS, then save",
because that has a race window. This is called **optimistic locking**: no locks are held, and conflicts are detected when saving.

**Why not pessimistic locking?** Locking tasks while someone edits them causes stuck locks and needs timeouts. Optimistic locking is simpler and fits
a low-contention app.

---

## 7. Authentication

- **Login**: Zod validates the email and password. The server loads the user with `passwordHash` (normally hidden with `select: false`), runs `bcrypt.compare`, and rejects inactive users.
- **JWT in an httpOnly cookie** (`sameSite=lax`, `secure` in production):
  - httpOnly: JavaScript can't read it, so an XSS attack can't steal the token.
  - sameSite=lax: basic CSRF protection.
- **Logout** clears the cookie.
- **Profile**: The user can change only their name and password. Changing the password requires the current password.
- **Rate limiting** on login slows down brute-force attempts.
- Generic "Invalid credentials" message, so we don't reveal which emails exist.

---

## 8. Data model (MongoDB / Mongoose)

```
User     { name, email(unique), passwordHash(select:false), role, isActive }
Project  { name, description, status(ACTIVE|ARCHIVED), createdBy,
           members: [{ user, role, addedAt }] }        ← embedded
Task     { project, title, description, status, priority, dueDate,
           assignee, createdBy, version(default 1) }  ← separate collection
Comment  { task, author, body }                        ← separate collection
```
All models have `createdAt`/`updatedAt` timestamps.

**Design decisions (judges love these):**
- **Members are embedded** in the project because the list is small, always read with the project, and needed for every permission check. One query answers "is this user a member, and with what role?"
- **Tasks and comments are separate collections** because they can grow without limit, need their own indexes, pagination and filters, and are edited independently.
- **Users are referenced, not copied**, so a name change or deactivation shows up everywhere instantly.

**Indexes:**
| Index | Speeds up |
|---|---|
| `users.email` unique | login and duplicate prevention (409) |
| `projects.members.user` | "list my projects" |
| `tasks (project, status)` | Kanban columns and status filters |
| `tasks.assignee` | "My tasks" on the dashboard |
| text `(title, description)` | task search |
| `comments (task, createdAt)` | comment thread in order |

**Business rules in services (not just the schema):**
- Assignee must be a member of the project (422).
- Archived project: all writes are rejected (422), reads still work.
- The last PM of a project cannot be removed or demoted (422).
- Users are **deactivated, never hard-deleted**, which keeps history intact.
- Deleting a task deletes its comments. Deleting a project deletes its tasks and their comments.
- No SQL migrations: **Mongoose models + indexes + seed script define the structure.**

---

## 9. API overview (base `/api`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET/PATCH /auth/me` |
| Users (Admin) | `GET/POST /users`, `GET/PATCH /users/:id`, `POST /users/:id/deactivate` |
| Projects | `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`, `POST /projects/:id/archive` |
| Members | `GET/POST /projects/:id/members`, `PATCH/DELETE /projects/:id/members/:userId` |
| Tasks | `GET/POST /projects/:id/tasks` (filters: status, assignee, priority, search, page, limit), `GET/PATCH/DELETE /tasks/:id`, `PATCH /tasks/:id/status` |
| Comments | `GET/POST /tasks/:id/comments`, `DELETE /comments/:id` |
| Dashboard | `GET /dashboard` (status counts, my tasks, overdue tasks, all scoped to my projects) |

**Consistent shapes:**
- List: `{ data: [...], meta: { page, limit, total } }`
- Error: `{ error: { code, message, details? } }`

---

## 10. Frontend

**Pages:** `/login`, `/dashboard`, `/projects`, `/projects/:id` (Tasks / Team / Settings tabs),
`/projects/:id/tasks`, `/projects/:id/team`, `/tasks/:id`, `/users` (Admin only), `/profile`

- **AuthContext** loads `/auth/me` on startup. If the request fails, the user is sent to `/login`.
- **ProtectedRoute({ roles })** guards pages like `/users`.
- **useProjectRole / can(action)** hide buttons the user can't use. *This is only for UX; the server is the real guard.*
- **TanStack Query** handles fetching, caching, refetching after changes, and optimistic Kanban moves.
- **Axios interceptor** maps errors: 401 → login, 403 → "Not authorized", 404 → not-found page, 409 → conflict dialog, 422 → explain the rule.
- **React Hook Form + Zod** give inline form validation that matches the server rules.
- **Tasks view**: Kanban ↔ table toggle, filters, search and pagination.
- **Toasts** for every success or failure.

---

## 11. Testing (proof that security works)

Integration tests use **Supertest** against the real Express app and an in-memory MongoDB (**mongodb-memory-server**), with no shared state.

Required acceptance tests:
1. A Team Member calling `DELETE /api/tasks/:id` gets **403**, and the task still exists.
2. A Viewer calling `POST /api/tasks/:id/comments` gets **403**, and no comment is created.
3. A non-member calling `GET /api/projects/:id` gets **404**.
4. A stale `PATCH /api/tasks/:id` gets **409** with `current`, and Alice's newer data is unchanged.
5. A Team Member editing someone else's task, or a protected field like `title`, gets **403**, and nothing changes in the DB.

Extra tests: wrong password and inactive login, deactivation taking effect immediately, last-PM rule, archived project rejecting writes, non-member assignee (422), duplicate email (409), cascades, and dashboard scoping.

> Pitch line: *"We don't just hide buttons. We prove with tests that direct API calls are blocked."*

---

## 12. Seed data (`npm run seed`)

| Email | Password | Role |
|---|---|---|
| admin@demo.com | Password@123 | ADMIN |
| pm@demo.com | Password@123 | PROJECT_MANAGER |
| member@demo.com | Password@123 | TEAM_MEMBER |
| viewer@demo.com | Password@123 | VIEWER |

Seeding also creates two projects, about eight tasks across all statuses and priorities (some assigned, some overdue) and several comments.
The seed is **idempotent**: running it twice creates no duplicates. The credentials are for development only.

---

## 13. How to run locally

```bash
# 1. Database (local only)
docker compose up -d                 # or use a locally installed MongoDB service

# 2. API
cd server
cp .env.example .env                 # set a long random JWT_SECRET
npm install
npm run seed
npm run dev                          # http://localhost:4000

# 3. Client
cd ../client
cp .env.example .env
npm install
npm run dev                          # http://localhost:5173

# 4. Tests
cd ../server && npm test
```

---

## 14. Live demo script (about 5 minutes)

1. **Login as Admin**: see all projects, the Users page and the role badge. Create a project and assign `pm@demo.com` as its PM.
2. **Login as PM**: add `member@demo.com` to the team, create a task and assign it to the member. Show that you can't remove yourself if you're the last PM.
3. **Login as Member**: drag your task to IN_PROGRESS. Note there is no delete button.
   Then **open Postman/curl and call `DELETE /api/tasks/:id`. You get 403.** ← key moment
4. **Login as Viewer**: everything is read-only and there is no comment box. A direct POST gets 403.
5. **Concurrency**: open the same task in two browsers (PM and Admin). Save in one, then save in the other.
   The **409 conflict dialog** shows My changes vs Latest values. Click "Reapply my changes". ← key moment
6. **Archive the project** as Admin. Writes now fail with 422, reads still work.
7. Show the **dashboard**: counts, my tasks and overdue tasks.
8. Run `npm test` and show all tests passing.

---

## 15. Likely judge questions & answers

**Q: Why return 404 instead of 403 for non-members?**
A: 403 would confirm the project exists. 404 hides it from people who don't belong. That's an information-leak protection.

**Q: Why reload the user on every request? Isn't the JWT enough?**
A: A JWT is valid until it expires. Reloading means deactivation or a role change takes effect **immediately**. It costs one indexed lookup per request, which is fine at this scale.

**Q: How do you stop a team member from editing the title through the API?**
A: The server uses an exact field whitelist. If a member sends anything other than `status`/`description`, the request is rejected with 403. We don't silently drop the extra fields.

**Q: What if two saves arrive at the exact same millisecond?**
A: MongoDB applies single-document updates atomically. Only one can match `version: 7`, and the other gets `null` and therefore a 409.

**Q: Why MongoDB and not SQL?**
A: Projects with embedded members fit the document model well. Mongoose gives schema validation and indexes. The trade-off is that cross-document rules (assignee must be a member, cascades) live in services instead of foreign keys.

**Q: How are cascades kept safe?**
A: The service deletes the children (comments, then tasks), then the parent. With a replica set this can be wrapped in a transaction. Otherwise failures are surfaced, never reported as success.

**Q: Why cookies instead of localStorage for the token?**
A: httpOnly cookies can't be read by JavaScript, so an XSS bug can't steal the session.

**Q: How would you scale it?**
A: Add websockets for live updates, Redis for sessions and caching, an audit log, email invites, and deploy the API behind a load balancer. The API is stateless apart from the cookie, so it scales horizontally.

---

## 16. Trade-offs & future work

- **No real-time updates** (websockets are out of scope). Conflicts are handled at save time instead.
- **Embedded members** work well for small teams. Very large teams would move to a separate collection.
- **Per-request user reload** adds one DB call, which is acceptable for correctness.
- **Future work:** notifications, file attachments, activity history, SSO, deployment.

---

## 17. One-line closing

> "ProjectFlow is small, but every request is authenticated against the database, authorized on the server,
> validated with Zod, and protected from lost updates by atomic versioning, and the tests prove it."
