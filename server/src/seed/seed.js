var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_mongoose = __toESM(require("mongoose"));
var import_db = require("../config/db");
var import_Comment = require("../models/Comment");
var import_Project = require("../models/Project");
var import_Task = require("../models/Task");
var import_User = require("../models/User");
async function seed() {
  // Upsert demo users by email so rerunning the seed does not create duplicate accounts.
  await (0, import_db.connectDatabase)();
  const passwordHash = await import_bcryptjs.default.hash("Password@123", 12);
  const definitions = [
    { name: "Alex Admin", email: "admin@demo.com", role: "ADMIN" },
    { name: "Priya Manager", email: "pm@demo.com", role: "PROJECT_MANAGER" },
    { name: "Morgan Member", email: "member@demo.com", role: "TEAM_MEMBER" },
    { name: "Taylor Viewer", email: "viewer@demo.com", role: "VIEWER" }
  ];
  const users = /* @__PURE__ */ new Map();
  for (const definition of definitions) {
    const user = await import_User.User.findOneAndUpdate(
      { email: definition.email },
      { $set: { ...definition, passwordHash, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    users.set(definition.email, user._id);
  }
  const manager = users.get("pm@demo.com");
  const member = users.get("member@demo.com");
  const viewer = users.get("viewer@demo.com");
  const projectDefinitions = [
    { name: "Website Relaunch", description: "Plan and deliver the new product website.", members: [{ user: manager, role: "PROJECT_MANAGER" }, { user: member, role: "TEAM_MEMBER" }, { user: viewer, role: "VIEWER" }] },
    { name: "Mobile App MVP", description: "Coordinate the first release of the companion app.", members: [{ user: manager, role: "PROJECT_MANAGER" }, { user: member, role: "TEAM_MEMBER" }] }
  ];
  const projects = [];
  for (const definition of projectDefinitions) {
    const project = await import_Project.Project.findOneAndUpdate(
      { name: definition.name },
      { $set: { ...definition, status: "ACTIVE", createdBy: users.get("admin@demo.com") } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    projects.push(project);
  }
  const taskDefinitions = [
    ["Finalize landing page copy", "Review value proposition and calls to action.", "IN_PROGRESS", "HIGH", member, -2],
    ["Create design system", "Document typography, colors, and reusable components.", "IN_REVIEW", "HIGH", manager, 4],
    ["Set up analytics events", "Track key conversion steps.", "TODO", "MEDIUM", null, 7],
    ["Accessibility audit", "Check keyboard navigation and contrast.", "TODO", "HIGH", member, -1],
    ["API integration plan", "List required endpoints and response models.", "DONE", "LOW", manager, -5],
    ["Prepare app onboarding", "Draft the first-run experience.", "IN_PROGRESS", "MEDIUM", member, 3],
    ["Review release risks", "Identify dependencies and rollout risks.", "TODO", "HIGH", null, 1],
    ["Build task dashboard", "Summarize project tasks for the first release.", "IN_REVIEW", "MEDIUM", manager, 6]
  ];
  const tasks = [];
  for (let index = 0; index < taskDefinitions.length; index += 1) {
    const [title, description, status, priority, assignee, dueOffset] = taskDefinitions[index];
    const project = projects[index < 4 ? 0 : 1];
    const task = await import_Task.Task.findOneAndUpdate(
      { project: project._id, title },
      {
        $set: {
          description,
          status,
          priority,
          assignee,
          dueDate: new Date(Date.now() + Number(dueOffset) * 864e5),
          createdBy: manager
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    tasks.push(task);
  }
  const demoComments = [
    { task: tasks[0]._id, author: manager, body: "Please share the latest draft for review." },
    { task: tasks[0]._id, author: member, body: "Updated the copy and pushed a preview." },
    { task: tasks[4]._id, author: manager, body: "The integration notes are ready." }
  ];
  for (const comment of demoComments) {
    await import_Comment.Comment.findOneAndUpdate(
      { task: comment.task, author: comment.author, body: comment.body },
      { $setOnInsert: comment },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log("Seed complete. Demo password for all accounts: Password@123");
}
seed().catch((error) => {
  console.error("Seed failed", error);
  process.exitCode = 1;
}).finally(async () => {
  await import_mongoose.default.disconnect();
});
