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
var Task_exports = {};
__export(Task_exports, {
  TASK_PRIORITIES: () => TASK_PRIORITIES,
  TASK_STATUSES: () => TASK_STATUSES,
  Task: () => Task
});
module.exports = __toCommonJS(Task_exports);
var import_mongoose = require("mongoose");
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const taskSchema = new import_mongoose.Schema(
  {
    project: { type: import_mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
    description: { type: String, default: "", maxlength: 5e3 },
    status: { type: String, enum: TASK_STATUSES, default: "TODO", required: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: "MEDIUM", required: true },
    dueDate: { type: Date, default: null },
    assignee: { type: import_mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: import_mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    version: { type: Number, min: 1, default: 1, required: true, validate: Number.isInteger }
  },
  { timestamps: true, strict: "throw" }
);
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ title: "text", description: "text" });
const Task = import_mongoose.models.Task || (0, import_mongoose.model)("Task", taskSchema);
