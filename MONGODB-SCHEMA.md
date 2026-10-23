# MongoDB / Mongoose Schema

This document specifies the persistence model for ProjectFlow. Mongoose models define the schema and indexes; there are no SQL migrations. Use strict schemas, timestamps, enum validation, and service-level validation for cross-document rules.

## Shared conventions

- Primary key: MongoDB ObjectId (`_id`).
- Add `createdAt` and `updatedAt` through Mongoose timestamps.
- Use `strict: "throw"` for write schemas where practical, so unexpected fields cannot slip past the API whitelist.
- Serialize safe DTOs explicitly. Never serialize `passwordHash`.
- Store references as ObjectIds; populate only the fields needed for the response.
- Global roles: `ADMIN | PROJECT_MANAGER | TEAM_MEMBER | VIEWER`.
- Project roles: `PROJECT_MANAGER | TEAM_MEMBER | VIEWER`.

## User

```ts
{
  _id: ObjectId,
  name: string,                 // trimmed, required
  email: string,                // required, lowercase, trimmed, unique
  passwordHash: string,         // required, bcrypt; select: false
  role: "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER" | "VIEWER",
  isActive: boolean,            // default true
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `{ email: 1 }` unique.  
**Rules:** Never hard-delete a user. Deactivation sets `isActive = false`; `requireAuth` reloads the record on every request and rejects inactive accounts. Existing project/task/comment references remain. Prevent deactivated users from new assignments and new project memberships. If an assigned user is later deactivated, keep the historical assignee reference but represent the account as inactive in UI.

## Project

```ts
{
  _id: ObjectId,
  name: string,                 // required, trimmed
  description: string,          // default ""
  status: "ACTIVE" | "ARCHIVED",// default ACTIVE
  createdBy: ObjectId,          // ref User, required
  members: [{
    user: ObjectId,             // ref User, required
    role: "PROJECT_MANAGER" | "TEAM_MEMBER" | "VIEWER",
    addedAt: Date               // default now
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `{ "members.user": 1 }`; `{ status: 1 }`.  
MongoDB cannot declare a unique compound index that enforces one `members.user` entry within each embedded array. Enforce uniqueness in the project service by checking the embedded members before add/role change; reject duplicate membership. Use atomic project updates where feasible.

**Rules:** A non-admin must be a member to see the project. Global PROJECT_MANAGER by itself grants no project access. Admin creates projects and assigns at least one project PM; the initial PM must be active. At least one project PM must remain; reject removal or demotion of the last PM. Archived projects are readable but reject writes.

## Task

```ts
{
  _id: ObjectId,
  project: ObjectId,            // ref Project, required
  title: string,                // required, trimmed
  description: string,          // default ""
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE",
  priority: "LOW" | "MEDIUM" | "HIGH",
  dueDate: Date | null,         // default null
  assignee: ObjectId | null,    // ref User, default null
  createdBy: ObjectId,          // ref User, required
  version: number,              // integer, default 1, min 1
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `{ project: 1, status: 1 }`
- `{ assignee: 1 }`
- Text index on `{ title: "text", description: "text" }`

**Rules:** Validate assignee is active and a member of the same project (422 `ASSIGNEE_NOT_PROJECT_MEMBER`). Admin/PM can set all editable fields. An assigned team member can set only `status` and `description` on their own task. Every update endpoint requires the current `version` and atomically increments it once.

## Comment

```ts
{
  _id: ObjectId,
  task: ObjectId,               // ref Task, required
  author: ObjectId,             // ref User, required
  body: string,                 // trimmed, required, bounded length
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `{ task: 1, createdAt: 1 }`.  
**Rules:** Comments belong to a task, and the task resolves the project for access checks. Admin, project PM, and team member may create; viewer cannot. Delete by author, project PM, or admin. Reject writes if the project is archived.

## Relationships

```text
User 1 ── * Project.createdBy
User * ── * Project.members[]       (embedded membership + role)
Project 1 ── * Task
User 1 ── * Task.createdBy
User 0..1 ── * Task.assignee
Task 1 ── * Comment
User 1 ── * Comment.author
```

Project membership is embedded because it is small, read and authorized with the project, and the role is intrinsic to that project-user relationship. Tasks and comments are separate collections because their counts can grow independently, they need their own indexes and pagination, and tasks/comments are frequently queried and edited independently. User records are referenced rather than embedded to avoid stale copies of identity and active state.

## Cascades and lifecycle

- Deleting a task deletes its comments.
- Deleting a project deletes its tasks and their comments.
- Never delete users as a cascade side effect; deactivate only.
- Prefer a MongoDB transaction for project/task/comment cascades. Transactions require a replica-set/sharded topology; Atlas provides this, and local Docker/test MongoDB must be configured as a single-node replica set. If choosing no transactions for simplicity, implement explicit cleanup ordering, surface failures, and add tests that prove no success response occurs with a partial cascade.
- Archive is a status update, not a cascade. Keep records and permit reads.

## Index initialization

Define indexes in the Mongoose models and use `autoIndex` for development/test only. Production-like startup should use an explicit, documented index-sync/startup strategy. Seed data should be idempotent and should not rely on destructive collection drops.

## Data integrity beyond schema validation

Mongoose enum and field validation cannot enforce all cross-document invariants. Services must enforce:

1. Active user membership and active assignee.
2. Unique user membership within one project's embedded list.
3. At least one project-level PM.
4. Project membership match for task assignee.
5. Archived-project write prohibition.
6. Cascading deletion behavior.
7. Task version atomic compare-and-increment.
