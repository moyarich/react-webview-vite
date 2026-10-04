import * as path from "node:path";
import * as vscode from "vscode";
import type { PackageManager, WorkspaceManifest } from "../shared/types";
import { extractDependenciesFromJson } from "../utils/parse";

export async function listWorkspaceManifests(): Promise<WorkspaceManifest[]> {
  const uris = await vscode.workspace.findFiles("**/package.json", "**/node_modules/**");
  const manifests: WorkspaceManifest[] = [];

  for (const uri of uris) {
    try {
      const document = await vscode.workspace.openTextDocument(uri);
      const parsed = JSON.parse(document.getText()) as Record<string, unknown>;
      const dependencies = extractDependenciesFromJson(parsed);
      const relativePath = vscode.workspace.asRelativePath(uri);
      const directory = path.posix.dirname(relativePath.replaceAll("\\", "/"));

      manifests.push({
        id: directory === "." ? "." : directory,
        name: typeof parsed.name === "string" ? parsed.name : undefined,
        uri: uri.toString(),
        relativePath,
        dependencies,
        packageManager: await detectPackageManager(uri, parsed),
      });
    } catch (error) {
      console.warn("Dependency Links: unable to inspect workspace manifest " + uri.fsPath, error);
    }
  }

  return manifests.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function detectPackageManager(
  manifestUri: vscode.Uri,
  parsed: Record<string, unknown>,
): Promise<PackageManager> {
  const declared = typeof parsed.packageManager === "string" ? parsed.packageManager : undefined;
  if (declared?.startsWith("pnpm@")) return "pnpm";
  if (declared?.startsWith("yarn@")) return "yarn";
  if (declared?.startsWith("npm@")) return "npm";

  const directory = vscode.Uri.joinPath(manifestUri, "..");
  for (const [file, manager] of [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["package-lock.json", "npm"],
  ] as const) {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.joinPath(directory, file));
      return manager;
    } catch {
      /* try next */
    }
  }
  return "unknown";
}
