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
var auth_exports = {};
__export(auth_exports, {
  requireAuth: () => requireAuth,
  requireGlobalRole: () => requireGlobalRole
});
module.exports = __toCommonJS(auth_exports);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_env = require("../config/env");
var import_User = require("../models/User");
var import_errors = require("../utils/errors");
async function requireAuth(req, _res, next) {
  try {
    // Reload the account on every request so deactivation takes effect immediately.
    const token = req.cookies?.token;
    if (!token) throw new import_errors.AppError(401, "UNAUTHENTICATED", "Please sign in");
    const payload = import_jsonwebtoken.default.verify(token, import_env.env.jwtSecret);
    if (typeof payload === "string" || !payload.sub) {
      throw new import_errors.AppError(401, "UNAUTHENTICATED", "Invalid session");
    }
    const user = await import_User.User.findById(payload.sub).select("name email role isActive").lean();
    if (!user || !user.isActive) throw new import_errors.AppError(401, "UNAUTHENTICATED", "Account is unavailable");
    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };
    next();
  } catch (error) {
    if (error instanceof import_errors.AppError) return next(error);
    return next(new import_errors.AppError(401, "UNAUTHENTICATED", "Invalid or expired session"));
  }
}
function requireGlobalRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new import_errors.AppError(401, "UNAUTHENTICATED", "Please sign in"));
    if (!roles.includes(req.user.role)) return next((0, import_errors.forbidden)());
    next();
  };
}
