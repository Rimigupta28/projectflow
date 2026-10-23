import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, ChevronDown, LayoutDashboard, LogOut, Menu, UserRound, Users, X } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
const linkClass = ({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-indigo-50 text-brand" : "text-slate-600 hover:bg-slate-100"}`;
function AppShell() {
  const { user, setUser } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const signOut = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      success("You have signed out.");
      navigate("/login");
    } catch (failure) {
      error("Unable to sign out. Please try again.");
    }
  };
  const navigation = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8 flex items-center gap-3 px-2", children: [
      /* @__PURE__ */ jsx("div", { className: "grid h-10 w-10 place-items-center rounded-xl bg-brand text-white", children: /* @__PURE__ */ jsx(BriefcaseBusiness, { size: 20 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-bold tracking-tight text-ink", children: "ProjectFlow" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Team workspace" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("nav", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxs(NavLink, { to: "/dashboard", className: linkClass, children: [
        /* @__PURE__ */ jsx(LayoutDashboard, { size: 18 }),
        "Dashboard"
      ] }),
      /* @__PURE__ */ jsxs(NavLink, { to: "/projects", className: linkClass, children: [
        /* @__PURE__ */ jsx(BriefcaseBusiness, { size: 18 }),
        "Projects"
      ] }),
      user?.role === "ADMIN" && /* @__PURE__ */ jsxs(NavLink, { to: "/users", className: linkClass, children: [
        /* @__PURE__ */ jsx(Users, { size: 18 }),
        "Users"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-auto border-t border-slate-100 pt-4", children: [
      /* @__PURE__ */ jsxs(NavLink, { to: "/profile", className: linkClass, children: [
        /* @__PURE__ */ jsx(UserRound, { size: 18 }),
        "Profile"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => void signOut(), className: "mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100", children: [
        /* @__PURE__ */ jsx(LogOut, { size: 18 }),
        "Sign out"
      ] })
    ] })
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-canvas text-ink", children: [
    /* @__PURE__ */ jsx("aside", { className: "fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white p-5 lg:flex", children: navigation }),
    mobileOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-40 bg-slate-900/30 lg:hidden", onClick: () => setMobileOpen(false), children: /* @__PURE__ */ jsxs("aside", { className: "flex h-full w-72 flex-col bg-white p-5", onClick: (event) => event.stopPropagation(), children: [
      /* @__PURE__ */ jsx("div", { className: "mb-4 flex justify-end", children: /* @__PURE__ */ jsx("button", { onClick: () => setMobileOpen(false), "aria-label": "Close menu", children: /* @__PURE__ */ jsx(X, {}) }) }),
      navigation
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "min-h-screen lg:pl-64", children: [
      /* @__PURE__ */ jsxs("header", { className: "sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur sm:px-8", children: [
        /* @__PURE__ */ jsx("button", { className: "lg:hidden", "aria-label": "Open menu", onClick: () => setMobileOpen(true), children: /* @__PURE__ */ jsx(Menu, {}) }),
        /* @__PURE__ */ jsx("div", { className: "hidden text-sm text-slate-500 sm:block", children: "Your work, organized" }),
        /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-brand", children: user?.role?.replaceAll("_", " ") }),
          /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-2 text-sm font-medium", onClick: () => navigate("/profile"), children: [
            /* @__PURE__ */ jsx("span", { className: "grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700", children: user?.name.split(" ").map((part) => part[0]).slice(0, 2).join("") }),
            /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: user?.name }),
            /* @__PURE__ */ jsx(ChevronDown, { size: 14 })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl p-5 sm:p-8", children: /* @__PURE__ */ jsx(Outlet, {}) })
    ] })
  ] });
}
export {
  AppShell
};
