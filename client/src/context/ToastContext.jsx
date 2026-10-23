import { jsx, jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
const ToastContext = createContext(null);
function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const notify = (message, type) => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, type }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4200);
  };
  return /* @__PURE__ */ jsxs(ToastContext.Provider, { value: { success: (message) => notify(message, "success"), error: (message) => notify(message, "error") }, children: [
    children,
    /* @__PURE__ */ jsx("div", { className: "fixed right-4 top-4 z-50 flex w-[min(92vw,380px)] flex-col gap-2", "aria-live": "polite", children: items.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg", children: [
      item.type === "success" ? /* @__PURE__ */ jsx(CheckCircle2, { className: "text-emerald-600", size: 19 }) : /* @__PURE__ */ jsx(XCircle, { className: "text-rose-600", size: 19 }),
      /* @__PURE__ */ jsx("p", { className: "flex-1 text-sm text-slate-700", children: item.message }),
      /* @__PURE__ */ jsx("button", { "aria-label": "Dismiss notification", onClick: () => setItems((current) => current.filter((entry) => entry.id !== item.id)), children: /* @__PURE__ */ jsx(X, { size: 16 }) })
    ] }, item.id)) })
  ] });
}
function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
export {
  ToastProvider,
  useToast
};
