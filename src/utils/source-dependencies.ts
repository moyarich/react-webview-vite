import type { DependencyReferenceKind, ParsedDependencyReference } from "../shared/types";

type PositionedReference = { start: number; end: number };
type ReferenceBucket = Record<string, PositionedReference[]> | undefined;
type SourceReferenceKind = Exclude<DependencyReferenceKind, "manifest">;

const SOURCE_BUCKETS: Array<[key: string, kind: SourceReferenceKind]> = [
  ["namedImports", "import"],
  ["namespaceImports", "import"],
  ["dynamicImports", "dynamic-import"],
  ["requires", "require"],
  ["typeNamedImports", "type-import"],
  ["typeNamespaceImports", "type-import"],
  ["typeDynamicImports", "type-import"],
  ["namedReexports", "reexport"],
  ["namespaceReexports", "reexport"],
  ["starReexports", "reexport"],
  ["typeNamedReexports", "reexport"],
  ["typeNamespaceReexports", "reexport"],
  ["typeStarReexports", "reexport"],
];

let parserModule: Promise<typeof import("parse-imports-exports")> | undefined;

export function normalizePackageName(specifier: string): string | undefined {
  const value = specifier.trim();

  if (
    !value ||
    value.startsWith(".") ||
    value.startsWith("/") ||
    value.startsWith("#") ||
    value.startsWith("node:") ||
    value.startsWith("data:")
  ) {
    return undefined;
  }

  if (value.startsWith("@")) {
    const [scope, name] = value.split("/");
    return scope && name ? scope + "/" + name : undefined;
  }

  return value.split("/")[0] || undefined;
}

export async function parseSourceDependencyReferences(
  source: string,
): Promise<ParsedDependencyReference[]> {
  parserModule ??= import("parse-imports-exports");
  const { parseImportsExports } = await parserModule;
  const parsed = parseImportsExports(source) as unknown as Record<string, unknown>;
  const references: ParsedDependencyReference[] = [];

  for (const [bucketName, kind] of SOURCE_BUCKETS) {
    const bucket = parsed[bucketName] as ReferenceBucket;

    if (!bucket) continue;

    for (const [specifier, positions] of Object.entries(bucket)) {
      const packageName = normalizePackageName(specifier);
      if (!packageName) continue;

      for (const position of positions) {
        const location = offsetToLineColumn(source, position.start);
        references.push({
          packageName,
          specifier,
          kind,
          start: position.start,
          end: position.end,
          line: location.line,
          column: location.column,
          text: source.slice(position.start, position.end).split(/\r?\n/, 1)[0]?.trim(),
        });
      }
    }
  }

  return dedupeReferences(references);
}

function dedupeReferences(references: ParsedDependencyReference[]) {
  const seen = new Set<string>();
  return references.filter((reference) => {
    const key = [reference.kind, reference.specifier, reference.start, reference.end].join("\0");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function offsetToLineColumn(source: string, offset: number) {
  const before = source.slice(0, Math.max(0, offset));
  const lines = before.split(/\r?\n/);
  return { line: Math.max(0, lines.length - 1), column: lines.at(-1)?.length ?? 0 };
}
