import { jsx, jsxs } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { AppShell } from "./components/AppShell";
import { DashboardPage, ProjectFrame, ProjectIndex, ProjectSettingsPage, ProjectTasksPage, ProjectTeamPage, ProjectsPage, ProfilePage, TaskDetailPage, UsersPage } from "./pages/Pages";
import { LoginPage } from "./pages/LoginPage";
import "./styles.css";
// Shared query cache centralizes loading, caching, and refresh behavior for API data.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 3e4, retry: (count, error) => count < 1 && !error.response?.status } }
});
function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return /* @__PURE__ */ jsx("div", { className: "grid min-h-screen place-items-center text-sm text-slate-500", children: "Loading your workspace\u2026" });
  if (!user) return /* @__PURE__ */ jsx(Navigate, { to: "/login", replace: true });
  if (roles && !roles.includes(user.role)) return /* @__PURE__ */ jsx("div", { className: "grid min-h-screen place-items-center p-6", children: /* @__PURE__ */ jsxs("div", { className: "card max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold", children: "Not authorized" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Your account does not have permission to view this page." })
  ] }) });
  return /* @__PURE__ */ jsx(Outlet, {});
}
function RootRoutes() {
  return /* @__PURE__ */ jsxs(Routes, { children: [
    /* @__PURE__ */ jsx(Route, { path: "/login", element: /* @__PURE__ */ jsx(LoginPage, {}) }),
    /* @__PURE__ */ jsx(Route, { element: /* @__PURE__ */ jsx(ProtectedRoute, {}), children: /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(AppShell, {}), children: [
      /* @__PURE__ */ jsx(Route, { path: "/", element: /* @__PURE__ */ jsx(Navigate, { to: "/dashboard", replace: true }) }),
      /* @__PURE__ */ jsx(Route, { path: "/dashboard", element: /* @__PURE__ */ jsx(DashboardPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/projects", element: /* @__PURE__ */ jsx(ProjectsPage, {}) }),
      /* @__PURE__ */ jsxs(Route, { path: "/projects/:id", element: /* @__PURE__ */ jsx(ProjectFrame, {}), children: [
        /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx(ProjectIndex, {}) }),
        /* @__PURE__ */ jsx(Route, { path: "tasks", element: /* @__PURE__ */ jsx(ProjectTasksPage, {}) }),
        /* @__PURE__ */ jsx(Route, { path: "team", element: /* @__PURE__ */ jsx(ProjectTeamPage, {}) }),
        /* @__PURE__ */ jsx(Route, { path: "settings", element: /* @__PURE__ */ jsx(ProjectSettingsPage, {}) })
      ] }),
      /* @__PURE__ */ jsx(Route, { path: "/tasks/:id", element: /* @__PURE__ */ jsx(TaskDetailPage, {}) }),
      /* @__PURE__ */ jsx(Route, { element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["ADMIN"] }), children: /* @__PURE__ */ jsx(Route, { path: "/users", element: /* @__PURE__ */ jsx(UsersPage, {}) }) }),
      /* @__PURE__ */ jsx(Route, { path: "/profile", element: /* @__PURE__ */ jsx(ProfilePage, {}) })
    ] }) }),
    /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(Navigate, { to: "/", replace: true }) })
  ] });
}
// Providers are composed once so routes share auth, toast, router, and query state.
ReactDOM.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsx(React.StrictMode, { children: /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(ToastProvider, { children: /* @__PURE__ */ jsx(BrowserRouter, { children: /* @__PURE__ */ jsx(RootRoutes, {}) }) }) }) }) })
);
