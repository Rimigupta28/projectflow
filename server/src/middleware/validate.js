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
var validate_exports = {};
__export(validate_exports, {
  objectBody: () => objectBody,
  parse: () => parse
});
module.exports = __toCommonJS(validate_exports);
var import_zod = require("zod");
var import_errors = require("../utils/errors");
function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw (0, import_errors.badRequest)("Request is invalid", result.error.issues.map(({ path, message }) => ({ path, message })));
  }
  return result.data;
}
function objectBody(req) {
  return parse(import_zod.z.record(import_zod.z.string(), import_zod.z.unknown()), req.body);
}
