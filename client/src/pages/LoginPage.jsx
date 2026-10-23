import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BriefcaseBusiness, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, apiMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required")
});
const demos = [
  { label: "Admin", email: "admin@demo.com" },
  { label: "Project manager", email: "pm@demo.com" },
  { label: "Team member", email: "member@demo.com" },
  { label: "Viewer", email: "viewer@demo.com" }
];
function LoginPage() {
  const { setUser, user, loading } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  if (loading) return /* @__PURE__ */ jsx("div", { className: "grid min-h-screen place-items-center text-sm text-slate-500", children: "Loading\u2026" });
  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }
  const submit = form.handleSubmit(async (input) => {
    try {
      const response = await api.post("/auth/login", input);
      setUser(response.data.data);
      success("Welcome to ProjectFlow.");
      navigate("/dashboard", { replace: true });
    } catch (failure) {
      error(apiMessage(failure));
    }
  });
  const fill = (email) => {
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", "Password@123");
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen bg-white", children: [
    /* @__PURE__ */ jsxs("div", { className: "hidden flex-1 flex-col justify-between bg-ink p-12 text-white lg:flex", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "grid h-11 w-11 place-items-center rounded-xl bg-brand", children: /* @__PURE__ */ jsx(BriefcaseBusiness, {}) }),
        /* @__PURE__ */ jsx("span", { className: "text-lg font-bold", children: "ProjectFlow" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-lg", children: [
        /* @__PURE__ */ jsx("p", { className: "mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300", children: "Better teamwork starts here" }),
        /* @__PURE__ */ jsx("h1", { className: "text-5xl font-bold leading-tight", children: "One place for your team\u2019s next big thing." }),
        /* @__PURE__ */ jsx("p", { className: "mt-5 text-lg text-slate-300", children: "Plan projects, keep tasks moving, and bring conversations closer to the work." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Collaborate with confidence." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-1 items-center justify-center p-6 sm:p-12", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8 flex items-center gap-3 lg:hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "grid h-10 w-10 place-items-center rounded-xl bg-brand text-white", children: /* @__PURE__ */ jsx(BriefcaseBusiness, { size: 20 }) }),
        /* @__PURE__ */ jsx("b", { children: "ProjectFlow" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-brand", children: "WELCOME BACK" }),
      /* @__PURE__ */ jsx("h2", { className: "mt-2 text-3xl font-bold tracking-tight", children: "Sign in to your account" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Enter your credentials to continue to your workspace." }),
      /* @__PURE__ */ jsxs("form", { className: "mt-8 space-y-5", onSubmit: (event) => void submit(event), children: [
        /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
          "Email address",
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Mail, { className: "absolute left-3 top-3 text-slate-400", size: 17 }),
            /* @__PURE__ */ jsx("input", { ...form.register("email"), className: "field-input pl-10", type: "email", autoComplete: "username", placeholder: "you@example.com" })
          ] }),
          form.formState.errors.email && /* @__PURE__ */ jsx("span", { className: "field-error", children: form.formState.errors.email.message })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "field-label", children: [
          "Password",
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(LockKeyhole, { className: "absolute left-3 top-3 text-slate-400", size: 17 }),
            /* @__PURE__ */ jsx("input", { ...form.register("password"), className: "field-input px-10", type: showPassword ? "text" : "password", autoComplete: "current-password", placeholder: "Enter your password" }),
            /* @__PURE__ */ jsx("button", { type: "button", "aria-label": showPassword ? "Hide password" : "Show password", className: "absolute right-3 top-3 text-slate-400", onClick: () => setShowPassword((value) => !value), children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { size: 17 }) : /* @__PURE__ */ jsx(Eye, { size: 17 }) })
          ] }),
          form.formState.errors.password && /* @__PURE__ */ jsx("span", { className: "field-error", children: form.formState.errors.password.message })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "button-primary w-full justify-center py-3", disabled: form.formState.isSubmitting, children: form.formState.isSubmitting ? "Signing in..." : "Sign in" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-100 pt-5", children: [
        /* @__PURE__ */ jsx("p", { className: "mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500", children: "Demo accounts \xB7 click to fill" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: demos.map((demo) => /* @__PURE__ */ jsx("button", { className: "rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-600 hover:border-indigo-200 hover:bg-indigo-50", onClick: () => fill(demo.email), children: demo.label }, demo.email)) }),
        /* @__PURE__ */ jsxs("p", { className: "mt-3 text-xs text-slate-400", children: [
          "Password: ",
          /* @__PURE__ */ jsx("code", { children: "Password@123" })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  LoginPage
};
