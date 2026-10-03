import * as vscode from "vscode";

export const DEPENDENCY_SECTIONS = new Set([
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
  "bundledDependencies",
  "bundleDependencies",
]);

export type DependencyKind =
  | "dependencies"
  | "devDependencies"
  | "peerDependencies"
  | "optionalDependencies"
  | "bundledDependencies"
  | "bundleDependencies"
  | "input";

export type DependencyEntry = {
  name: string;
  spec?: string;
  kind: DependencyKind;
};

export type DependencyResult = DependencyEntry & {
  npmUrl: string;
  repositoryUrl?: string;
  homepageUrl?: string;
};

type PackageMetadata = {
  homepage?: string;
  repository?: string | { url?: string };
};

const metadataCache = new Map<string, Promise<DependencyResult>>();

export function npmPackageUrl(name: string) {
  return `https://www.npmjs.com/package/${encodeURIComponent(name)}`;
}

export function normalizeRepositoryUrl(value?: string) {
  if (!value) {
    return undefined;
  }

  return value
    .replace(/^git\+/, "")
    .replace(/^git:\/\/github\.com\//, "https://github.com/")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\.git$/, "");
}

export async function resolvePackage(
  name: string,
  spec?: string,
  kind: DependencyKind = "input",
): Promise<DependencyResult> {
  const cacheKey = `${name}\0${spec ?? ""}\0${kind}`;
  const cached = metadataCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const request = (async () => {
    const npmUrl = npmPackageUrl(name);

    try {
      const response = await fetch(
        `https://registry.npmjs.org/${encodeURIComponent(name)}`,
        { headers: { Accept: "application/json" } },
      );

      if (!response.ok) {
        return { name, spec, kind, npmUrl };
      }

      const metadata = (await response.json()) as PackageMetadata;
      const repositoryValue =
        typeof metadata.repository === "string"
          ? metadata.repository
          : metadata.repository?.url;

      return {
        name,
        spec,
        kind,
        npmUrl,
        repositoryUrl: normalizeRepositoryUrl(repositoryValue),
        homepageUrl: metadata.homepage,
      };
    } catch {
      return { name, spec, kind, npmUrl };
    }
  })();

  metadataCache.set(cacheKey, request);
  return request;
}

export function extractDependenciesFromJson(value: unknown): DependencyEntry[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const object = value as Record<string, unknown>;
  const entries: DependencyEntry[] = [];

  for (const [section, sectionValue] of Object.entries(object)) {
    if (!DEPENDENCY_SECTIONS.has(section)) {
      continue;
    }

    if (Array.isArray(sectionValue)) {
      for (const item of sectionValue) {
        if (typeof item === "string") {
          entries.push({ name: item, kind: section as DependencyKind });
        }
      }
      continue;
    }

    if (!sectionValue || typeof sectionValue !== "object") {
      continue;
    }

    for (const [name, spec] of Object.entries(
      sectionValue as Record<string, unknown>,
    )) {
      if (typeof spec === "string") {
        entries.push({
          name,
          spec,
          kind: section as DependencyKind,
        });
      }
    }
  }

  if (entries.length > 0) {
    return entries;
  }

  const values = Object.values(object);
  if (
    values.length > 0 &&
    values.every((value) => typeof value === "string")
  ) {
    return Object.entries(object).map(([name, spec]) => ({
      name,
      spec: spec as string,
      kind: "input",
    }));
  }

  return [];
}

export function extractDependenciesFromYaml(text: string): DependencyEntry[] {
  const lines = text.split(/\r?\n/);
  const entries: DependencyEntry[] = [];
  let section: DependencyKind | undefined;
  let sectionIndent = -1;

  for (const line of lines) {
    if (!line.trim() || /^\s*#/.test(line)) {
      continue;
    }

    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    const sectionMatch = line.match(
      /^\s*(dependencies|devDependencies|peerDependencies|optionalDependencies|bundledDependencies|bundleDependencies):\s*$/,
    );

    if (sectionMatch) {
      section = sectionMatch[1] as DependencyKind;
      sectionIndent = indent;
      continue;
    }

    if (!section) {
      continue;
    }

    if (indent <= sectionIndent) {
      section = undefined;
      sectionIndent = -1;
      continue;
    }

    const entryMatch = line.match(/^\s*(["']?)([^"'#:][^:]*?)\1:\s*(.*?)\s*$/);
    if (!entryMatch) {
      continue;
    }

    const name = entryMatch[2].trim();
    const rawSpec = entryMatch[3].replace(/^["']|["']$/g, "").trim();

    entries.push({
      name,
      spec: rawSpec || undefined,
      kind: section,
    });
  }

  return entries;
}

export function parsePackageSpecifier(input: string) {
  const value = input.trim();

  if (value.startsWith("@")) {
    const secondAt = value.indexOf("@", 1);
    return secondAt > value.indexOf("/")
      ? { name: value.slice(0, secondAt), spec: value.slice(secondAt + 1) }
      : { name: value };
  }

  const at = value.lastIndexOf("@");
  return at > 0
    ? { name: value.slice(0, at), spec: value.slice(at + 1) }
    : { name: value };
}

export async function resolveInput(input: string): Promise<DependencyResult[]> {
  const value = input.trim();
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    const dependencies = extractDependenciesFromJson(parsed);
    if (dependencies.length > 0) {
      return Promise.all(
        dependencies.map((entry) =>
          resolvePackage(entry.name, entry.spec, entry.kind),
        ),
      );
    }
  } catch {
    // Not JSON; continue with URL, YAML, or package-name handling.
  }

  const yamlDependencies = extractDependenciesFromYaml(value);
  if (yamlDependencies.length > 0) {
    return Promise.all(
      yamlDependencies.map((entry) =>
        resolvePackage(entry.name, entry.spec, entry.kind),
      ),
    );
  }

  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    const githubMatch = url.hostname === "github.com"
      ? url.pathname.match(/^\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/)
      : undefined;

    if (githubMatch) {
      return [
        {
          name: `${githubMatch[1]}/${githubMatch[2]}`,
          kind: "input",
          npmUrl: value,
          repositoryUrl: value.replace(/\.git\/?$/, ""),
        },
      ];
    }

    const response = await fetch(value);
    if (!response.ok) {
      throw new Error(`Unable to fetch manifest: HTTP ${response.status}`);
    }

    const body = await response.text();
    return resolveInput(body);
  }

  if (/^[\w.-]+\/[\w.-]+$/.test(value)) {
    return [
      {
        name: value,
        kind: "input",
        npmUrl: `https://github.com/${value}`,
        repositoryUrl: `https://github.com/${value}`,
      },
    ];
  }

  const packageSpec = parsePackageSpecifier(value);
  return [await resolvePackage(packageSpec.name, packageSpec.spec)];
}

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

export function getYamlDependencyLinks(
  document: vscode.TextDocument,
): vscode.DocumentLink[] {
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
      new vscode.Range(
        lineIndex,
        start,
        lineIndex,
        start + name.length,
      ),
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
