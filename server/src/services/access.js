var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var access_exports = {};
__export(access_exports, {
  ensureProjectAccess: () => ensureProjectAccess,
  ensureUser: () => ensureUser,
  ensureWritable: () => ensureWritable,
  projectRole: () => projectRole
});
module.exports = __toCommonJS(access_exports);
var import_errors = require("../utils/errors");
function projectRole(project, userId) {
  const membership = project.members.find((member) => String(member.user) === userId);
  return membership?.role;
}
function ensureProjectAccess(user, project, roles) {
  if (user.role === "ADMIN") return "ADMIN";
  const role = projectRole(project, user.id);
  if (!role) throw (0, import_errors.notFound)();
  if (roles && !roles.includes(role)) throw (0, import_errors.forbidden)();
  return role;
}
function ensureWritable(project) {
  if (project.status === "ARCHIVED") {
    throw new import_errors.AppError(422, "PROJECT_ARCHIVED", "Archived projects are read-only");
  }
}
function ensureUser(req) {
  if (!req.user) throw new import_errors.AppError(401, "UNAUTHENTICATED", "Please sign in");
  return req.user;
}
