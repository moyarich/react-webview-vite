import { useState } from "react";
import type {
  DependencyImpact,
  DependencyReference,
  DependencyVersionContext,
} from "../../shared/types";
import { Badge } from "../shared/components/vscode-ui";

type BottomTab = "references" | "dependents" | "dependencies" | "versions";

export function ExplorerBottomPanel({
  packageName,
  references,
  impact,
  version,
  isLoadingReferences,
  referencesError,
  onOpenReference,
  onSelectPackage,
}: {
  packageName?: string;
  references: DependencyReference[];
  impact?: DependencyImpact;
  version?: DependencyVersionContext;
  isLoadingReferences: boolean;
  referencesError?: string;
  onOpenReference: (reference: DependencyReference) => void;
  onSelectPackage: (packageName: string) => void;
}) {
  const [tab, setTab] = useState<BottomTab>("references");

  return (
    <section className="min-h-[190px] border-t border-[var(--dependency-links-border)] bg-[var(--vscode-panel-background,var(--dependency-links-background))]">
      <div className="flex items-center gap-1 border-b border-[var(--dependency-links-border)] px-3">
        <TabButton
          active={tab === "references"}
          onClick={() => setTab("references")}
          label="References"
          count={references.length}
        />
        <TabButton
          active={tab === "dependents"}
          onClick={() => setTab("dependents")}
          label="Dependents"
          count={impact?.dependents.length ?? 0}
        />
        <TabButton
          active={tab === "dependencies"}
          onClick={() => setTab("dependencies")}
          label="Dependencies"
          count={impact?.dependencies.length ?? 0}
        />
        <TabButton
          active={tab === "versions"}
          onClick={() => setTab("versions")}
          label="Versions"
        />
      </div>

      <div className="max-h-[280px] overflow-auto">
        {!packageName ? (
          <EmptyPanel>Select a package to inspect its workspace impact.</EmptyPanel>
        ) : tab === "references" ? (
          isLoadingReferences ? (
            <EmptyPanel>Finding workspace references…</EmptyPanel>
          ) : referencesError ? (
            <EmptyPanel error>{referencesError}</EmptyPanel>
          ) : references.length === 0 ? (
            <EmptyPanel>No references found in the current scope.</EmptyPanel>
          ) : (
            <div className="divide-y divide-[var(--dependency-links-border)]">
              {references.map((reference, index) => (
                <button
                  key={[
                    reference.uri,
                    reference.line,
                    reference.column ?? 0,
                    reference.kind,
                    index,
                  ].join(":")}
                  type="button"
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 bg-transparent px-4 py-2 text-left text-inherit hover:bg-[var(--dependency-links-accent)]"
                  onClick={() => onOpenReference(reference)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{reference.relativePath}</span>
                    {reference.text ? (
                      <code className="mt-0.5 block truncate text-xs text-[var(--dependency-links-muted-foreground)]">
                        {reference.text}
                      </code>
                    ) : null}
                  </span>
                  <Badge variant="outline">{reference.kind}</Badge>
                  <span className="font-mono text-xs text-[var(--dependency-links-muted-foreground)]">
                    {reference.line + 1}:{(reference.column ?? 0) + 1}
                  </span>
                </button>
              ))}
            </div>
          )
        ) : tab === "dependents" ? (
          impact && impact.dependents.length > 0 ? (
            <div className="divide-y divide-[var(--dependency-links-border)]">
              {impact.dependents.map((dependent) => (
                <div
                  key={[
                    dependent.workspace ?? "",
                    dependent.relativePath,
                    dependent.dependencyKind ?? "",
                  ].join(":")}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <span className="truncate text-sm">{dependent.relativePath}</span>
                  <span className="text-xs text-[var(--dependency-links-muted-foreground)]">
                    {dependent.dependencyKind ?? "dependency"}
                    {dependent.workspace ? " · " + dependent.workspace : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel>No manifest dependents found in the current scope.</EmptyPanel>
          )
        ) : tab === "dependencies" ? (
          impact && impact.dependencies.length > 0 ? (
            <div className="divide-y divide-[var(--dependency-links-border)]">
              {impact.dependencies.map((dependency) => (
                <button
                  key={[dependency.kind, dependency.name, dependency.spec ?? ""].join(":")}
                  type="button"
                  className="flex w-full items-center justify-between gap-4 bg-transparent px-4 py-3 text-left text-inherit hover:bg-[var(--dependency-links-accent)]"
                  onClick={() => onSelectPackage(dependency.name)}
                >
                  <span className="text-sm">{dependency.name}</span>
                  <span className="font-mono text-xs text-[var(--dependency-links-muted-foreground)]">
                    {dependency.spec ?? dependency.kind}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyPanel>No resolved package dependencies.</EmptyPanel>
          )
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <VersionValue label="Declared" value={version?.declaredVersion} />
            <VersionValue label="Resolved" value={version?.resolvedVersion} />
            <VersionValue label="Latest" value={version?.latestVersion} />
            <VersionValue label="Status" value={version?.status} />
          </div>
        )}
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      className={
        "border-b-2 px-3 py-2.5 text-sm " +
        (active
          ? "border-[var(--dependency-links-ring)] text-[var(--dependency-links-foreground)]"
          : "border-transparent text-[var(--dependency-links-muted-foreground)] hover:text-[var(--dependency-links-foreground)]")
      }
      onClick={onClick}
    >
      {label}
      {count !== undefined ? (
        <span className="ml-1.5 rounded-full bg-[var(--dependency-links-muted)] px-1.5 py-0.5 text-[10px]">
          {count}
        </span>
      ) : null}
    </button>
  );
}

function EmptyPanel({ children, error = false }: { children: string; error?: boolean }) {
  return (
    <div
      className={
        "p-5 text-sm " +
        (error
          ? "text-[var(--dependency-links-error)]"
          : "text-[var(--dependency-links-muted-foreground)]")
      }
    >
      {children}
    </div>
  );
}

function VersionValue({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--dependency-links-muted-foreground)]">{label}</div>
      <div className="mt-1 font-mono text-sm">{value ?? "—"}</div>
    </div>
  );
}
