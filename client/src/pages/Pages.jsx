import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useOutletContext, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Activity, ArrowUpRight, CalendarDays, CirclePlus, LayoutGrid, List, MessageCircle, Search, UsersRound } from "lucide-react";
import { api, apiMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useProjectRole } from "../hooks/useProjectRole";
import { formatDate, initials } from "../lib/format";
const STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const statusLabel = { TODO: "To do", IN_PROGRESS: "In progress", IN_REVIEW: "In review", DONE: "Done" };
const badgeClass = {
  TODO: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  DONE: "bg-emerald-50 text-emerald-700",
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-rose-50 text-rose-700"
};
function PageTitle({ title, subtitle, action }) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-7 flex flex-wrap items-end justify-between gap-4", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: title }),
      subtitle && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-500", children: subtitle })
    ] }),
    action
  ] });
}
function LoadingCards() {
  return /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3", children: [0, 1, 2].map((item) => /* @__PURE__ */ jsx("div", { className: "h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" }, item)) });
}
function EmptyState({ title, detail, action }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-brand", children: /* @__PURE__ */ jsx(Activity, {}) }),
    /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: title }),
    /* @__PURE__ */ jsx("p", { className: "mx-auto mt-1 max-w-md text-sm text-slate-500", children: detail }),
    action && /* @__PURE__ */ jsx("div", { className: "mt-5", children: action })
  ] });
}
function StatusBadge({ value }) {
  return /* @__PURE__ */ jsx("span", { className: `inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass[value] ?? "bg-slate-100 text-slate-600"}`, children: statusLabel[value] ?? value });
}
function PriorityBadge({ value }) {
  return /* @__PURE__ */ jsx("span", { className: `inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass[value] ?? "bg-slate-100 text-slate-600"}`, children: value.toLowerCase() });
}
function DashboardPage() {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ["dashboard"], queryFn: async () => (await api.get("/dashboard")).data.data });
  if (query.isLoading) return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageTitle, { title: "Dashboard", subtitle: `Welcome back, ${user?.name}` }),
    /* @__PURE__ */ jsx(LoadingCards, {})
  ] });
  if (query.error) return /* @__PURE__ */ jsx(EmptyState, { title: "Dashboard unavailable", detail: apiMessage(query.error), action: /* @__PURE__ */ jsx("button", { className: "button-secondary", onClick: () => void query.refetch(), children: "Try again" }) });
  const data = query.data;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageTitle, { title: `Good ${(/* @__PURE__ */ new Date()).getHours() < 12 ? "morning" : "day"}, ${user?.name.split(" ")[0]}`, subtitle: "Here's what's happening across your projects." }),
    /* @__PURE__ */ jsx("div", { className: "mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: STATUSES.map((status) => /* @__PURE__ */ jsxs("div", { className: "card flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: statusLabel[status] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-bold", children: data.counts[status] ?? 0 })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-xl bg-indigo-50 p-3 text-brand", children: /* @__PURE__ */ jsx(Activity, { size: 20 }) })
    ] }, status)) }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 xl:grid-cols-[1.4fr_1fr]", children: [
      /* @__PURE__ */ jsxs("section", { className: "card", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "My tasks" }),
          /* @__PURE__ */ jsx(Link, { className: "text-sm font-medium text-brand", to: "/projects", children: "View projects" })
        ] }),
        data.myTasks.length ? /* @__PURE__ */ jsx("div", { className: "divide-y divide-slate-100", children: data.myTasks.map((task) => /* @__PURE__ */ jsxs(Link, { to: `/tasks/${task._id}`, className: "flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-medium", children: task.title }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-slate-500", children: [
              task.project?.name ?? "Project",
              " \xB7 Due ",
              formatDate(task.dueDate)
            ] })
          ] }),
          /* @__PURE__ */ jsx(StatusBadge, { value: task.status })
        ] }, task._id)) }) : /* @__PURE__ */ jsx("p", { className: "py-8 text-center text-sm text-slate-500", children: "No tasks are assigned to you yet." })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "card", children: [
        /* @__PURE__ */ jsx("h2", { className: "mb-4 font-semibold", children: "Overdue work" }),
        data.overdueTasks.length ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: data.overdueTasks.map((task) => /* @__PURE__ */ jsxs(Link, { to: `/tasks/${task._id}`, className: "block rounded-xl bg-rose-50/70 p-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: task.title }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-rose-700", children: [
            "Due ",
            formatDate(task.dueDate)
          ] })
        ] }, task._id)) }) : /* @__PURE__ */ jsx("p", { className: "py-8 text-center text-sm text-slate-500", children: "Nothing overdue. Nice work!" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "mt-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Recent projects" }),
        /* @__PURE__ */ jsx(Link, { to: "/projects", className: "text-sm font-medium text-brand", children: "All projects" })
      ] }),
      data.recentProjects.length ? /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: data.recentProjects.map((project) => /* @__PURE__ */ jsxs(Link, { to: `/projects/${project._id}`, className: "card transition hover:-translate-y-0.5 hover:border-indigo-200", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-start justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-xl bg-indigo-50 p-2.5 text-brand", children: /* @__PURE__ */ jsx(Activity, { size: 20 }) }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500", children: [
            project.members?.length ?? 0,
            " members"
          ] })
        ] }),
        /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: project.name }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 line-clamp-2 text-sm text-slate-500", children: project.description })
      ] }, project._id)) }) : /* @__PURE__ */ jsx(EmptyState, { title: "No projects yet", detail: "When you join or create a project, it will appear here." })
    ] })
  ] });
}
function ProjectsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const projects = useQuery({ queryKey: ["projects"], queryFn: async () => (await api.get("/projects", { params: { limit: 100 } })).data.data });
  const users = useQuery({ queryKey: ["users", "managers"], enabled: user?.role === "ADMIN" && createOpen, queryFn: async () => (await api.get("/users", { params: { limit: 100, role: "PROJECT_MANAGER", isActive: true } })).data.data });
  const create = useMutation({
    mutationFn: (input) => api.post("/projects", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["projects"] });
      setCreateOpen(false);
      success("Project created.");
    },
    onError: (failure) => error(apiMessage(failure))
  });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageTitle, { title: "Projects", subtitle: "Keep teams aligned and move important work forward.", action: user?.role === "ADMIN" && /* @__PURE__ */ jsxs("button", { className: "button-primary", onClick: () => setCreateOpen(true), children: [
      /* @__PURE__ */ jsx(CirclePlus, { size: 17 }),
      "New project"
    ] }) }),
    projects.isLoading ? /* @__PURE__ */ jsx(LoadingCards, {}) : projects.error ? /* @__PURE__ */ jsx(EmptyState, { title: "Projects could not be loaded", detail: apiMessage(projects.error), action: /* @__PURE__ */ jsx("button", { className: "button-secondary", onClick: () => void projects.refetch(), children: "Retry" }) }) : projects.data?.length ? /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: projects.data.map((project) => /* @__PURE__ */ jsxs(Link, { className: "card group transition hover:-translate-y-0.5 hover:border-indigo-200", to: `/projects/${project._id}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-5 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-brand", children: /* @__PURE__ */ jsx(BriefcaseIcon, {}) }),
        /* @__PURE__ */ jsx("span", { className: `rounded-full px-2.5 py-1 text-xs font-semibold ${project.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`, children: project.status.toLowerCase() })
      ] }),
      /* @__PURE__ */ jsx("h2", { className: "font-semibold group-hover:text-brand", children: project.name }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 min-h-10 text-sm text-slate-500", children: project.description || "No project description" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500", children: [
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(UsersRound, { size: 14 }),
          project.members?.length ?? 0,
          " members"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
          "Open project ",
          /* @__PURE__ */ jsx(ArrowUpRight, { size: 14 })
        ] })
      ] })
    ] }, project._id)) }) : /* @__PURE__ */ jsx(EmptyState, { title: "No projects available", detail: user?.role === "ADMIN" ? "Create a project to get your team started." : "Ask a project manager or admin to add you to a project.", action: user?.role === "ADMIN" && /* @__PURE__ */ jsx("button", { className: "button-primary", onClick: () => setCreateOpen(true), children: "Create project" }) }),
    createOpen && /* @__PURE__ */ jsx(Modal, { title: "Create project", onClose: () => setCreateOpen(false), children: /* @__PURE__ */ jsx(ProjectCreateForm, { users: users.data ?? [], loading: users.isLoading, busy: create.isPending, onSubmit: (value) => create.mutate(value) }) })
  ] });
}
function BriefcaseIcon() {
  return /* @__PURE__ */ jsx(Activity, { size: 20 });
}
function Modal({ title, onClose, children }) {
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-40 grid place-items-center bg-slate-900/40 p-4", onMouseDown: (event) => {
    if (event.target === event.currentTarget) onClose();
  }, children: /* @__PURE__ */ jsxs("section", { role: "dialog", "aria-modal": "true", "aria-label": title, className: "w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-5 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: title }),
      /* @__PURE__ */ jsx("button", { className: "text-slate-500", "aria-label": "Close dialog", onClick: onClose, children: "\xD7" })
    ] }),
    children
  ] }) });
}
function ProjectCreateForm({ users, loading, busy, onSubmit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectManagerId, setProjectManagerId] = useState("");
  return /* @__PURE__ */ jsxs("form", { className: "space-y-4", onSubmit: (event) => {
    event.preventDefault();
    onSubmit({ name, description, projectManagerId });
  }, children: [
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
      "Project name",
      /* @__PURE__ */ jsx("input", { required: true, minLength: 2, maxLength: 120, className: "field-input", value: name, onChange: (event) => setName(event.target.value) })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
      "Description",
      /* @__PURE__ */ jsx("textarea", { maxLength: 2e3, rows: 3, className: "field-input", value: description, onChange: (event) => setDescription(event.target.value) })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
      "Project manager",
      /* @__PURE__ */ jsxs("select", { required: true, className: "field-input", value: projectManagerId, onChange: (event) => setProjectManagerId(event.target.value), children: [
        /* @__PURE__ */ jsx("option", { value: "", children: loading ? "Loading managers..." : "Choose a project manager" }),
        users.map((person) => /* @__PURE__ */ jsxs("option", { value: person.id, children: [
          person.name,
          " (",
          person.email,
          ")"
        ] }, person.id))
      ] })
    ] }),
    /* @__PURE__ */ jsx("button", { className: "button-primary w-full", disabled: busy || loading || !users.length, children: busy ? "Creating..." : "Create project" })
  ] });
}
function ProjectFrame() {
  const { id } = useParams();
  const projectQuery = useQuery({ queryKey: ["project", id], queryFn: async () => (await api.get(`/projects/${id}`)).data.data, enabled: Boolean(id) });
  if (projectQuery.isLoading) return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageTitle, { title: "Project" }),
    /* @__PURE__ */ jsx(LoadingCards, {})
  ] });
  if (projectQuery.error || !projectQuery.data) return /* @__PURE__ */ jsx(EmptyState, { title: "Project unavailable", detail: apiMessage(projectQuery.error), action: /* @__PURE__ */ jsx(Link, { to: "/projects", className: "button-secondary", children: "Back to projects" }) });
  const project = projectQuery.data;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx(Link, { to: "/projects", className: "text-sm text-slate-500 hover:text-brand", children: "Projects" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: project.name }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-500", children: project.description })
        ] }),
        /* @__PURE__ */ jsx("span", { className: `rounded-full px-3 py-1.5 text-xs font-semibold ${project.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`, children: project.status === "ACTIVE" ? "Active" : "Archived" })
      ] })
    ] }),
    project.status === "ARCHIVED" && /* @__PURE__ */ jsx("div", { className: "mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900", children: "This project is archived and read-only." }),
    /* @__PURE__ */ jsxs("div", { className: "mb-5 flex gap-1 border-b border-slate-200", children: [
      /* @__PURE__ */ jsx(ProjectTab, { to: "tasks", label: "Tasks" }),
      /* @__PURE__ */ jsx(ProjectTab, { to: "team", label: "Team" }),
      /* @__PURE__ */ jsx(ProjectTab, { to: "settings", label: "Settings" })
    ] }),
    /* @__PURE__ */ jsx(Outlet, { context: { project } })
  ] });
}
function ProjectTab({ to, label }) {
  return /* @__PURE__ */ jsx(NavLink, { to, className: ({ isActive }) => `border-b-2 px-4 py-2.5 text-sm font-medium ${isActive ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-ink"}`, children: label });
}
function ProjectIndex() {
  const { id } = useParams();
  return /* @__PURE__ */ jsx(Navigate, { to: `/projects/${id}/tasks`, replace: true });
}
function ProjectTasksPage() {
  const { id } = useParams();
  const { project } = useProjectOutlet();
  const { role, can } = useProjectRole(project);
  const { user } = useAuth();
  const { success, error } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [layout, setLayout] = useState("board");
  const [createOpen, setCreateOpen] = useState(false);
  const [kanbanConflict, setKanbanConflict] = useState(null);
  const queryKey = ["tasks", id, status, priority, assignee, search, page];
  const teamQuery = useQuery({ queryKey: ["members", id], queryFn: async () => (await api.get(`/projects/${id}/members`)).data.data });
  const tasksQuery = useQuery({ queryKey, queryFn: async () => (await api.get(`/projects/${id}/tasks`, { params: { status: status || void 0, priority: priority || void 0, assignee: assignee || void 0, search: search || void 0, page, limit: 12 } })).data });
  const create = useMutation({
    mutationFn: (input) => api.post(`/projects/${id}/tasks`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tasks", id] });
      setCreateOpen(false);
      success("Task created.");
    },
    onError: (failure) => error(apiMessage(failure))
  });
  const updateStatus = useMutation({
    mutationFn: ({ task, nextStatus }) => api.patch(`/tasks/${task._id}/status`, { version: task.version, status: nextStatus }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tasks", id] });
      success("Task status updated.");
    },
    onError: (failure, variables) => {
      void qc.invalidateQueries({ queryKey: ["tasks", id] });
      if (axios.isAxiosError(failure) && failure.response?.status === 409 && failure.response.data.current) {
        setKanbanConflict({ task: failure.response.data.current, nextStatus: variables.nextStatus });
      } else error(apiMessage(failure));
    }
  });
  const tasks = tasksQuery.data?.data ?? [];
  const byStatus = useMemo(() => Object.fromEntries(STATUSES.map((value) => [value, tasks.filter((task) => task.status === value)])), [tasks]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-5 flex flex-wrap items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Project tasks" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-slate-500", children: [
          tasksQuery.data?.meta.total ?? 0,
          " tasks"
        ] })
      ] }),
      can("write") && project.status === "ACTIVE" && /* @__PURE__ */ jsxs("button", { className: "button-primary", onClick: () => setCreateOpen(true), children: [
        /* @__PURE__ */ jsx(CirclePlus, { size: 16 }),
        "New task"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-5 flex flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxs("label", { className: "relative min-w-48 flex-1", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-2.5 text-slate-400", size: 17 }),
        /* @__PURE__ */ jsx("input", { "aria-label": "Search tasks", className: "field-input pl-9", placeholder: "Search tasks...", value: search, onChange: (event) => { setSearch(event.target.value); setPage(1); } })
      ] }),
      /* @__PURE__ */ jsxs("select", { className: "field-input w-auto min-w-40", "aria-label": "Filter by status", value: status, onChange: (event) => { setStatus(event.target.value); setPage(1); }, children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "All statuses" }),
        STATUSES.map((value) => /* @__PURE__ */ jsx("option", { value, children: statusLabel[value] }, value))
      ] }),
      /* @__PURE__ */ jsxs("select", { className: "field-input w-auto min-w-36", "aria-label": "Filter by priority", value: priority, onChange: (event) => { setPriority(event.target.value); setPage(1); }, children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "All priorities" }),
        /* @__PURE__ */ jsx("option", { value: "LOW", children: "Low" }),
        /* @__PURE__ */ jsx("option", { value: "MEDIUM", children: "Medium" }),
        /* @__PURE__ */ jsx("option", { value: "HIGH", children: "High" })
      ] }),
      /* @__PURE__ */ jsxs("select", { className: "field-input w-auto min-w-40", "aria-label": "Filter by assignee", value: assignee, onChange: (event) => { setAssignee(event.target.value); setPage(1); }, children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "All assignees" }),
        (teamQuery.data ?? []).map((entry) => {
          const person = entry.user;
          return /* @__PURE__ */ jsx("option", { value: person._id ?? person.id, children: person.name }, person._id ?? person.id);
        })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex rounded-xl border border-slate-200 bg-white p-1", children: [
        /* @__PURE__ */ jsx("button", { className: `rounded-lg p-2 ${layout === "board" ? "bg-indigo-50 text-brand" : "text-slate-500"}`, "aria-label": "Kanban board", onClick: () => setLayout("board"), children: /* @__PURE__ */ jsx(LayoutGrid, { size: 17 }) }),
        /* @__PURE__ */ jsx("button", { className: `rounded-lg p-2 ${layout === "table" ? "bg-indigo-50 text-brand" : "text-slate-500"}`, "aria-label": "Table view", onClick: () => setLayout("table"), children: /* @__PURE__ */ jsx(List, { size: 17 }) })
      ] })
    ] }),
    tasksQuery.isLoading ? /* @__PURE__ */ jsx(LoadingCards, {}) : tasksQuery.error ? /* @__PURE__ */ jsx(EmptyState, { title: "Tasks unavailable", detail: apiMessage(tasksQuery.error), action: /* @__PURE__ */ jsx("button", { className: "button-secondary", onClick: () => void tasksQuery.refetch(), children: "Retry" }) }) : tasks.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { title: "No tasks found", detail: search || status || priority || assignee ? "Try changing or clearing your filters." : "Create a task to start tracking work in this project.", action: search || status || priority || assignee ? /* @__PURE__ */ jsx("button", { className: "button-secondary", onClick: () => {
      setSearch("");
      setStatus("");
      setPriority("");
      setAssignee("");
      setPage(1);
    }, children: "Clear filters" }) : can("write") && /* @__PURE__ */ jsx("button", { className: "button-primary", onClick: () => setCreateOpen(true), children: "Create task" }) }) : layout === "table" ? /* @__PURE__ */ jsx(TaskTable, { tasks }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 xl:grid-cols-4", children: STATUSES.map((value) => /* @__PURE__ */ jsxs("section", { className: "min-h-52 rounded-2xl bg-slate-100/70 p-3", onDragOver: (event) => event.preventDefault(), onDrop: (event) => {
      event.preventDefault();
      const task = tasks.find((item) => item._id === event.dataTransfer.getData("text/task-id"));
      const assignedToMe = task && String(task.assignee?._id ?? task.assignee?.id ?? task.assignee ?? "") === user?.id;
      if (task && task.status !== value && (can("write") || (role === "TEAM_MEMBER" && assignedToMe))) updateStatus.mutate({ task, nextStatus: value });
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between px-1", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold", children: statusLabel[value] }),
        /* @__PURE__ */ jsx("span", { className: "rounded-full bg-white px-2 py-0.5 text-xs text-slate-500", children: byStatus[value].length })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-3", children: byStatus[value].map((task) => {
        const assignedToMe = String(task.assignee?._id ?? task.assignee?.id ?? task.assignee ?? "") === user?.id;
        return /* @__PURE__ */ jsx(TaskCard, { task, draggable: (can("write") || (role === "TEAM_MEMBER" && assignedToMe)) && project.status === "ACTIVE" }, task._id);
      }) })
    ] }, value)) }),
    tasksQuery.data?.meta.total > 12 && /* @__PURE__ */ jsxs("div", { className: "mt-5 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: `Page ${page} of ${Math.ceil(tasksQuery.data.meta.total / 12)}` }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { className: "button-secondary", disabled: page <= 1, onClick: () => setPage((value) => Math.max(1, value - 1)), children: "Previous" }),
        /* @__PURE__ */ jsx("button", { className: "button-secondary", disabled: page >= Math.ceil(tasksQuery.data.meta.total / 12), onClick: () => setPage((value) => value + 1), children: "Next" })
      ] })
    ] }),
    kanbanConflict && <Modal title="This task was updated by someone else" onClose={() => setKanbanConflict(null)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-indigo-50 p-3"><p className="mb-2 text-xs font-bold uppercase text-indigo-700">My changes</p><p className="text-sm">Status: {statusLabel[kanbanConflict.nextStatus] ?? "Moved"}</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="mb-2 text-xs font-bold uppercase text-slate-500">Latest values · version {kanbanConflict.task.version}</p><p className="text-sm">Status: {statusLabel[kanbanConflict.task.status]}</p></div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="button-secondary" onClick={() => { setKanbanConflict(null); void qc.invalidateQueries({ queryKey: ["tasks", id] }); }}>Use latest</button>
        <button className="button-primary" onClick={() => { const nextStatus = kanbanConflict.nextStatus; const latest = { ...kanbanConflict.task, project: id }; setKanbanConflict(null); updateStatus.mutate({ task: latest, nextStatus }); }}>Reapply my changes</button>
      </div>
    </Modal>,
    createOpen && /* @__PURE__ */ jsx(Modal, { title: "Create task", onClose: () => setCreateOpen(false), children: /* @__PURE__ */ jsx(TaskCreateForm, { busy: create.isPending, members: teamQuery.data ?? [], onSubmit: (input) => create.mutate(input) }) })
  ] });
}
function TaskCard({ task, draggable }) {
  const assignee = task.assignee && typeof task.assignee === "object" ? task.assignee : null;
  const overdue = task.dueDate && new Date(task.dueDate) < /* @__PURE__ */ new Date() && task.status !== "DONE";
  return /* @__PURE__ */ jsxs(Link, { draggable, onDragStart: (event) => event.dataTransfer.setData("text/task-id", task._id), to: `/tasks/${task._id}`, className: "block rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-200 hover:shadow", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-start justify-between gap-2", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: task.title }),
      /* @__PURE__ */ jsx(PriorityBadge, { value: task.priority })
    ] }),
    task.description && /* @__PURE__ */ jsx("p", { className: "mb-3 line-clamp-2 text-xs text-slate-500", children: task.description }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 text-xs", children: [
      /* @__PURE__ */ jsxs("span", { className: `flex items-center gap-1 ${overdue ? "font-medium text-rose-600" : "text-slate-500"}`, children: [
        /* @__PURE__ */ jsx(CalendarDays, { size: 13 }),
        formatDate(task.dueDate)
      ] }),
      /* @__PURE__ */ jsx("span", { title: assignee?.name ?? "Unassigned", className: "grid h-7 w-7 place-items-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700", children: assignee?.name ? initials(assignee.name) : "\u2014" })
    ] })
  ] });
}
function TaskTable({ tasks }) {
  return /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-2xl border border-slate-200 bg-white", children: [
    /* @__PURE__ */ jsxs("div", { className: "hidden grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid", children: [
      /* @__PURE__ */ jsx("span", { children: "Task" }),
      /* @__PURE__ */ jsx("span", { children: "Status" }),
      /* @__PURE__ */ jsx("span", { children: "Priority" }),
      /* @__PURE__ */ jsx("span", { children: "Due date" })
    ] }),
    tasks.map((task) => /* @__PURE__ */ jsxs(Link, { to: `/tasks/${task._id}`, className: "grid gap-2 border-b border-slate-100 px-5 py-4 last:border-0 hover:bg-slate-50 sm:grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr] sm:items-center sm:gap-4", children: [
      /* @__PURE__ */ jsx("span", { className: "font-medium", children: task.title }),
      /* @__PURE__ */ jsx(StatusBadge, { value: task.status }),
      /* @__PURE__ */ jsx(PriorityBadge, { value: task.priority }),
      /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-500", children: formatDate(task.dueDate) })
    ] }, task._id))
  ] });
}
function TaskCreateForm({ busy, members, onSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  return /* @__PURE__ */ jsxs("form", { className: "space-y-4", onSubmit: (event) => {
    event.preventDefault();
    onSubmit({ title, description, priority, assignee: assignee || null, dueDate: dueDate || null });
  }, children: [
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
      "Task title",
      /* @__PURE__ */ jsx("input", { className: "field-input", required: true, minLength: 2, maxLength: 200, value: title, onChange: (event) => setTitle(event.target.value) })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
      "Description",
      /* @__PURE__ */ jsx("textarea", { rows: 4, maxLength: 5e3, className: "field-input", value: description, onChange: (event) => setDescription(event.target.value) })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
      "Priority",
      /* @__PURE__ */ jsxs("select", { className: "field-input", value: priority, onChange: (event) => setPriority(event.target.value), children: [
        /* @__PURE__ */ jsx("option", { children: "LOW" }),
        /* @__PURE__ */ jsx("option", { children: "MEDIUM" }),
        /* @__PURE__ */ jsx("option", { children: "HIGH" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
      "Assignee",
      /* @__PURE__ */ jsxs("select", { className: "field-input", value: assignee, onChange: (event) => setAssignee(event.target.value), children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "Unassigned" }),
        ...members.map((entry) => {
          const person = entry.user;
          return /* @__PURE__ */ jsx("option", { value: person._id ?? person.id, children: `${person.name} (${person.email})` }, person._id ?? person.id);
        })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
      "Due date",
      /* @__PURE__ */ jsx("input", { className: "field-input", type: "date", value: dueDate, onChange: (event) => setDueDate(event.target.value) })
    ] }),
    /* @__PURE__ */ jsx("button", { className: "button-primary w-full", disabled: busy, children: busy ? "Saving..." : "Create task" })
  ] });
}
function useProjectOutlet() {
  return useOutletContext();
}
function ProjectTeamPage() {
  const { id } = useParams();
  const { project } = useProjectOutlet();
  const { can } = useProjectRole(project);
  const { success, error } = useToast();
  const qc = useQueryClient();
  const members = useQuery({ queryKey: ["members", id], queryFn: async () => (await api.get(`/projects/${id}/members`)).data.data });
  const availableUsers = useQuery({ queryKey: ["available-members", id], enabled: can("manage"), queryFn: async () => (await api.get(`/projects/${id}/available-members`)).data.data });
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("TEAM_MEMBER");
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["members", id] });
    void qc.invalidateQueries({ queryKey: ["project", id] });
  };
  const add = useMutation({ mutationFn: () => api.post(`/projects/${id}/members`, { userId, role }), onSuccess: () => {
    invalidate();
    setUserId("");
    success("Team member added.");
  }, onError: (failure) => error(apiMessage(failure)) });
  const changeRole = useMutation({ mutationFn: ({ memberId, value }) => api.patch(`/projects/${id}/members/${memberId}`, { role: value }), onSuccess: () => {
    invalidate();
    success("Project role updated.");
  }, onError: (failure) => {
    invalidate();
    error(apiMessage(failure));
  } });
  const remove = useMutation({ mutationFn: (memberId) => api.delete(`/projects/${id}/members/${memberId}`), onSuccess: () => {
    invalidate();
    success("Member removed.");
  }, onError: (failure) => error(apiMessage(failure)) });
  const data = members.data;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "mb-5 flex flex-wrap items-end justify-between gap-3", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Project team" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-slate-500", children: [
        data?.length ?? 0,
        " members"
      ] })
    ] }) }),
    can("manage") && project.status === "ACTIVE" && /* @__PURE__ */ jsxs("form", { className: "mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4", onSubmit: (event) => {
      event.preventDefault();
      add.mutate();
    }, children: [
      /* @__PURE__ */ jsx("label", { className: "sr-only", htmlFor: "member-id", children: "Team member" }),
      /* @__PURE__ */ jsxs("select", { id: "member-id", className: "field-input min-w-64 flex-1", value: userId, onChange: (event) => setUserId(event.target.value), required: true, children: [
        /* @__PURE__ */ jsx("option", { value: "", children: availableUsers.isLoading ? "Loading users..." : "Choose an active user" }),
        ...(availableUsers.data ?? []).map((person) => /* @__PURE__ */ jsx("option", { value: person.id, children: `${person.name} (${person.email})` }, person.id))
      ] }),
      /* @__PURE__ */ jsxs("select", { className: "field-input w-auto", value: role, onChange: (event) => setRole(event.target.value), children: [
        /* @__PURE__ */ jsx("option", { children: "TEAM_MEMBER" }),
        /* @__PURE__ */ jsx("option", { children: "VIEWER" }),
        /* @__PURE__ */ jsx("option", { children: "PROJECT_MANAGER" })
      ] }),
      /* @__PURE__ */ jsx("button", { className: "button-primary", disabled: add.isPending, children: "Add member" })
    ] }),
    members.isLoading ? /* @__PURE__ */ jsx(LoadingCards, {}) : members.error ? /* @__PURE__ */ jsx(EmptyState, { title: "Team unavailable", detail: apiMessage(members.error) }) : !data?.length ? /* @__PURE__ */ jsx(EmptyState, { title: "No team members", detail: "Add a project manager or teammates to collaborate." }) : /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-2xl border border-slate-200 bg-white", children: data.map((entry) => {
      const person = entry.user;
      const memberId = String(person._id ?? person.id);
      return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 last:border-0", children: [
        /* @__PURE__ */ jsx("span", { className: "grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700", children: initials(person.name) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-40 flex-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: person.name }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: person.email })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "hidden text-xs text-slate-400 sm:block", children: person.role?.replaceAll("_", " ") }),
        can("manage") && project.status === "ACTIVE" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("select", { "aria-label": `Project role for ${person.name}`, className: "field-input w-auto py-2 text-xs", value: entry.role, onChange: (event) => changeRole.mutate({ memberId, value: event.target.value }), children: [
            /* @__PURE__ */ jsx("option", { children: "PROJECT_MANAGER" }),
            /* @__PURE__ */ jsx("option", { children: "TEAM_MEMBER" }),
            /* @__PURE__ */ jsx("option", { children: "VIEWER" })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "button-danger", onClick: () => {
            if (window.confirm(`Remove ${person.name} from this project?`)) remove.mutate(memberId);
          }, children: "Remove" })
        ] }) : /* @__PURE__ */ jsx("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600", children: entry.role.replaceAll("_", " ") })
      ] }, memberId);
    }) })
  ] });
}
function ProjectSettingsPage() {
  const { id } = useParams();
  const { project } = useProjectOutlet();
  const { user } = useAuth();
  const { can } = useProjectRole(project);
  const { success, error } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const update = useMutation({ mutationFn: () => api.patch(`/projects/${id}`, { name, description }), onSuccess: () => {
    void qc.invalidateQueries({ queryKey: ["project", id] });
    success("Project settings saved.");
  }, onError: (failure) => error(apiMessage(failure)) });
  const archive = useMutation({ mutationFn: () => api.post(`/projects/${id}/archive`), onSuccess: () => {
    void qc.invalidateQueries({ queryKey: ["project", id] });
    void qc.invalidateQueries({ queryKey: ["projects"] });
    success("Project archived.");
  }, onError: (failure) => error(apiMessage(failure)) });
  const deleteProject = useMutation({ mutationFn: () => api.delete(`/projects/${id}`), onSuccess: () => {
    void qc.invalidateQueries({ queryKey: ["projects"] });
    window.location.assign("/projects");
  }, onError: (failure) => error(apiMessage(failure)) });
  return /* @__PURE__ */ jsxs("div", { className: "grid gap-5 lg:grid-cols-2", children: [
    /* @__PURE__ */ jsxs("section", { className: "card", children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-4 font-semibold", children: "Project details" }),
      /* @__PURE__ */ jsxs("form", { className: "space-y-4", onSubmit: (event) => {
        event.preventDefault();
        update.mutate();
      }, children: [
        /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
          "Project name",
          /* @__PURE__ */ jsx("input", { className: "field-input", value: name, onChange: (event) => setName(event.target.value), disabled: !can("manage") || project.status !== "ACTIVE" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
          "Description",
          /* @__PURE__ */ jsx("textarea", { className: "field-input", rows: 4, value: description, onChange: (event) => setDescription(event.target.value), disabled: !can("manage") || project.status !== "ACTIVE" })
        ] }),
        can("manage") && project.status === "ACTIVE" && /* @__PURE__ */ jsx("button", { className: "button-primary", disabled: update.isPending, children: "Save changes" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "card", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Project status" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-500", children: project.status === "ACTIVE" ? "Archiving makes this project read-only but keeps its history." : "This project is archived and cannot be changed." }),
      user?.role === "ADMIN" && project.status === "ACTIVE" && /* @__PURE__ */ jsx("button", { className: "button-secondary mt-4", onClick: () => {
        if (window.confirm("Archive this project? It will become read-only.")) archive.mutate();
      }, children: "Archive project" }),
      user?.role === "ADMIN" && /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-rose-100 pt-5", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-rose-700", children: "Delete project" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-500", children: "This permanently deletes the project, tasks, and comments." }),
        /* @__PURE__ */ jsx("button", { className: "button-danger mt-3", onClick: () => {
          if (window.confirm("Permanently delete this project and all its tasks/comments?")) deleteProject.mutate();
        }, children: "Delete project" })
      ] })
    ] })
  ] });
}
function TaskDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { success, error } = useToast();
  const { user } = useAuth();
  const taskQuery = useQuery({ queryKey: ["task", id], queryFn: async () => (await api.get(`/tasks/${id}`)).data.data });
  const [draft, setDraft] = useState(null);
  const [conflict, setConflict] = useState(null);
  const task = taskQuery.data;
  const { role, can } = useProjectRole(task?.project);
  const taskMembers = useQuery({
    queryKey: ["members", task?.project?._id ?? task?.project],
    enabled: Boolean(task && can("write")),
    queryFn: async () => (await api.get(`/projects/${task.project._id ?? task.project}/members`)).data.data
  });
  const commentsQuery = useQuery({ queryKey: ["comments", id], enabled: Boolean(task), queryFn: async () => (await api.get(`/tasks/${id}/comments`, { params: { limit: 100 } })).data.data });
  const update = async (changes2, version) => {
    try {
      const result = await api.patch(`/tasks/${id}`, { ...changes2, version });
      await qc.setQueryData(["task", id], { ...result.data.data, project: task.project });
      setDraft(null);
      setConflict(null);
      success("Task updated.");
      void qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch (failure) {
      if (axios.isAxiosError(failure) && failure.response?.status === 409 && failure.response.data.current) {
        setConflict({ current: { ...failure.response.data.current, project: task.project }, changes: changes2 });
      } else error(apiMessage(failure));
    }
  };
  const postComment = useMutation({ mutationFn: (body) => api.post(`/tasks/${id}/comments`, { body }), onSuccess: () => {
    void qc.invalidateQueries({ queryKey: ["comments", id] });
    success("Comment added.");
  }, onError: (failure) => error(apiMessage(failure)) });
  const removeComment = useMutation({ mutationFn: (commentId) => api.delete(`/comments/${commentId}`), onSuccess: () => {
    void qc.invalidateQueries({ queryKey: ["comments", id] });
    success("Comment deleted.");
  }, onError: (failure) => error(apiMessage(failure)) });
  const removeTask = useMutation({ mutationFn: () => api.delete(`/tasks/${id}`), onSuccess: () => {
    void qc.invalidateQueries({ queryKey: ["tasks"] });
    window.location.assign("/projects");
  }, onError: (failure) => error(apiMessage(failure)) });
  if (taskQuery.isLoading) return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageTitle, { title: "Task" }),
    /* @__PURE__ */ jsx(LoadingCards, {})
  ] });
  if (!task || taskQuery.error) return /* @__PURE__ */ jsx(EmptyState, { title: "Task unavailable", detail: apiMessage(taskQuery.error) });
  const assignee = task.assignee && typeof task.assignee === "object" ? task.assignee : null;
  const assigneeId = String(assignee?._id ?? assignee?.id ?? task.assignee ?? "");
  const canEdit = projectStatus(task) === "ACTIVE" && (can("write") || (role === "TEAM_MEMBER" && assigneeId === user?.id));
  const projectName = task.project?.name;
  const changes = draft ?? (can("write")
    ? { title: task.title, description: task.description, status: task.status, priority: task.priority, dueDate: task.dueDate?.slice(0, 10) ?? "", assignee: assigneeId }
    : { status: task.status, description: task.description });
  const changedFields = Object.keys(changes).filter((key) => key === "assignee"
    ? changes[key] !== assigneeId
    : key === "dueDate"
      ? (changes[key] || "") !== (task.dueDate?.slice(0, 10) ?? "")
      : (changes[key] ?? "") !== (task[key] ?? ""));
  const save = () => {
    const payload = Object.fromEntries(changedFields.map((key) => [key, changes[key]]));
    if (Object.keys(payload).length) void update(payload, task.version);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4 text-sm text-slate-500", children: [
      /* @__PURE__ */ jsx(Link, { to: "/projects", className: "hover:text-brand", children: "Projects" }),
      " / ",
      projectName ?? "Project",
      " / Task"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 xl:grid-cols-[1fr_340px]", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("section", { className: "card", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-3 flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsx(StatusBadge, { value: task.status }),
            /* @__PURE__ */ jsx(PriorityBadge, { value: task.priority }),
            /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600", children: [
              "Version ",
              task.version
            ] })
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: task.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600", children: task.description || "No description provided." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Assignee" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm font-medium", children: assignee?.name ?? "Unassigned" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Due date" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm font-medium", children: formatDate(task.dueDate) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "card mt-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(MessageCircle, { size: 18, className: "text-brand" }),
            /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Comments" })
          ] }),
          commentsQuery.data?.length ? /* @__PURE__ */ jsx("div", { className: "mb-5 space-y-4", children: commentsQuery.data.map((comment) => /* @__PURE__ */ jsxs("article", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700", children: initials(comment.author.name) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 rounded-xl bg-slate-50 p-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-3", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: comment.author.name }),
                /* @__PURE__ */ jsx("time", { className: "text-xs text-slate-400", children: formatDate(comment.createdAt) })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 whitespace-pre-wrap text-sm text-slate-600", children: comment.body }),
              (can("manage") || String(comment.author._id ?? comment.author.id) === user?.id) && projectStatus(task) === "ACTIVE" && /* @__PURE__ */ jsx("button", { className: "mt-2 text-xs font-medium text-rose-700 hover:underline", onClick: () => {
                if (window.confirm("Delete this comment?")) removeComment.mutate(comment._id);
              }, children: "Delete comment" })
            ] })
          ] }, comment._id)) }) : /* @__PURE__ */ jsx("p", { className: "mb-4 text-sm text-slate-500", children: "No comments yet." }),
          can("comment") && projectStatus(task) === "ACTIVE" ? /* @__PURE__ */ jsx(CommentForm, { busy: postComment.isPending, onSubmit: (body) => postComment.mutate(body) }) : /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Comments are read-only for your role or this archived project." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "card h-fit", children: [
        /* @__PURE__ */ jsx("h2", { className: "mb-4 font-semibold", children: "Task details" }),
        can("write") && /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
          "Title",
          /* @__PURE__ */ jsx("input", { className: "field-input", disabled: projectStatus(task) !== "ACTIVE", value: String(changes.title ?? ""), onChange: (event) => setDraft({ ...changes, title: event.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
          "Status",
          /* @__PURE__ */ jsxs("select", { className: "field-input", disabled: !canEdit, value: String(changes.status), onChange: (event) => setDraft({ ...changes, status: event.target.value }), children: [
            /* @__PURE__ */ jsx("option", { value: "TODO", children: "To do" }),
            /* @__PURE__ */ jsx("option", { value: "IN_PROGRESS", children: "In progress" }),
            /* @__PURE__ */ jsx("option", { value: "IN_REVIEW", children: "In review" }),
            /* @__PURE__ */ jsx("option", { value: "DONE", children: "Done" })
          ] })
        ] }),
        can("write") && /* @__PURE__ */ jsxs("label", { className: "field-label mt-4", children: [
          "Priority",
          /* @__PURE__ */ jsxs("select", { className: "field-input", disabled: projectStatus(task) !== "ACTIVE", value: String(changes.priority), onChange: (event) => setDraft({ ...changes, priority: event.target.value }), children: [
            /* @__PURE__ */ jsx("option", { value: "LOW", children: "Low" }),
            /* @__PURE__ */ jsx("option", { value: "MEDIUM", children: "Medium" }),
            /* @__PURE__ */ jsx("option", { value: "HIGH", children: "High" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "field-label mt-4", children: [
          "Description",
          /* @__PURE__ */ jsx("textarea", { className: "field-input", disabled: !canEdit, rows: 5, value: String(changes.description ?? ""), onChange: (event) => setDraft({ ...changes, description: event.target.value }) })
        ] }),
        can("write") && /* @__PURE__ */ jsxs("label", { className: "field-label mt-4", children: [
          "Assignee",
          /* @__PURE__ */ jsxs("select", { className: "field-input", disabled: projectStatus(task) !== "ACTIVE", value: String(changes.assignee ?? ""), onChange: (event) => setDraft({ ...changes, assignee: event.target.value || null }), children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Unassigned" }),
            (taskMembers.data ?? []).map((entry) => {
              const person = entry.user;
              return /* @__PURE__ */ jsx("option", { value: person._id ?? person.id, children: person.name }, person._id ?? person.id);
            })
          ] })
        ] }),
        can("write") && /* @__PURE__ */ jsxs("label", { className: "field-label mt-4", children: [
          "Due date",
          /* @__PURE__ */ jsx("input", { className: "field-input", disabled: projectStatus(task) !== "ACTIVE", type: "date", value: String(changes.dueDate ?? ""), onChange: (event) => setDraft({ ...changes, dueDate: event.target.value || null }) })
        ] }),
        canEdit && /* @__PURE__ */ jsx("button", { className: "button-primary mt-4 w-full", onClick: save, disabled: !changedFields.length, children: "Save task changes" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-3 text-xs text-slate-500", children: [
          "Your permissions are checked by the server. Changes use version ",
          task.version,
          "."
        ] }),
        can("manage") && /* @__PURE__ */ jsx("button", { className: "button-danger mt-5 w-full", onClick: () => {
          if (window.confirm("Permanently delete this task and its comments?")) removeTask.mutate();
        }, children: "Delete task" })
      ] })
    ] }),
    conflict && /* @__PURE__ */ jsxs(Modal, { title: "This task was updated by someone else", onClose: () => {
      setConflict(null);
      setDraft(null);
      void taskQuery.refetch();
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-indigo-50 p-3", children: [
          /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs font-bold uppercase text-indigo-700", children: "My changes" }),
          Object.entries(conflict.changes).map(([key, value]) => /* @__PURE__ */ jsxs("p", { className: "mb-1 text-sm", children: [
            /* @__PURE__ */ jsxs("b", { children: [
              key,
              ":"
            ] }),
            " ",
            String(value)
          ] }, key))
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-slate-50 p-3", children: [
          /* @__PURE__ */ jsxs("p", { className: "mb-2 text-xs font-bold uppercase text-slate-500", children: [
            "Latest values \xB7 version ",
            conflict.current.version
          ] }),
          Object.keys(conflict.changes).map((key) => /* @__PURE__ */ jsxs("p", { className: "mb-1 text-sm", children: [
            /* @__PURE__ */ jsxs("b", { children: [
              key,
              ":"
            ] }),
            " ",
            String(conflict.current[key] ?? "")
          ] }, key))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap justify-end gap-2", children: [
        /* @__PURE__ */ jsx("button", { className: "button-secondary", onClick: () => {
          void qc.setQueryData(["task", id], conflict.current);
          setConflict(null);
          setDraft(null);
          success("Latest task values loaded.");
        }, children: "Use latest" }),
        /* @__PURE__ */ jsx("button", { className: "button-primary", onClick: () => {
          const latest = conflict.current;
          void qc.setQueryData(["task", id], latest);
          void update(conflict.changes, latest.version);
        }, children: "Reapply my changes" })
      ] })
    ] })
  ] });
}
function CommentForm({ busy, onSubmit }) {
  const [body, setBody] = useState("");
  return /* @__PURE__ */ jsxs("form", { className: "flex items-end gap-2", onSubmit: (event) => {
    event.preventDefault();
    onSubmit(body);
    setBody("");
  }, children: [
    /* @__PURE__ */ jsxs("label", { className: "field-label flex-1", children: [
      "Add a comment",
      /* @__PURE__ */ jsx("textarea", { className: "field-input", rows: 2, maxLength: 3e3, value: body, onChange: (event) => setBody(event.target.value), required: true })
    ] }),
    /* @__PURE__ */ jsx("button", { className: "button-primary mb-0.5", disabled: busy || !body.trim(), children: busy ? "Posting..." : "Comment" })
  ] });
}
function projectStatus(task) {
  return typeof task?.project === "object" ? task.project.status : "ACTIVE";
}
function UsersPage() {
  const { success, error } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const users = useQuery({ queryKey: ["users"], queryFn: async () => (await api.get("/users", { params: { limit: 100 } })).data.data });
  const deactivate = useMutation({ mutationFn: (id) => api.post(`/users/${id}/deactivate`), onSuccess: () => {
    void qc.invalidateQueries({ queryKey: ["users"] });
    success("User deactivated.");
  }, onError: (failure) => error(apiMessage(failure)) });
  const create = useMutation({ mutationFn: (body) => api.post("/users", body), onSuccess: () => {
    void qc.invalidateQueries({ queryKey: ["users"] });
    setCreateOpen(false);
    success("User created.");
  }, onError: (failure) => error(apiMessage(failure)) });
  const updateUser = useMutation({ mutationFn: ({ id, body }) => api.patch(`/users/${id}`, body), onSuccess: () => {
    void qc.invalidateQueries({ queryKey: ["users"] });
    setEditUser(null);
    success("User updated.");
  }, onError: (failure) => error(apiMessage(failure)) });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageTitle, { title: "Users", subtitle: "Manage accounts and access to the workspace.", action: /* @__PURE__ */ jsxs("button", { className: "button-primary", onClick: () => setCreateOpen(true), children: [
      /* @__PURE__ */ jsx(CirclePlus, { size: 16 }),
      "Add user"
    ] }) }),
    users.isLoading ? /* @__PURE__ */ jsx(LoadingCards, {}) : users.error ? /* @__PURE__ */ jsx(EmptyState, { title: "Users unavailable", detail: apiMessage(users.error) }) : /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-2xl border border-slate-200 bg-white", children: users.data?.map((person) => /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 last:border-0", children: [
      /* @__PURE__ */ jsx("span", { className: "grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700", children: initials(person.name) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-40 flex-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: person.name }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: person.email })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-xs", children: person.role.replaceAll("_", " ") }),
      /* @__PURE__ */ jsx("span", { className: `text-xs ${person.isActive ? "text-emerald-700" : "text-slate-400"}`, children: person.isActive ? "Active" : "Inactive" }),
      /* @__PURE__ */ jsx("button", { className: "button-secondary", onClick: () => setEditUser(person), children: "Edit" }),
      person.isActive && /* @__PURE__ */ jsx("button", { className: "button-danger", onClick: () => {
        if (window.confirm(`Deactivate ${person.name}?`)) deactivate.mutate(person.id);
      }, children: "Deactivate" })
    ] }, person.id)) }),
    createOpen && /* @__PURE__ */ jsx(Modal, { title: "Create user", onClose: () => setCreateOpen(false), children: /* @__PURE__ */ jsx(UserCreateForm, { busy: create.isPending, onSubmit: (body) => create.mutate(body) }) }),
    editUser && /* @__PURE__ */ jsx(Modal, { title: "Update user", onClose: () => setEditUser(null), children: /* @__PURE__ */ jsx(UserEditForm, { user: editUser, busy: updateUser.isPending, onSubmit: (body) => updateUser.mutate({ id: editUser.id, body }) }) })
  ] });
}
function UserEditForm({ user, busy, onSubmit }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  return /* @__PURE__ */ jsxs("form", { className: "space-y-4", onSubmit: (event) => {
    event.preventDefault();
    onSubmit({ name, email, role });
  }, children: [
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: ["Name", /* @__PURE__ */ jsx("input", { className: "field-input", required: true, minLength: 2, value: name, onChange: (event) => setName(event.target.value) })] }),
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: ["Email", /* @__PURE__ */ jsx("input", { className: "field-input", type: "email", required: true, value: email, onChange: (event) => setEmail(event.target.value) })] }),
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
      "Global role",
      /* @__PURE__ */ jsxs("select", { className: "field-input", value: role, onChange: (event) => setRole(event.target.value), children: [
        /* @__PURE__ */ jsx("option", { children: "ADMIN" }),
        /* @__PURE__ */ jsx("option", { children: "PROJECT_MANAGER" }),
        /* @__PURE__ */ jsx("option", { children: "TEAM_MEMBER" }),
        /* @__PURE__ */ jsx("option", { children: "VIEWER" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("button", { className: "button-primary w-full", disabled: busy, children: busy ? "Saving..." : "Save user" })
  ] });
}
function UserCreateForm({ busy, onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("TEAM_MEMBER");
  return /* @__PURE__ */ jsxs("form", { className: "space-y-4", onSubmit: (event) => {
    event.preventDefault();
    onSubmit({ name, email, password, role });
  }, children: [
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
      "Name",
      /* @__PURE__ */ jsx("input", { className: "field-input", required: true, minLength: 2, value: name, onChange: (event) => setName(event.target.value) })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
      "Email",
      /* @__PURE__ */ jsx("input", { className: "field-input", type: "email", required: true, value: email, onChange: (event) => setEmail(event.target.value) })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
      "Temporary password",
      /* @__PURE__ */ jsx("input", { className: "field-input", type: "password", minLength: 8, required: true, value: password, onChange: (event) => setPassword(event.target.value) })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
      "Global role",
      /* @__PURE__ */ jsxs("select", { className: "field-input", value: role, onChange: (event) => setRole(event.target.value), children: [
        /* @__PURE__ */ jsx("option", { children: "ADMIN" }),
        /* @__PURE__ */ jsx("option", { children: "PROJECT_MANAGER" }),
        /* @__PURE__ */ jsx("option", { children: "TEAM_MEMBER" }),
        /* @__PURE__ */ jsx("option", { children: "VIEWER" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("button", { className: "button-primary w-full", disabled: busy, children: busy ? "Creating..." : "Create user" })
  ] });
}
function ProfilePage() {
  const { user, refresh } = useAuth();
  const { success, error } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const update = useMutation({ mutationFn: () => api.patch("/auth/me", { name, ...password ? { currentPassword, password } : {} }), onSuccess: async () => {
    await refresh();
    setCurrentPassword("");
    setPassword("");
    success("Profile updated.");
  }, onError: (failure) => error(apiMessage(failure)) });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageTitle, { title: "Profile", subtitle: "Manage your personal account details." }),
    /* @__PURE__ */ jsxs("section", { className: "card max-w-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "grid h-12 w-12 place-items-center rounded-full bg-indigo-100 font-bold text-indigo-700", children: initials(user?.name ?? "User") }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: user?.name }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: user?.role.replaceAll("_", " ") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { className: "space-y-4", onSubmit: (event) => {
        event.preventDefault();
        update.mutate();
      }, children: [
        /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
          "Name",
          /* @__PURE__ */ jsx("input", { className: "field-input", minLength: 2, value: name, onChange: (event) => setName(event.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
          "Email",
          /* @__PURE__ */ jsx("input", { className: "field-input bg-slate-50", value: user?.email ?? "", disabled: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-100 pt-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "mb-3 font-medium", children: "Change password" }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
              "Current password",
              /* @__PURE__ */ jsx("input", { className: "field-input", type: "password", autoComplete: "current-password", value: currentPassword, onChange: (event) => setCurrentPassword(event.target.value) })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
              "New password",
              /* @__PURE__ */ jsx("input", { className: "field-input", type: "password", minLength: 8, autoComplete: "new-password", value: password, onChange: (event) => setPassword(event.target.value) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "button-primary", disabled: update.isPending, children: update.isPending ? "Saving..." : "Save profile" })
      ] })
    ] })
  ] });
}
export {
  DashboardPage,
  ProfilePage,
  ProjectFrame,
  ProjectIndex,
  ProjectSettingsPage,
  ProjectTasksPage,
  ProjectTeamPage,
  ProjectsPage,
  TaskDetailPage,
  UsersPage
};
