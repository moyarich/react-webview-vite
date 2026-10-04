import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

const PREVIEW_ROUTES = new Set([
  "/previews",
  "/previews/",
  "/previews/inspector",
  "/previews/dependency-explorer",
]);

function previewHistoryFallback(): Plugin {
  return {
    name: "dependency-links-preview-history-fallback",
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url) {
          const url = new URL(request.url, "http://dependency-links.local");

          if (PREVIEW_ROUTES.has(url.pathname)) {
            request.url = "/previews/index.html" + url.search;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [previewHistoryFallback(), react(), tailwindcss()],
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
  },
  build: {
    target: "es2022",
    sourcemap: mode !== "production",
    // Vite 8 uses Oxc for production minification. Keep development builds
    // unminified for easier webview debugging.
    minify: mode === "production" ? "oxc" : false,
    outDir: "out/webview-ui",
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        inspector: "src/webview-ui/inspector/index.tsx",
        "dependency-graph": "src/webview-ui/dependency-graph/index.tsx",
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith(".css") ? "webview.css" : "assets/[name]-[hash][extname]",
        format: "es",
      },
    },
  },
}));
