import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { readFileSync } from "node:fs";
import { componentTagger } from "lovable-tagger";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      // Overlay ligado: com ele desligado, um erro de runtime aparece como
      // pagina em branco sem nenhuma mensagem.
      overlay: true,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  // Versão exposta ao app a partir do package.json — fonte única.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  // Sem manualChunks: separar recharts/d3 num chunk proprio criava dependencia
  // circular entre chunks, e o navegador quebrava com "Cannot access 'S' before
  // initialization". O Rollup resolve a ordem sozinho respeitando os ciclos.
  // A carga inicial ja e enxuta pelas rotas em React.lazy e pelos imports
  // dinamicos de xlsx/jspdf — o ganho nao vinha daqui.
}));
