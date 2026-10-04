import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
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
