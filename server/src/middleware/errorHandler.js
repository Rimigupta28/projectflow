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
var errorHandler_exports = {};
__export(errorHandler_exports, {
  errorHandler: () => errorHandler
});
module.exports = __toCommonJS(errorHandler_exports);
var import_mongoose = __toESM(require("mongoose"));
var import_errors = require("../utils/errors");
var import_env = require("../config/env");
const errorHandler = (error, _req, res, _next) => {
  if (error instanceof import_errors.AppError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message, ...error.details ? { details: error.details } : {} }
    });
    return;
  }
  if (error instanceof import_mongoose.default.Error.ValidationError || error instanceof import_mongoose.default.Error.CastError) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Request is invalid" } });
    return;
  }
  if (error.code === 11e3) {
    res.status(409).json({ error: { code: "EMAIL_EXISTS", message: "An account with this email already exists" } });
    return;
  }
  console.error("Request failed", error);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    ...import_env.env.nodeEnv === "development" ? { debug: error.message } : {}
  });
};
