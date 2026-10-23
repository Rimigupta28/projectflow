import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import app from "../app.js";
import { Comment } from "../models/Comment.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";

const apiApp = app.default ?? app;
let mongo;
let account;

async function resetData() {
  await Promise.all([Comment.deleteMany({}), Task.deleteMany({}), Project.deleteMany({}), User.deleteMany({})]);
  const passwordHash = await bcrypt.hash("Password@123", 4);
  const [admin, manager, member, viewer, stranger] = await User.create([
    { name: "Admin", email: "admin@example.com", role: "ADMIN", passwordHash },
    { name: "Manager", email: "pm@example.com", role: "PROJECT_MANAGER", passwordHash },
    { name: "Member", email: "member@example.com", role: "TEAM_MEMBER", passwordHash },
    { name: "Viewer", email: "viewer@example.com", role: "VIEWER", passwordHash },
    { name: "Stranger", email: "stranger@example.com", role: "TEAM_MEMBER", passwordHash },
  ]);
  const project = await Project.create({
    name: "Test Project",
    createdBy: admin._id,
    members: [
      { user: manager._id, role: "PROJECT_MANAGER" },
      { user: member._id, role: "TEAM_MEMBER" },
      { user: viewer._id, role: "VIEWER" },
    ],
  });
  const task = await Task.create({
    project: project._id,
    title: "Initial task",
    description: "Keep original description",
    createdBy: manager._id,
    assignee: member._id,
  });
  account = { admin, manager, member, viewer, stranger, project, task };
}

async function signedIn(email) {
  const agent = request.agent(apiApp);
  await agent.post("/api/auth/login").send({ email, password: "Password@123" }).expect(200);
  return agent;
}

beforeAll(async () => {
  if (process.env.TEST_MONGO_URI) {
    // An installed local replica set avoids a large first-run binary download.
    await mongoose.connect(process.env.TEST_MONGO_URI);
  } else {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }
}, 300_000);
beforeEach(resetData);
afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe("authorization and task concurrency", () => {
  it("rejects a team member deleting a task", async () => {
    const agent = await signedIn(account.member.email);
    await agent.delete(`/api/tasks/${account.task.id}`).expect(403);
    expect(await Task.exists({ _id: account.task._id })).not.toBeNull();
  });

  it("rejects viewers posting comments", async () => {
    const agent = await signedIn(account.viewer.email);
    await agent.post(`/api/tasks/${account.task.id}/comments`).send({ body: "Read-only user" }).expect(403);
    expect(await Comment.countDocuments()).toBe(0);
  });

  it("conceals projects from non-members", async () => {
    const agent = await signedIn(account.stranger.email);
    await agent.get(`/api/projects/${account.project.id}`).expect(404);
  });

  it("returns the latest task on stale writes without changing it", async () => {
    const agent = await signedIn(account.manager.email);
    await agent.patch(`/api/tasks/${account.task.id}`).send({ version: 1, title: "New title" }).expect(200);
    const stale = await agent.patch(`/api/tasks/${account.task.id}`)
      .send({ version: 1, description: "Should not overwrite" }).expect(409);
    expect(stale.body.error.code).toBe("VERSION_CONFLICT");
    expect(stale.body.current.version).toBe(2);
    expect(stale.body.current.title).toBe("New title");
    const stored = await Task.findById(account.task._id);
    expect(stored.description).toBe("Keep original description");
    expect(stored.version).toBe(2);
  });

  it("only lets team members edit their assigned task's status and description", async () => {
    const agent = await signedIn(account.member.email);
    await agent.patch(`/api/tasks/${account.task.id}`).send({ version: 1, title: "No title edit" }).expect(403);
    expect((await Task.findById(account.task._id)).title).toBe("Initial task");
    const otherTask = await Task.create({
      project: account.project._id,
      title: "Manager task",
      createdBy: account.manager._id,
      assignee: account.manager._id,
    });
    await agent.patch(`/api/tasks/${otherTask.id}/status`).send({ version: 1, status: "DONE" }).expect(403);
    expect((await Task.findById(otherTask._id)).status).toBe("TODO");
    await agent.patch(`/api/tasks/${account.task.id}`).send({ version: 1, description: "Member update", status: "IN_PROGRESS" }).expect(200);
    expect((await Task.findById(account.task._id)).description).toBe("Member update");
  });
});
