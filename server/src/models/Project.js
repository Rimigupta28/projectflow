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
var Project_exports = {};
__export(Project_exports, {
  PROJECT_ROLES: () => PROJECT_ROLES,
  Project: () => Project
});
module.exports = __toCommonJS(Project_exports);
var import_mongoose = require("mongoose");
const PROJECT_ROLES = ["PROJECT_MANAGER", "TEAM_MEMBER", "VIEWER"];
const memberSchema = new import_mongoose.Schema(
  {
    user: { type: import_mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: PROJECT_ROLES, required: true },
    addedAt: { type: Date, default: Date.now, required: true }
  },
  { _id: false, strict: "throw" }
);
const projectSchema = new import_mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, default: "", maxlength: 2e3 },
    status: { type: String, enum: ["ACTIVE", "ARCHIVED"], default: "ACTIVE", required: true },
    createdBy: { type: import_mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [memberSchema], default: [] }
  },
  { timestamps: true, strict: "throw" }
);
projectSchema.index({ "members.user": 1 });
projectSchema.index({ status: 1 });
const Project = import_mongoose.models.Project || (0, import_mongoose.model)("Project", projectSchema);
