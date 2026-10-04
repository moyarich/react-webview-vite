import * as path from "node:path";
import * as vscode from "vscode";
import type { DependencyReference } from "../shared/types";
import { DEPENDENCY_SECTIONS } from "../utils/parse";
import { parseSourceDependencyReferences } from "../utils/source-dependencies";

const SOURCE_GLOB = "**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}";
const SOURCE_EXCLUDE = "**/{node_modules,out,dist,build,.git,coverage}/**";
const MANIFEST_GLOB = "**/package.json";

export async function findDependencyReferences(packageName: string): Promise<DependencyReference[]> {
  const [sourceFiles, manifests] = await Promise.all([
    vscode.workspace.findFiles(SOURCE_GLOB, SOURCE_EXCLUDE),
    vscode.workspace.findFiles(MANIFEST_GLOB, "**/node_modules/**"),
  ]);

  const references: DependencyReference[] = [];

  for (const uri of manifests) {
    references.push(...(await findManifestReferences(uri, packageName)));
  }

  for (const uri of sourceFiles) {
    references.push(...(await findSourceReferences(uri, packageName, manifests)));
  }

  return references.sort((left, right) => {
    const pathCompare = left.relativePath.localeCompare(right.relativePath);
    return pathCompare !== 0 ? pathCompare : left.line - right.line;
  });
}

async function findSourceReferences(
  uri: vscode.Uri,
  packageName: string,
  manifests: vscode.Uri[],
) {
  try {
    const document = await vscode.workspace.openTextDocument(uri);
    const text = document.getText();

    const parsedReferences = await parseSourceDependencyReferences(text);\n\n    return parsedReferences.filter((reference) => reference.packageName === packageName)
      .map<DependencyReference>((reference) => ({
        packageName,
        specifier: reference.specifier,
        uri: uri.toString(),
        relativePath: vscode.workspace.asRelativePath(uri),
        workspace: findNearestManifestScope(uri, manifests),
        line: reference.line,
        column: reference.column,
        kind: reference.kind,
        text: reference.text,
      }));
  } catch (error) {
    console.warn("Dependency Links: unable to parse " + uri.fsPath, error);
    return [];
  }
}

async function findManifestReferences(uri: vscode.Uri, packageName: string) {
  try {
    const document = await vscode.workspace.openTextDocument(uri);
    const text = document.getText();
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const references: DependencyReference[] = [];

    for (const section of DEPENDENCY_SECTIONS) {
      const entries = parsed[section];

      if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
        continue;
      }

      if (!(packageName in (entries as Record<string, unknown>))) {
        continue;
      }

      const quotedName = JSON.stringify(packageName);
      const matchIndex = text.indexOf(quotedName);
      const position = document.positionAt(matchIndex >= 0 ? matchIndex : 0);

      references.push({
        packageName,
        specifier: packageName,
        uri: uri.toString(),
        relativePath: vscode.workspace.asRelativePath(uri),
        workspace: manifestScope(uri),
        line: position.line,
        column: position.character,
        kind: "manifest",
        text: document.lineAt(position.line).text.trim(),
        dependencyKind: section,
      });
    }

    return references;
  } catch (error) {
    console.warn("Dependency Links: unable to inspect manifest " + uri.fsPath, error);
    return [];
  }
}

export async function openDependencyReference(
  reference: Pick<DependencyReference, "uri" | "line" | "column">,
) {
  const uri = vscode.Uri.parse(reference.uri);
  const document = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(document, { preview: true });
  const position = new vscode.Position(reference.line, reference.column ?? 0);

  editor.selection = new vscode.Selection(position, position);
  editor.revealRange(
    new vscode.Range(position, position),
    vscode.TextEditorRevealType.InCenterIfOutsideViewport,
  );
}


function findNearestManifestScope(uri: vscode.Uri, manifests: vscode.Uri[]) {
  const sourcePath = path.resolve(uri.fsPath);
  const candidates = manifests
    .map((manifest) => ({
      manifest,
      directory: path.dirname(path.resolve(manifest.fsPath)),
    }))
    .filter(({ directory }) => sourcePath === directory || sourcePath.startsWith(directory + path.sep))
    .sort((left, right) => right.directory.length - left.directory.length);

  return candidates[0] ? manifestScope(candidates[0].manifest) : undefined;
}

function manifestScope(uri: vscode.Uri) {
  const relativePath = vscode.workspace.asRelativePath(uri).replaceAll("\\", "/");
  const directory = path.posix.dirname(relativePath);
  return directory === "." ? "." : directory;
}
