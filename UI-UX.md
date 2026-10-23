# UI/UX Design Specification

## 1. Experience principles

- **Clear permissions:** Users should understand why an action is unavailable. UI role checks improve usability but never replace server authorization.
- **Work-first hierarchy:** Projects and tasks are the primary navigation; status and ownership are scannable.
- **Fast feedback:** Show pending, success, empty, and error states for every server interaction.
- **Explain conflicts:** Never discard a user's draft silently when a task changes elsewhere.
- **Hackathon-friendly:** Use familiar components and a compact layout that is feasible to build and explain.

## 2. Visual direction

- Clean, light productivity dashboard with a neutral gray background, white cards, dark slate text, and one indigo/blue primary accent.
- Status colors: TODO gray, IN_PROGRESS blue, IN_REVIEW amber, DONE green. Priority uses text plus subtle color (LOW slate, MEDIUM amber, HIGH red); never rely on color alone.
- Use consistent spacing, modest rounded corners, subtle borders, and clear typography hierarchy. Reserve shadows for overlays and elevated panels.
- Role badge is always visible in the top bar with a distinct but accessible color.
- Icons from lucide-react are paired with text or accessible labels; do not use unlabeled icon-only primary actions.
- Support responsive breakpoints: wide desktop sidebar; tablet collapsible sidebar; mobile drawer and stacked cards/forms.

## 3. Global shell

### Sidebar

- Product mark/name.
- Dashboard
- Projects
- Users (ADMIN only)
- Profile (or profile access from the user menu)
- Current user name and sign-out action in the lower section.

### Top bar

- Current page title/breadcrumb.
- Current role badge.
- Optional project context/actions.
- User menu with Profile and Sign out.

On mobile, use a top bar with menu button and a dismissible navigation drawer. Preserve focus and prevent background scrolling while the drawer is open.

## 4. Routes and screens

### `/login`

- Centered sign-in panel with email and password fields, inline field errors, show/hide password control, and submit loading state.
- Demo-account quick-fill buttons for Admin, Project Manager, Team Member, and Viewer. Clicking fills credentials but does not automatically authenticate.
- Show a generic invalid-credentials message; do not reveal whether an email exists or is inactive.
- Link to no registration flow (out of scope).
- On successful login, load `/auth/me` and route to dashboard.

### `/dashboard`

- Welcome line and role badge.
- Four status stat cards (TODO, IN_PROGRESS, IN_REVIEW, DONE) scoped to accessible projects.
- “My tasks” list with status, project, due date, and task link; empty state when none.
- “Overdue tasks” section with clear due date and status; exclude DONE.
- “Recent projects” cards, scoped to accessible projects.
- Skeleton cards while loading; retry action on error.

### `/projects`

- Page title, short helper copy, and “New project” button for ADMIN only.
- Responsive project card grid; each card shows name, active/archived badge, concise description, member count, and task status summary.
- Filter active/archived if supported; default to active projects. Clearly label archived projects and disable their write controls.
- Empty state explains that no projects are available and instructs members to contact an admin; admin gets a create-project CTA.
- Project creation form includes name, description, and initial PM selection; validation errors inline.

### `/projects/:id`

- Project header: name, status, description, breadcrumbs, and context actions.
- Tabs: **Tasks**, **Team**, **Settings**. Tabs navigate to nested routes and retain project context.
- Archived project banner: “This project is archived and read-only.”

### `/projects/:id/tasks`

- Header with project name and task count.
- Filter row: status, assignee, priority, search. Provide clear-all filters.
- Pagination with current range and total.
- Board/table toggle; persist preference locally.
- **Kanban:** columns by status, cards with title, priority, assignee initials/avatar, due date, and overdue indicator. Drag/drop is available only when permitted. Optimistically move the card; on failure revert and show a toast. On 409, revert and display a **Review** action.
- **Table:** compact responsive rows with title, status, priority, assignee, due date, and updated time. On small screens render cards instead of horizontally overflowing a large table.
- “New task” button for ADMIN/PM only. Create/edit forms validate required title, enum fields, due date, and assignee membership.
- Empty filtered result has a “Clear filters” action; truly empty project has role-appropriate create guidance.

### `/projects/:id/team`

- Member list with name, email, global role, project role, and added date.
- Role selector and remove button only for ADMIN/PM. Use a confirmation dialog before removing a member.
- Prevent selecting/removing/demoting the last PM; explain the rule inline.
- Add-member dialog searches active users and requires a project role. Prevent duplicates.
- Viewer/member role action affordances do not appear; server remains authoritative.
- Loading skeleton, empty state, and explicit error/retry states.

### `/projects/:id` Settings tab

