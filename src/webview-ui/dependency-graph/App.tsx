import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { formatMessage } from "../../shared/localization";
import type {
  DependencyLinksExtensionMessage,
  DependencyLinksWebviewRequest,
} from "../../shared/messages";
import type {
  DependencyKind,
  DependencyReference,
  DependencyResult,
  WorkspaceManifest,
} from "../../shared/types";
import {
  buildDependencyImpact,
  createVersionContext,
  filterDependencyReferences,
  filterDependencyResults,
  resolveInput,
  resolvePackage,
} from "../../utils";
import { getVsCodeState, postVsCodeMessage, setVsCodeState } from "../shared/api/vscode-api";
import { Badge, Button, EmptyState, StatusLine } from "../shared/components/vscode-ui";
import { messages } from "../shared/localization";
import { buildDependencyGraph } from "./graph";
import { ExplorerSidebar, FILTERABLE_KINDS, type ExplorerView } from "./ExplorerSidebar";
import { ExplorerBottomPanel } from "./ExplorerBottomPanel";
import { PackageDetails } from "./PackageDetails";

type AppState = { input: string };

const CodeEditor = lazy(() =>
  import("../shared/components/code-editor").then((module) => ({
    default: module.CodeEditor,
  })),
);

const DependencyFlow = lazy(() => import("./DependencyFlow"));

const defaultInput =
  '{\n  "dependencies": {\n    "react": "^19.2.0"\n  },\n  "devDependencies": {\n    "vite": "^8.0.0"\n  }\n}';

