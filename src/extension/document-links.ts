import * as vscode from "vscode";
import { DEPENDENCY_SECTIONS } from "../utils";

export async function getJsonDependencyLinks(
  document: vscode.TextDocument,
): Promise<vscode.DocumentLink[]> {
  const symbols =
    (await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      "vscode.executeDocumentSymbolProvider",
      document.uri,
    )) ?? [];

  const links: vscode.DocumentLink[] = [];

  for (const symbol of symbols) {
    if (!DEPENDENCY_SECTIONS.has(symbol.name)) {
      continue;
    }

    for (const child of symbol.children) {
      const range = dependencyNameRange(document, child.selectionRange, child.name);
      const link = new vscode.DocumentLink(range);
      link.tooltip = `Open repository for ${child.name}`;
      (link as vscode.DocumentLink & { data?: { packageName: string } }).data = {
        packageName: child.name,
      };
      links.push(link);
    }
  }

  return links;
}

export function getYamlDependencyLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
  const links: vscode.DocumentLink[] = [];
  let section: string | undefined;
  let sectionIndent = -1;

  for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex += 1) {
    const line = document.lineAt(lineIndex);
    const indent = line.text.match(/^\s*/)?.[0].length ?? 0;
    const sectionMatch = line.text.match(
      /^\s*(dependencies|devDependencies|peerDependencies|optionalDependencies):\s*$/,
    );

    if (sectionMatch) {
      section = sectionMatch[1];
      sectionIndent = indent;
      continue;
    }

    if (!section) {
      continue;
    }

    if (line.text.trim() && indent <= sectionIndent) {
      section = undefined;
      sectionIndent = -1;
      continue;
    }

    const entryMatch = line.text.match(/^\s*(["']?)([^"'#:][^:]*?)\1\s*:/);
    if (!entryMatch) {
      continue;
    }

    const name = entryMatch[2].trim();
    const start = line.text.indexOf(name);
    const link = new vscode.DocumentLink(
      new vscode.Range(lineIndex, start, lineIndex, start + name.length),
    );
    link.tooltip = `Open repository for ${name}`;
    (link as vscode.DocumentLink & { data?: { packageName: string } }).data = {
      packageName: name,
    };
    links.push(link);
  }

  return links;
}

function dependencyNameRange(
  document: vscode.TextDocument,
  selectionRange: vscode.Range,
  name: string,
) {
  const line = document.lineAt(selectionRange.start.line);
  const start = line.text.indexOf(name, selectionRange.start.character);

  if (start < 0) {
    return selectionRange;
  }

  return new vscode.Range(
    selectionRange.start.line,
    start,
    selectionRange.start.line,
    start + name.length,
  );
}
