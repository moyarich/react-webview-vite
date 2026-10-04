import type { DependencyKind, DependencyReference, DependencyResult } from "../shared/types";

export type DependencyFilterState = {
  workspaceId: string;
  enabledKinds: DependencyKind[];
};

export function filterDependencyResults(
  results: DependencyResult[],
  filters: DependencyFilterState,
) {
  return results.filter(
    (result) =>
      filters.enabledKinds.includes(result.kind) &&
      (filters.workspaceId === "all" ||
        result.workspaceId === filters.workspaceId ||
        result.workspaceId === undefined),
  );
}

export function filterDependencyReferences(references: DependencyReference[], workspaceId: string) {
  return workspaceId === "all"
    ? references
    : references.filter((reference) => reference.workspace === workspaceId);
}
