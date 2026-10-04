/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      comment: "Keep extension, shared, utils, and webview modules acyclic.",
      severity: "error",
      from: { path: "^src/" },
      to: { circular: true },
    },
    {
      name: "no-unresolvable",
      comment: "All source imports should resolve.",
      severity: "error",
      from: { path: "^src/" },
      to: { couldNotResolve: true, pathNot: "^vscode$" },
    },
    {
      name: "webviews-do-not-import-extension-runtime",
      comment:
        "Browser webviews may only depend on browser-safe utilities and shared contracts.",
      severity: "error",
      from: { path: "^src/webviews/" },
      to: { path: "^src/extension(?:\\.ts|/)" },
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
        ],
      },
      to: { path: "^src/webviews/" },
    },
    {
      name: "shared-remains-runtime-neutral",
      comment:
        "Shared contracts must not depend on extension, utility, or browser implementation modules.",
      severity: "error",
      from: { path: "^src/shared/" },
      to: {
        path: [
          "^src/extension(?:\\.ts|/)",
          "^src/utils/",
          "^src/webviews/",
        ],
      },
    },
    {
      name: "utils-remain-runtime-neutral",
      comment:
        "Shared dependency utilities may use shared contracts but must not depend on VS Code or webview implementation modules.",
      severity: "error",
      from: { path: "^src/utils/" },
      to: {
        path: [
          "^src/extension(?:\\.ts|/)",
          "^src/webviews/",
          "^vscode$",
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
