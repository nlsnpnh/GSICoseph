import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      output: {
        // Bibliotecas pesadas em chunks proprios: sao usadas por poucas rotas
        // e mudam pouco, entao ficam em cache do navegador entre deploys.
        manualChunks(id) {
          const p = id.split(path.sep).join("/");
          if (!p.includes("/node_modules/")) return;
          const pkg = p.split("/node_modules/").pop() ?? "";
          if (/^(react|react-dom|react-router|react-router-dom|scheduler)\//.test(pkg)) return "react-vendor";
          if (/^(recharts|d3-|victory-)/.test(pkg)) return "charts";
          if (/^@supabase\//.test(pkg)) return "supabase";
        },
      },
    },
  },
}));