function App() {
  const savedState = getVsCodeState<AppState>();
  const [input, setInput] = useState(savedState?.input ?? defaultInput);
  const [activeView, setActiveView] = useState<ExplorerView>("graph");
  const [results, setResults] = useState<DependencyResult[]>([]);
  const [workspaceManifests, setWorkspaceManifests] = useState<WorkspaceManifest[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState("all");
  const [enabledKinds, setEnabledKinds] = useState<DependencyKind[]>(FILTERABLE_KINDS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(messages.readyGraph);
  const [error, setError] = useState<string>();
  const [isResolving, setIsResolving] = useState(false);
  const [selectedPackageName, setSelectedPackageName] = useState<string>();
  const [references, setReferences] = useState<DependencyReference[]>([]);
  const [referencesError, setReferencesError] = useState<string>();
  const [isLoadingReferences, setIsLoadingReferences] = useState(false);
  const [resolvedVersion, setResolvedVersion] = useState<string>();
  const [lockfilePath, setLockfilePath] = useState<string>();

  useEffect(() => {
    setVsCodeState({ input });
  }, [input]);

  useEffect(() => {
    postVsCodeMessage<DependencyLinksWebviewRequest>({
      type: "dependencyLinks/listWorkspaceManifests",
    });
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent<DependencyLinksExtensionMessage>) => {
      const message = event.data;

      if (message.type === "dependencyLinks/workspaceManifests") {
        setWorkspaceManifests(message.manifests);
        void loadWorkspaceResults(message.manifests);
        return;
      }

      if (message.type === "dependencyLinks/references") {
        if (message.packageName !== selectedPackageName) {
          return;
        }

        setReferences(message.references);
        setReferencesError(undefined);
        setIsLoadingReferences(false);
        return;
      }

      if (message.type === "dependencyLinks/referencesError") {
        if (message.packageName !== selectedPackageName) {
          return;
        }

        setReferences([]);
        setReferencesError(message.message);
        setIsLoadingReferences(false);
        return;
      }

      if (message.type === "dependencyLinks/versionContext") {
        const requestedWorkspace = activeWorkspace === "all" ? undefined : activeWorkspace;

        if (
          message.packageName !== selectedPackageName ||
          message.workspaceId !== requestedWorkspace
        ) {
          return;
        }

        setResolvedVersion(message.resolvedVersion);
        setLockfilePath(message.lockfilePath);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [activeWorkspace, selectedPackageName]);

  useEffect(() => {
    if (!selectedPackageName) {
      setResolvedVersion(undefined);
      setLockfilePath(undefined);
      return;
    }

    setResolvedVersion(undefined);
    setLockfilePath(undefined);
    postVsCodeMessage<DependencyLinksWebviewRequest>({
      type: "dependencyLinks/getVersionContext",
      packageName: selectedPackageName,
      workspaceId: activeWorkspace === "all" ? undefined : activeWorkspace,
    });
  }, [activeWorkspace, selectedPackageName]);

  const filteredResults = useMemo(
    () =>
      filterDependencyResults(results, {
        workspaceId: activeWorkspace,
        enabledKinds,
      }),
    [activeWorkspace, enabledKinds, results],
  );

  const visibleResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return filteredResults;
    const referencedPackages = new Set(
      scopedReferences
        .filter(
          (reference) =>
            reference.packageName.toLowerCase().includes(query) ||
            reference.relativePath.toLowerCase().includes(query) ||
            reference.specifier.toLowerCase().includes(query),
        )
        .map((reference) => reference.packageName),
    );
    return filteredResults.filter(
      (result) =>
        result.name.toLowerCase().includes(query) ||
        result.workspaceId?.toLowerCase().includes(query) ||
        result.kind.toLowerCase().includes(query) ||
        referencedPackages.has(result.name),
    );
  }, [filteredResults, scopedReferences, search]);

  const scopedReferences = useMemo(
    () => filterDependencyReferences(references, activeWorkspace),
    [activeWorkspace, references],
  );

  const graph = useMemo(() => buildDependencyGraph(visibleResults), [visibleResults]);

  const selectedDirectResult = useMemo(
    () => filteredResults.find((item) => item.name === selectedPackageName),
    [filteredResults, selectedPackageName],
  );

  const selectedEntry = useMemo(
    () =>
      selectedDirectResult ??
      filteredResults
        .flatMap((item) => item.dependencies ?? [])
        .find((item) => item.name === selectedPackageName),
    [filteredResults, selectedDirectResult, selectedPackageName],
  );

  const versionContext = useMemo(
    () =>
      selectedPackageName
        ? createVersionContext({
            packageName: selectedPackageName,
            declaredVersion: selectedEntry?.spec,
            resolvedVersion,
            latestVersion: selectedDirectResult?.latestVersion,
            lockfilePath,
          })
        : undefined,
    [lockfilePath, resolvedVersion, selectedDirectResult, selectedEntry, selectedPackageName],
  );

  const impact = useMemo(
    () =>
      selectedPackageName
        ? buildDependencyImpact(filteredResults, scopedReferences, selectedPackageName)
        : undefined,
    [filteredResults, scopedReferences, selectedPackageName],
  );

  async function loadWorkspaceResults(manifests: WorkspaceManifest[]) {
    const entries = manifests.flatMap((manifest) =>
      manifest.dependencies.map((dependency) => ({ manifest, dependency })),
    );

    if (entries.length === 0) {
      return;
    }

    setIsResolving(true);
    setError(undefined);
    setStatus("Loading workspace dependencies…");

    try {
      const resolved = await Promise.all(
        entries.map(async ({ manifest, dependency }) => ({
          ...(await resolvePackage(dependency.name, dependency.spec, dependency.kind)),
          workspaceId: manifest.id,
          manifestPath: manifest.relativePath,
        })),
      );

      setResults(resolved);
      setStatus(formatMessage(messages.graphContainsCount, resolved.length));
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : String(resolveError));
    } finally {
      setIsResolving(false);
    }
  }

  async function resolveManualInput() {
    setIsResolving(true);
    setError(undefined);
    setStatus(messages.resolving);
    setActiveWorkspace("all");

    try {
      const resolved = await resolveInput(input);
      setResults(resolved);
      setSelectedPackageName(undefined);
      setReferences([]);
      setStatus(
        resolved.length === 0
          ? messages.noDependencies
          : formatMessage(messages.graphContainsCount, resolved.length),
      );
    } catch (resolveError) {
      setResults([]);
      setStatus(messages.graphResolutionFailed);
      setError(
        resolveError instanceof Error ? resolveError.message : messages.graphResolutionFailed,
      );
    } finally {
      setIsResolving(false);
    }
  }

  function resetFilters() {
    setActiveWorkspace("all");
    setEnabledKinds(FILTERABLE_KINDS);
    setSearch("");
  }

  function toggleKind(kind: DependencyKind) {
    setEnabledKinds((current) =>
      current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind],
    );
  }

  function selectPackage(packageName: string) {
    setSelectedPackageName(packageName);
    setReferences([]);
    setReferencesError(undefined);
    setIsLoadingReferences(true);
    postVsCodeMessage<DependencyLinksWebviewRequest>({
      type: "dependencyLinks/findReferences",
      packageName,
    });
  }

  function openReference(reference: DependencyReference) {
    postVsCodeMessage<DependencyLinksWebviewRequest>({
      type: "dependencyLinks/openReference",
      reference: {
        uri: reference.uri,
        line: reference.line,
        column: reference.column,
      },
    });
  }

  const manualInput = (
    <>
      <Suspense
        fallback={
          <div className="h-[180px] animate-pulse rounded-md border border-[var(--dependency-links-border)] bg-[var(--dependency-links-muted)]" />
        }
      >
        <CodeEditor
          value={input}
          onChange={setInput}
          modelPath="dependency-links://dependency-explorer/package.json"
          height={180}
        />
      </Suspense>
      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusLine error={Boolean(error)}>
          {error ?? (isResolving ? messages.resolving : status)}
        </StatusLine>
        <Button onClick={resolveManualInput} disabled={isResolving || !input.trim()}>
          {messages.buildGraph}
        </Button>
      </div>
    </>
  );

  return (
    <main className="h-screen min-h-[560px] overflow-hidden bg-[var(--dependency-links-background)]">
      <div className="grid h-full grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] lg:grid-cols-[270px_minmax(0,1fr)_320px] lg:grid-rows-[minmax(0,1fr)_240px]">
        <div className="hidden min-h-0 lg:row-span-2 lg:block">
          <ExplorerSidebar
            activeView={activeView}
            onViewChange={setActiveView}
            manifests={workspaceManifests}
            results={results}
            activeWorkspace={activeWorkspace}
            onWorkspaceChange={setActiveWorkspace}
            enabledKinds={enabledKinds}
            onToggleKind={toggleKind}
            onResetFilters={resetFilters}
            manualInput={manualInput}
          />
        </div>

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <header className="flex min-h-[74px] items-center justify-between gap-4 border-b border-[var(--dependency-links-border)] px-5 py-3">
            <div className="min-w-0">
              <h1 className="m-0 truncate text-xl font-semibold">Dependency Explorer</h1>
              <p className="m-0 mt-1 truncate text-sm text-[var(--dependency-links-muted-foreground)]">
                Explore package relationships, usage, versions, and source references.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isResolving ? <Badge variant="outline">Resolving…</Badge> : null}
              <Badge variant="outline">{visibleResults.length} packages</Badge>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-[var(--dependency-links-border)] px-4 py-2">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search packages…"
                className="h-8 min-w-0 flex-1 rounded-md border border-[var(--dependency-links-border)] bg-[var(--dependency-links-input)] px-3 text-sm text-[var(--dependency-links-input-foreground)] outline-none placeholder:text-[var(--dependency-links-placeholder)] focus:border-[var(--dependency-links-ring)]"
              />
              <Button variant="ghost" onClick={resetFilters}>
                Reset
              </Button>
            </div>

            <div className="min-h-0 flex-1">
              {activeView === "graph" ? (
                visibleResults.length === 0 ? (
                  <div className="p-5">
                    <EmptyState
                      title={messages.noGraphTitle}
                      description="No packages match the active workspace, type, and search filters."
                    />
                  </div>
                ) : (
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center text-sm text-[var(--dependency-links-muted-foreground)]">
                        Loading graph…
                      </div>
                    }
                  >
                    <DependencyFlow
                      nodes={graph.nodes}
                      edges={graph.edges}
                      selectedPackageName={selectedPackageName}
                      onPackageSelect={selectPackage}
                    />
                  </Suspense>
                )
              ) : activeView === "packages" ? (
                <PackageList
                  results={visibleResults}
                  selectedPackageName={selectedPackageName}
                  onSelectPackage={selectPackage}
                />
              ) : (
                <ReferenceList
                  packageName={selectedPackageName}
                  references={scopedReferences}
                  loading={isLoadingReferences}
                  error={referencesError}
                  onOpenReference={openReference}
                />
              )}
            </div>
          </div>
        </section>

        <div className="hidden min-h-0 lg:block">
          <PackageDetails
            packageName={selectedPackageName}
            spec={selectedEntry?.spec}
            kind={selectedEntry?.kind}
            result={selectedDirectResult}
            version={versionContext}
          />
        </div>

        <div className="hidden min-h-0 lg:col-span-2 lg:block">
          <ExplorerBottomPanel
            packageName={selectedPackageName}
            references={scopedReferences}
            impact={impact}
            version={versionContext}
            isLoadingReferences={isLoadingReferences}
            referencesError={referencesError}
            onOpenReference={openReference}
            onSelectPackage={selectPackage}
          />
        </div>

        <div className="border-t border-[var(--dependency-links-border)] p-3 lg:hidden">
          <div className="flex gap-2 overflow-auto">
            {(["graph", "packages", "references"] as ExplorerView[]).map((view) => (
              <Button
                key={view}
                variant={activeView === view ? "default" : "ghost"}
                onClick={() => setActiveView(view)}
              >
                {view[0].toUpperCase() + view.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function SearchResults({
  results,
  references,
  query,
  selectedPackageName,
  onSelectPackage,
  onOpenReference,
}: {
  results: DependencyResult[];
  references: DependencyReference[];
  query: string;
  selectedPackageName?: string;
  onSelectPackage: (packageName: string) => void;
  onOpenReference: (reference: DependencyReference) => void;
}) {
  const normalized = query.trim().toLowerCase();
  const matchingReferences = normalized
    ? references.filter(
        (reference) =>
          reference.packageName.toLowerCase().includes(normalized) ||
          reference.relativePath.toLowerCase().includes(normalized) ||
          reference.specifier.toLowerCase().includes(normalized),
      )
    : [];
  return (
    <div className="h-full overflow-auto">
      <PackageList
        results={results}
        selectedPackageName={selectedPackageName}
        onSelectPackage={onSelectPackage}
      />
      {matchingReferences.length > 0 ? (
        <div className="border-t border-[var(--dependency-links-border)]">
          {matchingReferences.map((reference, index) => (
            <button
              key={`${reference.uri}:${reference.line}:${index}`}
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-[var(--dependency-links-accent)]"
              onClick={() => onOpenReference(reference)}
            >
              <span className="truncate text-sm">
                {reference.packageName} · {reference.relativePath}
              </span>
              <span className="text-xs text-[var(--dependency-links-muted-foreground)]">
                {reference.kind}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PackageList({
  results,
  selectedPackageName,
  onSelectPackage,
}: {
  results: DependencyResult[];
  selectedPackageName?: string;
  onSelectPackage: (packageName: string) => void;
}) {
  if (results.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          title="No packages"
          description="Adjust the workspace, dependency type, or search filters."
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="grid grid-cols-[minmax(0,1fr)_160px_160px] border-b border-[var(--dependency-links-border)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--dependency-links-muted-foreground)]">
        <span>Package</span>
        <span>Type</span>
        <span>Workspace</span>
      </div>
      {results.map((result, index) => (
        <button
          key={[result.workspaceId ?? "", result.kind, result.name, result.spec ?? "", index].join(
            ":",
          )}
          type="button"
          className={
            "grid w-full grid-cols-[minmax(0,1fr)_160px_160px] border-b border-[var(--dependency-links-border)] px-4 py-3 text-left text-sm text-inherit " +
            (selectedPackageName === result.name
              ? "bg-[var(--dependency-links-accent)]"
              : "bg-transparent hover:bg-[var(--dependency-links-accent)]")
          }
          onClick={() => onSelectPackage(result.name)}
        >
          <span className="min-w-0">
            <span className="block truncate font-medium">{result.name}</span>
            <span className="mt-0.5 block truncate font-mono text-xs text-[var(--dependency-links-muted-foreground)]">
              {result.spec ?? result.latestVersion ?? "—"}
            </span>
          </span>
          <span className="truncate">{result.kind}</span>
          <span className="truncate text-[var(--dependency-links-muted-foreground)]">
            {result.workspaceId ?? "manual"}
          </span>
        </button>
      ))}
    </div>
  );
}

function ReferenceList({
  packageName,
  references,
  loading,
  error,
  onOpenReference,
}: {
  packageName?: string;
  references: DependencyReference[];
  loading: boolean;
  error?: string;
  onOpenReference: (reference: DependencyReference) => void;
}) {
  if (!packageName) {
    return (
      <div className="p-5">
        <EmptyState
          title="Select a package"
          description="Choose a package from the graph or package list to find workspace references."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-5 text-sm text-[var(--dependency-links-muted-foreground)]">
        Finding references for {packageName}…
      </div>
    );
  }

  if (error) {
    return <div className="p-5 text-sm text-[var(--dependency-links-error)]">{error}</div>;
  }

  if (references.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          title="No references"
          description="No source or manifest references were found in the active workspace scope."
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto divide-y divide-[var(--dependency-links-border)]">
      {references.map((reference, index) => (
        <button
          key={[reference.uri, reference.line, reference.column ?? 0, reference.kind, index].join(
            ":",
          )}
          type="button"
          className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-4 bg-transparent px-4 py-3 text-left text-inherit hover:bg-[var(--dependency-links-accent)]"
          onClick={() => onOpenReference(reference)}
        >
          <span className="min-w-0">
            <span className="block truncate text-sm">{reference.relativePath}</span>
            {reference.text ? (
              <code className="mt-1 block truncate text-xs text-[var(--dependency-links-muted-foreground)]">
                {reference.text}
              </code>
            ) : null}
          </span>
          <span className="text-right">
            <Badge variant="outline">{reference.kind}</Badge>
            <span className="mt-1 block font-mono text-xs text-[var(--dependency-links-muted-foreground)]">
              {reference.line + 1}:{(reference.column ?? 0) + 1}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

export default App;
