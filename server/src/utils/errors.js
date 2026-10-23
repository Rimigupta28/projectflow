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
var errors_exports = {};
__export(errors_exports, {
  AppError: () => AppError,
  badRequest: () => badRequest,
  businessRule: () => businessRule,
  forbidden: () => forbidden,
  notFound: () => notFound
});
module.exports = __toCommonJS(errors_exports);
class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = "AppError";
  }
}
const badRequest = (message, details) => new AppError(400, "VALIDATION_ERROR", message, details);
const forbidden = (message = "You are not authorized to perform this action") => new AppError(403, "FORBIDDEN", message);
const notFound = (message = "Resource not found") => new AppError(404, "NOT_FOUND", message);
const businessRule = (code, message) => new AppError(422, code, message);
