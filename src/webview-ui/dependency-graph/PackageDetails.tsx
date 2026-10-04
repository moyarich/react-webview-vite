import type {
  DependencyKind,
  DependencyResult,
  DependencyVersionContext,
} from "../../shared/types";
import { Badge, CardDescription, LinkButton } from "../shared/components/vscode-ui";

export function PackageDetails({
  packageName,
  spec,
  kind,
  result,
  version,
}: {
  packageName?: string;
  spec?: string;
  kind?: DependencyKind;
  result?: DependencyResult;
  version?: DependencyVersionContext;
}) {
  if (!packageName) {
    return (
      <aside className="border-l border-[var(--dependency-links-border)] p-5 text-sm text-[var(--dependency-links-muted-foreground)]">
        Select a package to inspect metadata, relationships, references, and versions.
      </aside>
    );
  }

  return (
    <aside className="h-full min-h-0 overflow-auto border-l border-[var(--dependency-links-border)] bg-[var(--vscode-sideBar-background,var(--dependency-links-card))]">
      <div className="border-b border-[var(--dependency-links-border)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="m-0 truncate text-xl font-semibold">{packageName}</h2>
            <div className="mt-1 font-mono text-xs text-[var(--dependency-links-muted-foreground)]">
              {spec ?? version?.resolvedVersion ?? "version unknown"}
            </div>
          </div>
          {kind ? <Badge variant="outline">{formatKind(kind)}</Badge> : null}
        </div>
      </div>

      <div className="space-y-5 p-5">
        <section>
          <h3 className="m-0 text-sm font-semibold">Overview</h3>
          <CardDescription className="mt-2">
            Package metadata resolved from the npm registry and current workspace.
          </CardDescription>
          <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
            <dt className="text-[var(--dependency-links-muted-foreground)]">Declared</dt>
            <dd className="m-0 truncate font-mono">{version?.declaredVersion ?? spec ?? "—"}</dd>
            <dt className="text-[var(--dependency-links-muted-foreground)]">Resolved</dt>
            <dd className="m-0 truncate font-mono">{version?.resolvedVersion ?? "—"}</dd>
            <dt className="text-[var(--dependency-links-muted-foreground)]">Latest</dt>
            <dd className="m-0 truncate font-mono">
              {version?.latestVersion ?? result?.latestVersion ?? "—"}
            </dd>
            <dt className="text-[var(--dependency-links-muted-foreground)]">Status</dt>
            <dd className="m-0">
              {version ? <Badge variant="outline">{version.status}</Badge> : "—"}
            </dd>
            {result?.manifestPath ? (
              <>
                <dt className="text-[var(--dependency-links-muted-foreground)]">Manifest</dt>
                <dd className="m-0 truncate">{result.manifestPath}</dd>
              </>
            ) : null}
          </dl>
        </section>

        <section className="border-t border-[var(--dependency-links-border)] pt-4">
          <h3 className="m-0 text-sm font-semibold">Open package</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {result?.repositoryUrl ? (
              <LinkButton variant="secondary" href={result.repositoryUrl}>
                Repository
              </LinkButton>
            ) : null}
            {result?.npmUrl ? (
              <LinkButton variant="secondary" href={result.npmUrl}>
                npm
              </LinkButton>
            ) : null}
            {result?.homepageUrl ? (
              <LinkButton variant="secondary" href={result.homepageUrl}>
                Homepage
              </LinkButton>
            ) : null}
          </div>
        </section>

        {version?.lockfilePath ? (
          <section className="border-t border-[var(--dependency-links-border)] pt-4">
            <h3 className="m-0 text-sm font-semibold">Resolution source</h3>
            <code className="mt-2 block break-all text-xs text-[var(--dependency-links-muted-foreground)]">
              {version.lockfilePath}
            </code>
          </section>
        ) : null}
      </div>
    </aside>
  );
}

function formatKind(kind: DependencyKind) {
  return kind === "dependencies"
    ? "Direct dependency"
    : kind === "devDependencies"
      ? "Development"
      : kind === "peerDependencies"
        ? "Peer"
        : kind === "optionalDependencies"
          ? "Optional"
          : kind;
}
