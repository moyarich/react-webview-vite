import { defineConfig } from "@vscode/test-cli";

const vscodeExecutablePath =
  process.env.VSCODE_TEST_EXECUTABLE_PATH ?? undefined;

export default defineConfig({
  files: "out/test/**/*.test.js",
  useInstallation: vscodeExecutablePath
    ? { fromPath: vscodeExecutablePath }
    : undefined,
});
