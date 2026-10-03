/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      comment: "Keep extension, shared, and webview modules acyclic.",
      severity: "error",
      from: { path: "^src/" },
      to: { circular: true },
    },
    {
      name: "no-unresolvable",
      comment: "All source imports should resolve.",
      severity: "error",
      from: { path: "^src/" },
      to: { couldNotResolve: true },
    },
    {
      name: "webviews-do-not-import-extension-runtime",
      comment:
        "Browser webviews may only depend on browser-safe modules and shared contracts.",
      severity: "error",
      from: { path: "^src/webviews/" },
      to: {
        path: [
          "^src/extension(?:\\.ts|/)",
          "^src/dependencies\\.ts$",
        ],
      },
    },
    {
      name: "extension-does-not-import-webview-implementation",
      comment:
        "The extension host opens compiled webview entries; it must not import React/browser implementation modules.",
      severity: "error",
      from: {
        path: [
          "^src/extension\\.ts$",
          "^src/extension/",
          "^src/dependencies\\.ts$",
        ],
      },
      to: { path: "^src/webviews/" },
    },
    {
      name: "shared-remains-runtime-neutral",
      comment:
        "Shared contracts must not depend on either the extension host or browser webview implementations.",
      severity: "error",
      from: { path: "^src/shared/" },
      to: {
        path: [
          "^src/extension(?:\\.ts|/)",
          "^src/webviews/",
          "^src/dependencies\\.ts$",
        ],
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsPreCompilationDeps: true,
  },
};
