# ProjectFlow — Simple Pitch Guide (Easy Language)

---

## 1. What is it? (say this first)

> "ProjectFlow is like a simple **Trello / Jira** for teams.
> People can create projects, add team members, make tasks, move tasks (To Do → Done), and comment.
> Everyone has a **role**, and the app only lets them do what their role allows.
> And if two people edit the same task at the same time, nobody's work gets lost."

---

## 2. What problem does it solve?

1. **Wrong people changing things:** a viewer should not be able to delete a task.
   Our server checks every request. Even if someone tries hacking with Postman, the server says **"No."**
2. **Two people editing at once:** normally the last person to save wins and the first person's work disappears.
   Our app **detects** this and asks the second person what to do.
3. **Ex-employees still logged in:** when an admin deactivates a user, they are blocked **immediately**.

---

## 3. The 4 roles (think of a school)

| Role | School example | What they can do |
|---|---|---|
| **Admin** | Principal | Everything: manage users, create/delete projects |
| **Project Manager** | Class teacher | Manage **their** project: add people, create/assign/delete tasks |
| **Team Member** | Student | Work on **tasks given to them**: change status and description, write comments |
| **Viewer** | Parent visiting | Only look, can't change anything |

**Important:** Being a "Project Manager" doesn't make you the manager of **every** project.
You must be added to a project. Inside each project, every person has their own role.

---

## 4. How the app is built (3 parts)

```
  Website (React)   →   Server (Express)   →   Database (MongoDB)
  what you see          the brain + guard        where data is saved
  port 5173             port 4000                port 27017
```

- **Website (Frontend):** pages, buttons, forms, Kanban board.
- **Server (Backend):** checks **who you are** and **what you're allowed to do**, then saves data.
- **Database:** stores users, projects, tasks and comments. It runs **on our own computer**, not in the cloud.

**Simple rule:** The website only *hides* buttons for a better experience.
The **server is the real security guard**.

---

## 5. Inside the server (like a restaurant)

| Layer | Restaurant example | Job |
|---|---|---|
| **Routes** | Menu | List of all URLs the app has |
| **Middleware** | Security guard at the door | "Are you logged in? Are you allowed?" |
| **Controllers** | Waiter | Takes the order, brings back the answer |
| **Services** | Chef | Does the real work and follows all the rules |
| **Models** | Recipe book | Describes what data looks like |

---

## 6. Login: how it works

1. The user types an email and password.
2. The server checks the password. Passwords are stored **scrambled (hashed)**, never as plain text.
3. If it's correct, the server gives the browser a **secure cookie** (like a wristband at an event).
4. On every later request, the browser shows the wristband. The server checks it **and** looks the user up in the database again.
5. If the admin deactivated the user, the server rejects them **right away**.

Why a cookie? It's **httpOnly**, which means hackers' JavaScript can't steal it.

---

## 7. What the server answers (status codes)

| Code | Meaning in easy words |
|---|---|
| **200** | OK, done ✅ |
| **400** | You sent wrong or missing data |
| **401** | You're not logged in |
| **403** | You're logged in, but **not allowed** to do this |
| **404** | Not found, or **you're not in this project** (we hide that it exists) |
| **409** | **Someone else changed this task before you** |
| **422** | Breaks a rule (for example, the project is archived) |

---

## 8. ⭐ The star feature: no lost work

**Story:**
- A task has a **version number**, say **7**.
- Alice and Bob both open the task. Both see version 7.
- Alice saves first. The server says "OK" and changes the version to **8**.
- Bob saves, still thinking it's version 7.
- The server says: **"Wait! This task changed. You have version 7, but the latest is 8."** (Error 409)
- Bob sees a popup: **"This task was updated by someone else"**
  - Left side: **My changes**
  - Right side: **Latest values**
  - Button **"Use latest"**: throw away my changes.
  - Button **"Reapply my changes"**: put my changes on top of the new version.

