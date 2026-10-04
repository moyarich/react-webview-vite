import * as path from "node:path";
import * as vscode from "vscode";
import { getPackageLockVersion } from "../utils/versions";

export async function findResolvedVersion(
  packageName: string,
  workspaceId?: string,
): Promise<{ resolvedVersion?: string; lockfilePath?: string }> {
  const lockfiles = await vscode.workspace.findFiles("**/package-lock.json", "**/node_modules/**");
  const target = normalizeScope(workspaceId ?? ".");

  const candidates = lockfiles
    .map((uri) => {
      const relativePath = vscode.workspace.asRelativePath(uri).replaceAll("\\", "/");
      const directory = normalizeScope(path.posix.dirname(relativePath));
      return { uri, relativePath, directory };
    })
    .filter(({ directory }) => directory === "." || target === directory || target.startsWith(directory + "/"))
    .sort((left, right) => right.directory.length - left.directory.length);

  for (const candidate of candidates) {
    try {
      const document = await vscode.workspace.openTextDocument(candidate.uri);
      const lock = JSON.parse(document.getText()) as unknown;
      const resolvedVersion = getPackageLockVersion(lock, packageName);

      if (resolvedVersion) {
        return {
          resolvedVersion,
          lockfilePath: candidate.relativePath,
        };
      }
    } catch (error) {
      console.warn("Dependency Links: unable to inspect lockfile " + candidate.uri.fsPath, error);
    }
  }

  return {};
}

function normalizeScope(value: string) {
  const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, "");
  return normalized && normalized !== "." ? normalized : ".";
}
