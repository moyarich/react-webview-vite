import type { ReactNode } from "react";
import type { DependencyKind, DependencyResult, WorkspaceManifest } from "../../shared/types";
import { Badge, Button } from "../shared/components/vscode-ui";

export type ExplorerView = "graph" | "packages" | "references";

const FILTERABLE_KINDS: DependencyKind[] = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
  "bundledDependencies",
  "bundleDependencies",
];

export function ExplorerSidebar({
  activeView,
  onViewChange,
  manifests,
  results,
  activeWorkspace,
  onWorkspaceChange,
  enabledKinds,
  onToggleKind,
  onResetFilters,
  manualInput,
}: {
  activeView: ExplorerView;
  onViewChange: (view: ExplorerView) => void;
  manifests: WorkspaceManifest[];
  results: DependencyResult[];
  activeWorkspace: string;
  onWorkspaceChange: (workspaceId: string) => void;
  enabledKinds: DependencyKind[];
  onToggleKind: (kind: DependencyKind) => void;
  onResetFilters: () => void;
  manualInput: ReactNode;
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-[var(--dependency-links-border)] bg-[var(--vscode-sideBar-background,var(--dependency-links-card))]">
      <div className="border-b border-[var(--dependency-links-border)] p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--dependency-links-muted-foreground)]">
          Dependency Links
        </div>
        <nav className="space-y-1" aria-label="Dependency explorer">
          {(
            [
              ["graph", "Graph"],
              ["packages", "Packages"],
              ["references", "References"],
            ] as const
          ).map(([view, label]) => (
            <button
              key={view}
              type="button"
              onClick={() => onViewChange(view)}
              aria-current={activeView === view ? "page" : undefined}
              className={
                "flex w-full items-center rounded-md px-2.5 py-2 text-left text-sm " +
                (activeView === view
                  ? "bg-[var(--vscode-list-activeSelectionBackground,var(--dependency-links-primary))] text-[var(--vscode-list-activeSelectionForeground,var(--dependency-links-primary-foreground))]"
                  : "bg-transparent text-inherit hover:bg-[var(--dependency-links-accent)]")
              }
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <section>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--dependency-links-muted-foreground)]">
            Workspace
          </div>
          <div className="space-y-1">
            <ScopeButton
              label="All packages"
              count={manifests.length}
              active={activeWorkspace === "all"}
              onClick={() => onWorkspaceChange("all")}
            />
            {manifests.map((manifest) => (
              <ScopeButton
                key={manifest.id}
                label={manifest.name ?? manifest.id}
                count={manifest.dependencies.length}
                active={activeWorkspace === manifest.id}
                onClick={() => onWorkspaceChange(manifest.id)}
              />
            ))}
          </div>
        </section>

        <section className="mt-5 border-t border-[var(--dependency-links-border)] pt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--dependency-links-muted-foreground)]">
            Dependency type
          </div>
          <div className="space-y-2">
            {FILTERABLE_KINDS.map((kind) => (
              <label
                key={kind}
                className="flex cursor-pointer items-center justify-between gap-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enabledKinds.includes(kind)}
                    onChange={() => onToggleKind(kind)}
                  />
                  <span className="truncate">{formatKind(kind)}</span>
                </span>
                <span className="text-xs text-[var(--dependency-links-muted-foreground)]">
                  {
                    results.filter(
                      (result) =>
                        result.kind === kind &&
                        (activeWorkspace === "all" || result.workspaceId === activeWorkspace),
                    ).length
                  }
                </span>
              </label>
            ))}
          </div>
          <Button variant="ghost" className="mt-3 w-full" onClick={onResetFilters}>
            Reset filters
          </Button>
        </section>

        <details className="mt-5 border-t border-[var(--dependency-links-border)] pt-4">
          <summary className="cursor-pointer text-sm font-medium">Manual manifest</summary>
          <div className="mt-3">{manualInput}</div>
        </details>
      </div>
    </aside>
  );
}

function ScopeButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm " +
        (active
          ? "bg-[var(--dependency-links-accent)]"
          : "bg-transparent hover:bg-[var(--dependency-links-accent)]")
      }
    >
      <span className="truncate">{label}</span>
      <Badge variant={active ? "default" : "outline"}>{count}</Badge>
    </button>
  );
}

function formatKind(kind: DependencyKind) {
  switch (kind) {
    case "dependencies":
      return "Production";
    case "devDependencies":
      return "Development";
    case "peerDependencies":
      return "Peer";
    case "optionalDependencies":
      return "Optional";
    case "bundledDependencies":
    case "bundleDependencies":
      return "Bundled";
    default:
      return kind;
  }
}

export { FILTERABLE_KINDS };
