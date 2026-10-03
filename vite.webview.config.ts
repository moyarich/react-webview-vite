import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      mode === "production" ? "production" : "development",
    ),
  },
  build: {
    target: "es2022",
    sourcemap: mode !== "production",
    minify: mode === "production",
    outDir: "dist/webviews",
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        inspector: "src/webviews/inspector/index.tsx",
        "dependency-graph": "src/webviews/dependency-graph/index.tsx",
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith(".css")
            ? "webview.css"
            : "assets/[name]-[hash][extname]",
        format: "es",
      },
    },
  },
}));
