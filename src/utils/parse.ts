import type { DependencyEntry, DependencyKind } from "../shared/types";

export const DEPENDENCY_SECTIONS = new Set([
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
  "bundledDependencies",
  "bundleDependencies",
]);

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

    for (const [name, spec] of Object.entries(sectionValue as Record<string, unknown>)) {
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
  if (values.length > 0 && values.every((item) => typeof item === "string")) {
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
  return at > 0 ? { name: value.slice(0, at), spec: value.slice(at + 1) } : { name: value };
}
