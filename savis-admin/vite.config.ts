import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const savisApiProxyTarget =
  process.env.SAVIS_API_PROXY_TARGET ?? "http://localhost:8080";
const executorApiProxyTarget =
  process.env.EXECUTOR_API_PROXY_TARGET ?? "http://localhost:8000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/savis-api": {
        target: savisApiProxyTarget,
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/savis-api/, "/api"),
      },
      "/executor-api": {
        target: executorApiProxyTarget,
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/executor-api/, "/api"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
