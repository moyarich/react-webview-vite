import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  build: {
    ssr: "src/extension.ts",
    target: "node22",
    sourcemap: mode !== "production",
    minify: false,
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: ["vscode"],
      output: {
        format: "cjs",
        exports: "named",
        entryFileNames: "extension.js",
      },
    },
  },
  ssr: {
    noExternal: true,
  },
}));
