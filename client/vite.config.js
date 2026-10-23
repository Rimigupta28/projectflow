// Vite serves the JavaScript React app locally and bundles it for production.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({ plugins: [react()], server: { port: 5173 } });
