import type { DependencyImpact, DependencyReference, DependencyResult } from "../shared/types";

export function buildDependencyImpact(
  results: DependencyResult[],
  references: DependencyReference[],
  packageName: string,
): DependencyImpact {
  const selected =
    results.find((item) => item.name === packageName) ??
    results.flatMap((item) => item.dependencies ?? []).find((item) => item.name === packageName);

  const dependents = references
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
