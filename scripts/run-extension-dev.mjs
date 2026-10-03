import { spawn } from "node:child_process";
import process from "node:process";

const command = process.env.CODE_COMMAND || "code";
const extensionDevelopmentPath = process.cwd();

const child = spawn(
  command,
  [
    `--extensionDevelopmentPath=${extensionDevelopmentPath}`,
    "--new-window",
    extensionDevelopmentPath,
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

child.on("error", (error) => {
  console.error(
    `Unable to launch VS Code using "${command}". Set CODE_COMMAND if your VS Code CLI uses a different command.`,
  );
  console.error(error.message);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 0;
});
