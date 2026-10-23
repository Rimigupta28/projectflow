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
var app_exports = {};
__export(app_exports, {
  default: () => app_default
});
module.exports = __toCommonJS(app_exports);
var import_express = __toESM(require("express"));
var import_cookie_parser = __toESM(require("cookie-parser"));
var import_cors = __toESM(require("cors"));
var import_helmet = __toESM(require("helmet"));
var import_morgan = __toESM(require("morgan"));
var import_env = require("./config/env");
var import_routes = __toESM(require("./routes"));
var import_errorHandler = require("./middleware/errorHandler");
const app = (0, import_express.default)();
app.disable("x-powered-by");
// Restrict credentialed browser requests to the configured Vite origin.
app.use((0, import_helmet.default)());
app.use((0, import_cors.default)({ origin: import_env.env.clientOrigin, credentials: true }));
// Keep JSON request bodies bounded and parse the HTTP-only auth cookie before routes run.
app.use(import_express.default.json({ limit: "1mb" }));
app.use((0, import_cookie_parser.default)());
app.use((0, import_morgan.default)(import_env.env.nodeEnv === "production" ? "combined" : "dev"));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", import_routes.default);
app.use((_req, res) => res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } }));
app.use(import_errorHandler.errorHandler);
var app_default = app;
