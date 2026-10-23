var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var routes_exports = {};
__export(routes_exports, {
  default: () => routes_default
});
module.exports = __toCommonJS(routes_exports);
var import_express = require("express");
var import_express_rate_limit = __toESM(require("express-rate-limit"));
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_mongoose = __toESM(require("mongoose"));
var import_zod = require("zod");
var import_env = require("../config/env");
var import_Comment = require("../models/Comment");
var import_Project = require("../models/Project");
var import_Task = require("../models/Task");
var import_User = require("../models/User");
var import_auth = require("../middleware/auth");
var import_asyncHandler = require("../utils/asyncHandler");
var import_errors = require("../utils/errors");
var import_pagination = require("../utils/pagination");
var import_access = require("../services/access");
var import_validate = require("../middleware/validate");
const router = (0, import_express.Router)();
const idSchema = import_zod.z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");
const emailSchema = import_zod.z.string().email().max(254).transform((value) => value.trim().toLowerCase());
const roleSchema = import_zod.z.enum(import_User.GLOBAL_ROLES);
const projectRoleSchema = import_zod.z.enum(import_Project.PROJECT_ROLES);
const statusSchema = import_zod.z.enum(import_Task.TASK_STATUSES);
const prioritySchema = import_zod.z.enum(import_Task.TASK_PRIORITIES);
const loginLimiter = (0, import_express_rate_limit.default)({ windowMs: 15 * 60 * 1e3, limit: 10, standardHeaders: true, legacyHeaders: false });
const safeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive
});
const setCookie = (res, token) => res.cookie("token", token, {
  httpOnly: true,
  sameSite: "lax",
  secure: import_env.env.cookieSecure,
  path: "/",
  maxAge: 24 * 60 * 60 * 1e3
});
async function loadProject(id) {
  const project = await import_Project.Project.findById(id);
  if (!project) throw (0, import_errors.notFound)();
  return project;
}
async function loadTaskAndProject(id) {
  const task = await import_Task.Task.findById(id);
  if (!task) throw (0, import_errors.notFound)();
  const project = await loadProject(String(task.project));
  return { task, project };
}
function requireExactKeys(body, allowed) {
  const unknown = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unknown.length) throw (0, import_errors.badRequest)("Unknown fields are not allowed", unknown);
}
function listParams(query) {
  return (0, import_pagination.pagination)(query);
}
router.post(
  "/auth/login",
  loginLimiter,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const body = (0, import_validate.parse)(import_zod.z.object({ email: emailSchema, password: import_zod.z.string().min(1).max(200) }).strict(), req.body);
    const user = await import_User.User.findOne({ email: body.email }).select("+passwordHash");
    if (!user || !user.isActive || !await import_bcryptjs.default.compare(body.password, user.passwordHash)) {
      throw new import_errors.AppError(401, "UNAUTHENTICATED", "Email or password is incorrect");
    }
    const token = import_jsonwebtoken.default.sign({ sub: String(user._id) }, import_env.env.jwtSecret, {
      expiresIn: import_env.env.jwtExpiresIn
    });
    setCookie(res, token);
    res.json({ data: safeUser(user) });
  })
);
router.post("/auth/logout", (_req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: import_env.env.cookieSecure, path: "/" });
  res.status(204).end();
});
router.get("/auth/me", import_auth.requireAuth, (req, res) => res.json({ data: req.user }));
router.patch(
  "/auth/me",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const body = (0, import_validate.parse)(
      import_zod.z.object({
        name: import_zod.z.string().trim().min(2).max(100).optional(),
        currentPassword: import_zod.z.string().min(1).max(200).optional(),
        password: import_zod.z.string().min(8).max(200).optional()
      }).strict().refine((value) => value.name !== void 0 || value.password !== void 0, "No changes supplied"),
      req.body
    );
    const user = await import_User.User.findById((0, import_access.ensureUser)(req).id).select("+passwordHash");
    if (!user) throw (0, import_errors.notFound)();
    if (body.name) user.name = body.name;
    if (body.password) {
      if (!body.currentPassword || !await import_bcryptjs.default.compare(body.currentPassword, user.passwordHash)) {
        throw new import_errors.AppError(403, "FORBIDDEN", "Current password is incorrect");
      }
      user.passwordHash = await import_bcryptjs.default.hash(body.password, 12);
    }
    await user.save();
    res.json({ data: safeUser(user) });
  })
);
router.get(
  "/users",
  import_auth.requireAuth,
  (0, import_auth.requireGlobalRole)("ADMIN"),
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const { page, limit, skip } = listParams(req.query);
    const filter = {};
    if (req.query.role) filter.role = (0, import_validate.parse)(roleSchema, req.query.role);
    if (req.query.isActive !== void 0) {
      if (!["true", "false"].includes(String(req.query.isActive))) throw (0, import_errors.badRequest)("isActive must be true or false");
      filter.isActive = req.query.isActive === "true";
    }
    if (req.query.search) filter.$or = ["name", "email"].map((key) => ({ [key]: { $regex: String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }));
    const [users, total] = await Promise.all([
      import_User.User.find(filter).select("name email role isActive createdAt").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      import_User.User.countDocuments(filter)
    ]);
    res.json((0, import_pagination.paged)(users.map(safeUser), page, limit, total));
  })
);
router.post(
  "/users",
  import_auth.requireAuth,
  (0, import_auth.requireGlobalRole)("ADMIN"),
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const body = (0, import_validate.parse)(import_zod.z.object({ name: import_zod.z.string().trim().min(2).max(100), email: emailSchema, password: import_zod.z.string().min(8).max(200), role: roleSchema }).strict(), req.body);
    const user = await import_User.User.create({ name: body.name, email: body.email, passwordHash: await import_bcryptjs.default.hash(body.password, 12), role: body.role });
    res.status(201).json({ data: safeUser(user) });
  })
);
router.get(
  "/users/:id",
  import_auth.requireAuth,
  (0, import_auth.requireGlobalRole)("ADMIN"),
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const user = await import_User.User.findById((0, import_validate.parse)(idSchema, req.params.id)).select("name email role isActive createdAt").lean();
    if (!user) throw (0, import_errors.notFound)();
    res.json({ data: safeUser(user) });
  })
);
router.patch(
  "/users/:id",
  import_auth.requireAuth,
  (0, import_auth.requireGlobalRole)("ADMIN"),
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const body = (0, import_validate.parse)(import_zod.z.object({ name: import_zod.z.string().trim().min(2).max(100).optional(), email: emailSchema.optional(), role: roleSchema.optional() }).strict().refine((value) => Object.keys(value).length > 0), req.body);
    const user = await import_User.User.findByIdAndUpdate((0, import_validate.parse)(idSchema, req.params.id), body, { new: true, runValidators: true }).select("name email role isActive");
    if (!user) throw (0, import_errors.notFound)();
    res.json({ data: safeUser(user) });
  })
);
router.post(
  "/users/:id/deactivate",
  import_auth.requireAuth,
  (0, import_auth.requireGlobalRole)("ADMIN"),
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const user = await import_User.User.findByIdAndUpdate((0, import_validate.parse)(idSchema, req.params.id), { isActive: false }, { new: true }).select("name email role isActive");
    if (!user) throw (0, import_errors.notFound)();
    res.json({ data: safeUser(user) });
  })
);
router.get(
  "/projects",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const { page, limit, skip } = listParams(req.query);
    const filter = req.user.role === "ADMIN" ? {} : { "members.user": new import_mongoose.Types.ObjectId(req.user.id) };
    if (req.query.status) {
      if (!["ACTIVE", "ARCHIVED"].includes(String(req.query.status))) throw (0, import_errors.badRequest)("Invalid project status");
      Object.assign(filter, { status: req.query.status });
    }
    const [projects, total] = await Promise.all([
      import_Project.Project.find(filter).sort({ updatedAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      import_Project.Project.countDocuments(filter)
    ]);
    res.json((0, import_pagination.paged)(projects, page, limit, total));
  })
);
router.post(
  "/projects",
  import_auth.requireAuth,
  (0, import_auth.requireGlobalRole)("ADMIN"),
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const body = (0, import_validate.parse)(import_zod.z.object({ name: import_zod.z.string().trim().min(2).max(120), description: import_zod.z.string().max(2e3).default(""), projectManagerId: idSchema }).strict(), req.body);
    const manager = await import_User.User.findOne({ _id: body.projectManagerId, isActive: true });
    if (!manager) throw (0, import_errors.businessRule)("INVALID_PROJECT_MANAGER", "An active project manager is required");
    const project = await import_Project.Project.create({
      name: body.name,
      description: body.description,
      createdBy: req.user.id,
      members: [{ user: manager._id, role: "PROJECT_MANAGER" }]
    });
    res.status(201).json({ data: project });
  })
);
router.get(
  "/projects/:id",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const project = await loadProject((0, import_validate.parse)(idSchema, req.params.id));
    (0, import_access.ensureProjectAccess)((0, import_access.ensureUser)(req), project);
    res.json({ data: project });
  })
);
router.patch(
  "/projects/:id",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const project = await loadProject((0, import_validate.parse)(idSchema, req.params.id));
    (0, import_access.ensureProjectAccess)((0, import_access.ensureUser)(req), project, ["PROJECT_MANAGER"]);
    (0, import_access.ensureWritable)(project);
    const body = (0, import_validate.parse)(import_zod.z.object({ name: import_zod.z.string().trim().min(2).max(120).optional(), description: import_zod.z.string().max(2e3).optional() }).strict().refine((value) => Object.keys(value).length > 0), req.body);
    Object.assign(project, body);
    await project.save();
    res.json({ data: project });
  })
);
router.post(
  "/projects/:id/archive",
  import_auth.requireAuth,
  (0, import_auth.requireGlobalRole)("ADMIN"),
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const project = await import_Project.Project.findByIdAndUpdate((0, import_validate.parse)(idSchema, req.params.id), { status: "ARCHIVED" }, { new: true });
    if (!project) throw (0, import_errors.notFound)();
    res.json({ data: project });
  })
);
router.delete(
  "/projects/:id",
  import_auth.requireAuth,
  (0, import_auth.requireGlobalRole)("ADMIN"),
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const id = (0, import_validate.parse)(idSchema, req.params.id);
    const session = await import_mongoose.default.startSession();
    try {
      await session.withTransaction(async () => {
        const project = await import_Project.Project.findById(id).session(session);
        if (!project) throw (0, import_errors.notFound)();
        const tasks = await import_Task.Task.find({ project: id }).select("_id").session(session);
        const taskIds = tasks.map((task) => task._id);
        await import_Comment.Comment.deleteMany({ task: { $in: taskIds } }, { session });
        await import_Task.Task.deleteMany({ project: id }, { session });
        await import_Project.Project.deleteOne({ _id: id }, { session });
      });
    } finally {
      await session.endSession();
    }
    res.status(204).end();
  })
);
router.get(
  "/projects/:id/members",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const project = await loadProject((0, import_validate.parse)(idSchema, req.params.id));
    (0, import_access.ensureProjectAccess)((0, import_access.ensureUser)(req), project);
    await project.populate({ path: "members.user", select: "name email role isActive" });
    res.json({ data: project.members });
  })
);
router.get(
  "/projects/:id/available-members",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const project = await loadProject((0, import_validate.parse)(idSchema, req.params.id));
    (0, import_access.ensureProjectAccess)((0, import_access.ensureUser)(req), project, ["PROJECT_MANAGER"]);
    const existingIds = project.members.map((member) => member.user);
    const users = await import_User.User.find({ isActive: true, _id: { $nin: existingIds } })
      .select("name email role")
      .sort({ name: 1 })
      .limit(100)
      .lean();
    res.json({ data: users.map((user) => ({ id: String(user._id), name: user.name, email: user.email, role: user.role })) });
  })
);
router.post(
  "/projects/:id/members",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const project = await loadProject((0, import_validate.parse)(idSchema, req.params.id));
    (0, import_access.ensureProjectAccess)((0, import_access.ensureUser)(req), project, ["PROJECT_MANAGER"]);
    (0, import_access.ensureWritable)(project);
    const body = (0, import_validate.parse)(import_zod.z.object({ userId: idSchema, role: projectRoleSchema }).strict(), req.body);
    if (project.members.some((member2) => String(member2.user) === body.userId)) {
      throw (0, import_errors.businessRule)("ALREADY_MEMBER", "This user is already a project member");
    }
    const member = await import_User.User.findOne({ _id: body.userId, isActive: true });
    if (!member) throw (0, import_errors.businessRule)("INVALID_MEMBER", "An active user is required");
    project.members.push({ user: member._id, role: body.role, addedAt: /* @__PURE__ */ new Date() });
    await project.save();
    res.status(201).json({ data: { userId: String(member._id), role: body.role } });
  })
);
router.patch(
  "/projects/:id/members/:userId",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const project = await loadProject((0, import_validate.parse)(idSchema, req.params.id));
    (0, import_access.ensureProjectAccess)((0, import_access.ensureUser)(req), project, ["PROJECT_MANAGER"]);
    (0, import_access.ensureWritable)(project);
    const body = (0, import_validate.parse)(import_zod.z.object({ role: projectRoleSchema }).strict(), req.body);
    const target = project.members.find((member) => String(member.user) === (0, import_validate.parse)(idSchema, req.params.userId));
    if (!target) throw (0, import_errors.notFound)();
    if (target.role === "PROJECT_MANAGER" && body.role !== "PROJECT_MANAGER" && project.members.filter((member) => member.role === "PROJECT_MANAGER").length <= 1) {
      throw (0, import_errors.businessRule)("LAST_PROJECT_MANAGER", "A project must have at least one project manager");
    }
    target.role = body.role;
    await project.save();
    res.json({ data: { userId: String(target.user), role: target.role } });
  })
);
router.delete(
  "/projects/:id/members/:userId",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const project = await loadProject((0, import_validate.parse)(idSchema, req.params.id));
    (0, import_access.ensureProjectAccess)((0, import_access.ensureUser)(req), project, ["PROJECT_MANAGER"]);
    (0, import_access.ensureWritable)(project);
    const userId = (0, import_validate.parse)(idSchema, req.params.userId);
    const target = project.members.find((member) => String(member.user) === userId);
    if (!target) throw (0, import_errors.notFound)();
    if (target.role === "PROJECT_MANAGER" && project.members.filter((member) => member.role === "PROJECT_MANAGER").length <= 1) {
      throw (0, import_errors.businessRule)("LAST_PROJECT_MANAGER", "A project must have at least one project manager");
    }
    project.members = project.members.filter((member) => String(member.user) !== userId);
    await project.save();
    res.status(204).end();
  })
);
const taskFields = ["title", "description", "status", "priority", "dueDate", "assignee"];
const taskPatchSchema = import_zod.z.object({
  version: import_zod.z.number().int().min(1),
  title: import_zod.z.string().trim().min(2).max(200).optional(),
  description: import_zod.z.string().max(5e3).optional(),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  dueDate: import_zod.z.union([import_zod.z.null(), import_zod.z.coerce.date()]).optional(),
  assignee: import_zod.z.union([idSchema, import_zod.z.null()]).optional()
}).strict().refine((body) => Object.keys(body).some((key) => key !== "version"), "At least one task field is required");
async function validateAssignee(projectId, assignee) {
  if (assignee === void 0 || assignee === null) return;
  const project = await import_Project.Project.findOne({ _id: projectId, "members.user": assignee });
  const user = await import_User.User.findOne({ _id: assignee, isActive: true }).select("_id");
  if (!project || !user) throw (0, import_errors.businessRule)("ASSIGNEE_NOT_PROJECT_MEMBER", "Assignee must be an active member of this project");
}
async function patchTask(req, res, statusOnly = false) {
  const { task, project } = await loadTaskAndProject((0, import_validate.parse)(idSchema, req.params.id));
  const user = (0, import_access.ensureUser)(req);
  const role = (0, import_access.ensureProjectAccess)(user, project);
  (0, import_access.ensureWritable)(project);
  const schema = statusOnly ? import_zod.z.object({ version: import_zod.z.number().int().min(1), status: statusSchema }).strict() : taskPatchSchema;
  const body = (0, import_validate.parse)(schema, req.body);
  const updates = Object.fromEntries(Object.entries(body).filter(([key]) => key !== "version"));
  const manager = user.role === "ADMIN" || role === "PROJECT_MANAGER";
  if (!manager) {
    if (role !== "TEAM_MEMBER" || String(task.assignee ?? "") !== user.id) throw (0, import_errors.forbidden)();
    if (Object.keys(updates).some((key) => !["status", "description"].includes(key))) {
      throw (0, import_errors.forbidden)("Team members may only update task status and description");
    }
  }
  if ("assignee" in updates) await validateAssignee(String(project._id), updates.assignee);
  // Compare-and-increment happens in one MongoDB operation to prevent stale edits overwriting newer work.
  const updated = await import_Task.Task.findOneAndUpdate(
    { _id: task._id, version: body.version },
    { $set: updates, $inc: { version: 1 } },
    { new: true, runValidators: true }
  ).lean();
  if (updated) {
    res.json({ data: updated });
    return;
  }
  const current = await import_Task.Task.findById(task._id).lean();
  if (!current) throw (0, import_errors.notFound)();
  (0, import_access.ensureProjectAccess)(user, await loadProject(String(current.project)));
  res.status(409).json({
    error: { code: "VERSION_CONFLICT", message: "Task was modified by someone else" },
    current
  });
}
router.get(
  "/projects/:id/tasks",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const project = await loadProject((0, import_validate.parse)(idSchema, req.params.id));
    (0, import_access.ensureProjectAccess)((0, import_access.ensureUser)(req), project);
    const { page, limit, skip } = listParams(req.query);
    const filter = { project: project._id };
    if (req.query.status) filter.status = (0, import_validate.parse)(statusSchema, req.query.status);
    if (req.query.priority) filter.priority = (0, import_validate.parse)(prioritySchema, req.query.priority);
    if (req.query.assignee) filter.assignee = (0, import_validate.parse)(idSchema, req.query.assignee);
    if (req.query.search) {
      const search = String(req.query.search).trim();
      if (search.length > 100) throw (0, import_errors.badRequest)("Search must be 100 characters or fewer");
      filter.$text = { $search: search };
    }
    const [tasks, total] = await Promise.all([
      import_Task.Task.find(filter).populate("assignee", "name email isActive").sort({ updatedAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      import_Task.Task.countDocuments(filter)
    ]);
    res.json((0, import_pagination.paged)(tasks, page, limit, total));
  })
);
router.post(
  "/projects/:id/tasks",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const project = await loadProject((0, import_validate.parse)(idSchema, req.params.id));
    const user = (0, import_access.ensureUser)(req);
    (0, import_access.ensureProjectAccess)(user, project, ["PROJECT_MANAGER"]);
    (0, import_access.ensureWritable)(project);
    const body = (0, import_validate.parse)(import_zod.z.object({
      title: import_zod.z.string().trim().min(2).max(200),
      description: import_zod.z.string().max(5e3).default(""),
      status: statusSchema.default("TODO"),
      priority: prioritySchema.default("MEDIUM"),
      dueDate: import_zod.z.union([import_zod.z.null(), import_zod.z.coerce.date()]).optional(),
      assignee: import_zod.z.union([idSchema, import_zod.z.null()]).optional()
    }).strict(), req.body);
    await validateAssignee(String(project._id), body.assignee);
    const task = await import_Task.Task.create({ ...body, project: project._id, createdBy: user.id });
    res.status(201).json({ data: task });
  })
);
router.get(
  "/tasks/:id",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const { task, project } = await loadTaskAndProject((0, import_validate.parse)(idSchema, req.params.id));
    (0, import_access.ensureProjectAccess)((0, import_access.ensureUser)(req), project);
    await task.populate([
      { path: "project", select: "name status members" },
      { path: "assignee", select: "name email isActive" },
      { path: "createdBy", select: "name email" }
    ]);
    res.json({ data: task });
  })
);
router.patch("/tasks/:id", import_auth.requireAuth, (0, import_asyncHandler.asyncHandler)((req, res) => patchTask(req, res)));
router.patch("/tasks/:id/status", import_auth.requireAuth, (0, import_asyncHandler.asyncHandler)((req, res) => patchTask(req, res, true)));
router.delete(
  "/tasks/:id",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const { task, project } = await loadTaskAndProject((0, import_validate.parse)(idSchema, req.params.id));
    (0, import_access.ensureProjectAccess)((0, import_access.ensureUser)(req), project, ["PROJECT_MANAGER"]);
    (0, import_access.ensureWritable)(project);
    const session = await import_mongoose.default.startSession();
    try {
      await session.withTransaction(async () => {
        await import_Comment.Comment.deleteMany({ task: task._id }, { session });
        await import_Task.Task.deleteOne({ _id: task._id }, { session });
      });
    } finally {
      await session.endSession();
    }
    res.status(204).end();
  })
);
router.get(
  "/tasks/:id/comments",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const { task, project } = await loadTaskAndProject((0, import_validate.parse)(idSchema, req.params.id));
    (0, import_access.ensureProjectAccess)((0, import_access.ensureUser)(req), project);
    const { page, limit, skip } = listParams(req.query);
    const [comments, total] = await Promise.all([
      import_Comment.Comment.find({ task: task._id }).populate("author", "name email").sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
      import_Comment.Comment.countDocuments({ task: task._id })
    ]);
    res.json((0, import_pagination.paged)(comments, page, limit, total));
  })
);
router.post(
  "/tasks/:id/comments",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const { task, project } = await loadTaskAndProject((0, import_validate.parse)(idSchema, req.params.id));
    const user = (0, import_access.ensureUser)(req);
    (0, import_access.ensureProjectAccess)(user, project, ["PROJECT_MANAGER", "TEAM_MEMBER"]);
    (0, import_access.ensureWritable)(project);
    const body = (0, import_validate.parse)(import_zod.z.object({ body: import_zod.z.string().trim().min(1).max(3e3) }).strict(), req.body);
    const comment = await import_Comment.Comment.create({ task: task._id, author: user.id, body: body.body });
    await comment.populate("author", "name email");
    res.status(201).json({ data: comment });
  })
);
router.delete(
  "/comments/:id",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const commentId = (0, import_validate.parse)(idSchema, req.params.id);
    const comment = await import_Comment.Comment.findById(commentId);
    if (!comment) throw (0, import_errors.notFound)();
    const { project } = await loadTaskAndProject(String(comment.task));
    const user = (0, import_access.ensureUser)(req);
    const role = (0, import_access.ensureProjectAccess)(user, project);
    if (user.role !== "ADMIN" && role !== "PROJECT_MANAGER" && String(comment.author) !== user.id) throw (0, import_errors.forbidden)();
    (0, import_access.ensureWritable)(project);
    await comment.deleteOne();
    res.status(204).end();
  })
);
router.get(
  "/dashboard",
  import_auth.requireAuth,
  (0, import_asyncHandler.asyncHandler)(async (req, res) => {
    const user = (0, import_access.ensureUser)(req);
    const projects = await import_Project.Project.find(user.role === "ADMIN" ? {} : { "members.user": user.id }).select("_id name status");
    const projectIds = projects.map((project) => project._id);
    const [counts, myTasks, overdueTasks] = await Promise.all([
      import_Task.Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      import_Task.Task.find({ project: { $in: projectIds }, assignee: user.id }).populate("project", "name").sort({ dueDate: 1 }).limit(10).lean(),
      import_Task.Task.find({ project: { $in: projectIds }, dueDate: { $lt: /* @__PURE__ */ new Date() }, status: { $ne: "DONE" } }).populate("project", "name").populate("assignee", "name").sort({ dueDate: 1 }).limit(10).lean()
    ]);
    const countsByStatus = Object.fromEntries(import_Task.TASK_STATUSES.map((status) => [status, 0]));
    for (const item of counts) countsByStatus[item._id] = item.count;
    res.json({
      data: {
        counts: countsByStatus,
        myTasks,
        overdueTasks,
        recentProjects: projects.sort((a, b) => b._id.toString().localeCompare(a._id.toString())).slice(0, 6)
      }
    });
  })
);
var routes_default = router;
