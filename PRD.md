# Product Requirements Document

## 1. Product summary

**Working name:** ProjectFlow  
**Purpose:** A small, explainable collaborative project-management application for a full-stack engineering hackathon. It lets teams organize projects, assign and track tasks, discuss work, and enforce role-based access on the server.

The first release is a local web application with a React client and a separately running Node.js API. The user confirmed that MongoDB Atlas is allowed for this challenge. Atlas is the selected database, accessed through a private `MONGO_URI` environment variable; Docker is not required.

## 2. Goals and success criteria

- Demonstrate secure server-side authorization for four global roles and project-specific roles.
- Support end-to-end project, team, task, and comment workflows.
- Prevent stale task edits from silently overwriting newer edits.
- Be understandable to a hackathon participant: clear names, small modules, explicit validation, and architecture documentation.
- Run locally with separate client and API processes; support a locally hosted MongoDB without code changes.
- Ship a repeatable seed, meaningful API tests, and clear setup instructions.

**Acceptance:** Seeded users can log in, see only permitted projects, and perform only permitted operations. The five required authorization/concurrency tests pass. A stale task edit returns HTTP 409 and does not alter the newest task values. Neither API responses nor UI payloads expose password hashes.

## 3. Users and roles

### Global roles

- **ADMIN:** Manage user accounts; see all projects; create, archive, and delete projects; assign project managers; bypass project membership checks.
- **PROJECT_MANAGER:** Manage projects for which the user has the project-level `PROJECT_MANAGER` role.
- **TEAM_MEMBER:** Work on projects for which the user is a member; update only their own assigned tasks' status and description.
- **VIEWER:** Read-only access to projects and tasks for which the user is a member.

### Project roles

Each project member has exactly one role: `PROJECT_MANAGER`, `TEAM_MEMBER`, or `VIEWER`. Project permissions are determined by this membership role, except that a global `ADMIN` is always allowed. A global role alone does not grant access to a project; a non-admin must be a member. An admin grants project-manager membership explicitly.

## 4. MVP scope

### Included

- Login/logout, authenticated profile (`name`, password update), and current-user loading.
- Admin-only user create/read/update/deactivate. Deactivation preserves history and immediately blocks further authenticated requests.
- Project listing scoped to the user's memberships (admins see all); admin project creation, archive, delete, and PM assignment; member PM and admin project metadata edits.
- Project member listing and add/remove/role changes by admin or that project's PM. Prevent removing or demoting the last PM.
- Task list, filters, pagination, details, create/edit/delete, assignment, and status changes with server-enforced permissions.
- Task comments: list and create for admin/PM/team members; delete by author, project PM, or admin.
- Dashboard scoped to accessible projects, including task status counts, the current user's assigned tasks, and overdue tasks.
- Responsive navigation, forms, inline validation, loading/empty/error states, success/error toasts, and task conflict review.
- Idempotent demo seed data, automated tests, README, and architecture documentation.

### Not in the MVP

- Public registration, invitations/email delivery, password reset, SSO/MFA, file attachments, notifications, audit-log UI, real-time collaboration, calendar integrations, billing, deployment, or mobile-native clients.
- No hard-delete operation for user accounts.

## 5. Core requirements and user stories

1. **Sign-in:** As a seeded user, I can authenticate with email/password and remain signed in through an HTTP-only cookie. Inactive accounts cannot authenticate or use an old session.
2. **Project discovery:** As a member, I see only projects I belong to. As an admin, I can see all projects and create one with a project manager.
3. **Team administration:** As an admin or project PM, I can add a member, change their project role, and remove them, unless that action would leave no PM.
4. **Task planning:** As an admin or project PM, I can create, edit, assign, and delete project tasks. An assignee must be a member of that project.
5. **Task execution:** As a team member, I can change status and description only on tasks assigned to me. I cannot edit someone else's task, assignment, title, priority, dates, or other protected fields.
6. **Read-only access:** As a viewer, I can read accessible projects/tasks/comments but cannot write, including through direct API calls.
7. **Discussion:** As an admin, PM, or team member, I can add a task comment. I can delete my own comment; a PM or admin can delete any comment in the project.
8. **Concurrent editing:** As an editor, I receive a conflict dialog when my task version is stale; I can use the latest data or reapply my intended changes against the latest version.
9. **Dashboard:** As an authenticated user, I see status counts and overdue work limited to projects I can access, plus my assigned tasks.
10. **Profile:** As a signed-in user, I can update my display name and password, but not my global role or active state.

## 6. Permission summary

| Operation | ADMIN | Project PM | TEAM_MEMBER | VIEWER |
|---|---|---|---|---|
| Manage users | Yes | No | No | No |
| View projects | All | Member projects | Member projects | Member projects |
| Create/archive/delete project; assign PM | Yes | No | No | No |
| Update project metadata | Yes | Own project | No | No |
| Manage project members | Yes | Own project | No | No |
| Create/assign/delete tasks | Yes | Own project | No | No |
| Update task | Any accessible task | Own project | Assigned task: `status`, `description` only | No |
| Read tasks/comments | Accessible projects | Own project | Own project | Own project |
| Create comment | Yes | Own project | Own project | No |
| Delete comment | Yes | Any in own project | Own comment | No |

“Own project” means the resource resolves to a project where the user has the matching project role. The server is authoritative; frontend visibility is only a usability aid.

## 7. Key rules and edge cases

- An archived project is read-only. All project, member, task, and comment write operations against it return 422 `PROJECT_ARCHIVED`. Admin deletion of an archived project remains allowed.
- A non-member receives 404 for project-scoped data so project existence is not disclosed. An authenticated user without a required role receives 403.
- Deactivating a user is not deletion. Existing authored content remains; the user cannot authenticate and should not remain assignable. Define seed and service behavior consistently.
- Task versions begin at 1. Every successful task patch increments the version exactly once. Stale updates return 409 with the latest task.
- A due date is overdue only when it is before the current time and status is not `DONE`.
- Lists use `{ data, meta: { page, limit, total } }`; filters and sorting are deterministic.
- Invalid input is 400, missing/inaccessible resource is 404, duplicate email is 409, and business-rule violation is 422.

## 8. UX and accessibility acceptance

- All primary actions have visible success/error feedback and clear loading/empty states.
- Forms show field-level validation and preserve entered values after non-destructive errors.
- Disabled controls explain the permission reason where practical; hidden controls never replace API enforcement.
- Keyboard navigation, visible focus states, semantic headings/labels, and dialog focus management work across core flows.
- Layout works at mobile, tablet, and desktop widths; tables have a mobile-friendly alternative.
- Conflict dialog labels both user changes and server-latest values and offers **Use latest** and **Reapply my changes**.
- A conflicted Kanban move is reverted immediately and offers a **Review** action.

## 9. Demo and acceptance scenarios

- Log in as each seeded role and verify project visibility and role badge.
- As a team member, directly call task delete and verify 403; try editing another user's task and a protected field and verify 403.
- As a viewer, directly post a comment and verify 403.
- As a non-member, request a project's detail and verify 404.
- Submit two task edits based on the same version; the second gets 409/current and the first edit remains intact.
- As a PM, attempt to remove or demote the only PM and verify a 422 response.
- Archive a project and verify write operations fail while reads continue.
- Restart the application and database; seeded login and the documented startup steps work.

## 10. Decisions and known constraint

The user confirmed approval to use MongoDB Atlas. Read the Atlas SRV connection string from `MONGO_URI` in the ignored server environment file. Keep credentials out of source and documentation, and allow the developer's current IP in Atlas Network Access.
