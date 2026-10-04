import type { DependencyImpact, DependencyReference, DependencyResult } from "../shared/types";

export function buildDependencyImpact(
  results: DependencyResult[],
  references: DependencyReference[],
  packageName: string,
): DependencyImpact {
  const selected =
    results.find((item) => item.name === packageName) ??
    results.flatMap((item) => item.dependencies ?? []).find((item) => item.name === packageName);

  const manifestDependents = references
    .filter((reference) => reference.packageName === packageName && reference.kind === "manifest")
    .map((reference) => ({
      workspace: reference.workspace,
      relativePath: reference.relativePath,
      dependencyKind: reference.dependencyKind,
    }))
    .filter(
      (dependent, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.workspace === dependent.workspace &&
            candidate.relativePath === dependent.relativePath &&
            candidate.dependencyKind === dependent.dependencyKind,
        ) === index,
    );

  const graphDependents = buildReverseDependents(results, packageName);
  const dependents = [...manifestDependents, ...graphDependents].filter(
    (dependent, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.workspace === dependent.workspace &&
          candidate.relativePath === dependent.relativePath &&
          candidate.dependencyKind === dependent.dependencyKind &&
          candidate.packageName === dependent.packageName,
      ) === index,
  );

  return {
    packageName,
    dependents,
    dependencies:
      "dependencies" in (selected ?? {}) &&
      Array.isArray((selected as DependencyResult).dependencies)
        ? ((selected as DependencyResult).dependencies ?? [])
        : [],
  };
}

export function buildReverseDependents(results: DependencyResult[], target: string) {
  const reverse = new Map<string, Set<string>>();
  const walk = (parent: DependencyResult, ancestry: Set<string>) => {
    if (ancestry.has(parent.name)) return;
    const next = new Set(ancestry).add(parent.name);
    for (const child of parent.dependencies ?? []) {
      (reverse.get(child.name) ?? reverse.set(child.name, new Set()).get(child.name)!).add(
        parent.name,
      );
      walk(child, next);
    }
  };
  results.forEach((result) => walk(result, new Set()));
  const queue = [...(reverse.get(target) ?? [])].map((name) => ({ name, depth: 1 }));
  const seen = new Set<string>();
  const output: {
    packageName: string;
    relativePath: string;
    dependencyKind?: string;
    depth: number;
  }[] = [];
  while (queue.length) {
    const current = queue.shift()!;
    if (seen.has(current.name)) continue;
    seen.add(current.name);
    output.push({
      packageName: current.name,
      relativePath: current.name,
      dependencyKind: "transitive",
      depth: current.depth,
    });
    for (const parent of reverse.get(current.name) ?? [])
      queue.push({ name: parent, depth: current.depth + 1 });
  }
  return output;
}
