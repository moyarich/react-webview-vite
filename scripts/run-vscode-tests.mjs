import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { downloadAndUnzipVSCode } from "@vscode/test-electron";

function getVSCodeCachePath() {
  if (process.env.DEMO_TOOLS_VSCODE_CACHE) {
    return path.resolve(process.env.DEMO_TOOLS_VSCODE_CACHE);
  }

  const homeDirectory = os.homedir();

  if (process.platform === "darwin") {
    return path.join(homeDirectory, "Library", "Caches", "moya-vscode-test");
  }

  if (process.platform === "win32") {
    return path.join(
      process.env.LOCALAPPDATA ?? path.join(homeDirectory, "AppData", "Local"),
      "moya-vscode-test",
    );
  }

  return path.join(
    process.env.XDG_CACHE_HOME ?? path.join(homeDirectory, ".cache"),
    "moya-vscode-test",
  );
}

const cachePath = getVSCodeCachePath();
const version = process.env.VSCODE_VERSION ?? "stable";

console.log(`VS Code test cache: ${cachePath}`);

const vscodeExecutablePath = await downloadAndUnzipVSCode({
  version,
  cachePath,
});

const child = spawn("vscode-test", process.argv.slice(2), {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    VSCODE_TEST_EXECUTABLE_PATH: vscodeExecutablePath,
  },
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 1;
});