**Real-life example:** Two people editing the same Google Doc paragraph offline.
Instead of one person's work disappearing, the app **warns** the second person and lets them decide.

**Technical name (if a judge asks):** "Optimistic locking". The check and the save happen in **one single database step**, so nothing can sneak in between.

---

## 9. Data we store (4 tables, called "collections")

| Collection | What's inside |
|---|---|
| **Users** | name, email, password (hashed), role, active yes/no |
| **Projects** | name, description, active/archived, **list of members with their roles** |
| **Tasks** | title, description, status, priority, due date, assigned person, **version** |
| **Comments** | which task, who wrote it, text |

**Why are members stored inside the project?** The member list is small and we need it on every permission check, so one lookup gives us everything.
**Why are tasks and comments separate?** There can be many of them, and they need searching, filters and pages.

---

## 10. Important rules the app follows

- ✅ You can only assign a task to someone **who is in the project**.
- ✅ An **archived** project is read-only. You can look, but you can't change anything.
- ✅ You **can't remove the last manager** of a project. Someone must always be in charge.
- ✅ Users are **never deleted**, only deactivated, so history stays.
- ✅ Deleting a project also deletes its tasks and comments, so no junk is left behind.
- ✅ A Team Member can only change **status and description** of **their own** tasks.

---

## 11. Pages in the app

| Page | What you see |
|---|---|
| **Login** | Email/password form, plus quick buttons for demo accounts |
| **Dashboard** | Task counts (To Do / In Progress / Review / Done), my tasks, overdue tasks |
| **Projects** | Cards of all my projects |
| **Project → Tasks** | Kanban board (drag cards) or table, with filters and search |
| **Project → Team** | Members list; add, remove or change role |
| **Task details** | All task info, version number, comments |
| **Users** | Admin only: create, edit and deactivate users |
| **Profile** | Change my name or password |

---

## 12. Demo accounts

All passwords: **Password@123**

- admin@demo.com: Admin
- pm@demo.com: Project Manager
- member@demo.com: Team Member
- viewer@demo.com: Viewer

`npm run seed` creates these users, plus 2 projects, about 8 tasks and some comments.

---

## 13. How to run it

```
1. Start MongoDB on your computer (docker compose up -d)
2. cd server → npm install → npm run seed → npm run dev
3. cd client → npm install → npm run dev
4. Open http://localhost:5173
```

---

## 14. Demo plan (5 minutes)

1. **Admin** logs in: sees everything and creates a project.
2. **PM** logs in: adds a member and creates a task for them.
3. **Member** logs in: moves their task to "In Progress".
   👉 Then uses Postman to try **deleting** the task. Server says **403 Not Allowed**. *(Shows real security.)*
4. **Viewer** logs in: can only look, no edit buttons.
5. **Two browsers, same task:** save in one, then save in the other. 👉 **Conflict popup appears.** *(Star moment.)*
6. Run the tests: all green ✅.

---

## 15. Easy answers to judge questions

**Q: Why 404 and not 403 for outsiders?**
A: 403 says "this exists, but you can't enter." 404 says "nothing here." We don't want outsiders to even know the project exists.

**Q: What if someone skips the website and calls the API directly?**
A: It doesn't matter. Every check is on the server, and our tests prove it.

**Q: What if two saves happen at the exact same moment?**
A: The database handles one at a time. Only one can match the old version, so the other gets the conflict popup.

**Q: Why check the database on every request?**
A: So that if an admin blocks someone, they're blocked **right now**, not when their login expires.

**Q: How do you know it works?**
A: Automated tests call the API like a hacker would and check that the right errors come back.

**Q: What would you add next?**
A: Live updates, notifications, file uploads and putting it online.

---

## 16. Closing line

> "ProjectFlow is simple to use, but safe underneath: **the server checks every action,
> nobody's work is silently lost, and our tests prove it.**"
