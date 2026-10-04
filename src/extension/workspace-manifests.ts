import * as path from "node:path";
import * as vscode from "vscode";
import type { WorkspaceManifest } from "../shared/types";
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
      });
    } catch (error) {
      console.warn("Dependency Links: unable to inspect workspace manifest " + uri.fsPath, error);
    }
  }

  return manifests.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}