- Project name and description edit form for ADMIN/PM.
- Archive action for ADMIN with confirmation that the project becomes read-only.
- Delete action for ADMIN only, visually separated and requiring typed or explicit confirmation because it permanently cascades tasks/comments.
- Archived projects show metadata read-only; an admin can still delete. Re-activation is not in MVP unless explicitly added.

### `/tasks/:id`

- Breadcrumb: Projects → Project → Task.
- Title, status, priority, project, assignee, due date, description, creator, last updated, and visible **Version N**.
- Edit controls follow permission policy. For assigned team member, only status and description are editable.
- Comments stream sorted oldest-to-newest (or consistently documented), author and timestamp, with inline delete control for author/PM/admin.
- Comment input for ADMIN/PM/TEAM_MEMBER only. Viewer sees read-only comments and no composer.
- Archived project banner and disabled controls.
- Not-found/inaccessible state is a generic 404-style page; do not expose project data.

### `/users` (ADMIN only)

- Paginated table/card list with name, email, global role, active state, and actions.
- Search/filter by active state and role.
- Create/edit dialog with inline validation; never show password hash.
- Deactivate action requires confirmation; describe that the account loses access immediately but history is retained.
- Non-admin direct navigation displays “Not authorized” or redirects according to the shared protected-route behavior.

### `/profile`

- Name and email display; editable name.
- Password change form with current password, new password, confirmation, and inline strength/validation guidance.
- Do not expose global role or active status as editable.
- Success toast and refreshed auth context after update.

## 5. Reusable component inventory

- `AppShell`, `Sidebar`, `TopBar`, `RoleBadge`, `ProtectedRoute`
- `PageHeader`, `ProjectCard`, `StatCard`, `TaskCard`, `TaskTable`, `StatusBadge`, `PriorityBadge`
- `FilterBar`, `Pagination`, `EmptyState`, `Skeleton`
- `FormField`, `ConfirmDialog`, `ConflictDialog`, `ToastProvider`
- `MemberTable`, `AddMemberDialog`, `TaskForm`, `CommentList`, `CommentComposer`

Keep component APIs small and typed. Avoid a large homegrown design system.

## 6. Forms and validation UX

- Use React Hook Form with Zod schemas aligned with server validation.
- Show errors next to fields and connect them with `aria-describedby`.
- Preserve safe user input when requests fail. Clear passwords after successful authentication/update.
- Disable submit while pending and prevent duplicate submissions.
- Server validation errors should map field paths to the relevant inputs when possible; show an actionable toast for non-field errors.
- Confirm irreversible or high-impact actions (project delete, member remove, deactivation).

## 7. Loading, errors, and feedback

- Use skeletons that match the final card/table layout; avoid full-page spinners for normal list loading.
- Empty states distinguish “no data yet” from “no results for these filters.”
- Toast every successful mutation and every failed mutation, with plain-language text.
- 401: clear cached user state and route to login.
- 403: show “Not authorized” without retry loops.
- 404: show an unavailable/not-found state without leaking resource existence.
- 409 email duplicate: inline email error where possible.
- 409 task version: open conflict dialog; do not reduce to a toast alone.
- 422: explain business rule (archived project, invalid assignee, last PM) and retain form input.
- Network/500: show retry and preserve draft.

## 8. Conflict dialog

**Title:** “This task was updated by someone else”  
**Content:** Latest server version and the user's attempted values, shown field-by-field. Clearly identify the version numbers and do not include hidden fields the user cannot edit.  
**Actions:**

- **Use latest:** close dialog, replace task cache/draft with server `current`, toast confirmation.
- **Reapply my changes:** create a new patch from retained allowed fields using `current.version`. If another conflict occurs, refresh latest and re-open the comparison.

For a board drag conflict, restore the card to its server status immediately; display a non-blocking toast/action to open **Review**.

## 9. Accessibility and responsive behavior

- Use semantic HTML, heading order, explicit form labels, keyboard-operable controls, and visible focus rings.
- Dialogs trap focus, close on Escape where safe, return focus to the trigger, and announce title/description to screen readers.
- Kanban drag/drop must have a keyboard-accessible status-change alternative.
- Text contrast meets WCAG AA for standard text; badges include text labels.
- Respect reduced-motion preference; use motion sparingly.
- At mobile widths, convert data tables to labeled cards, move filters into a collapsible panel, and keep primary action reachable.

## 10. UX definition of done

- All required routes have loading, empty, success, and error treatment appropriate to their data.
- User cannot mistake a hidden action for a successful operation; permission-related disabled controls have an explanation.
- Login, project create, member management, task CRUD, comments, profile, and conflict recovery are usable with keyboard alone.
- Stale task updates display attempted vs latest values and both recovery actions.
- Layout is checked at mobile, tablet, and desktop sizes before final delivery.
