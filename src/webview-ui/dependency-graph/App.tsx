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
  filterDependencyReferences,
  filterDependencyResults,
  createVersionContext,
  resolveInput,
  resolvePackage,
} from "../../utils";
import {
  getVsCodeState,
  postVsCodeMessage,
  setVsCodeState,
} from "../shared/api/vscode-api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  StatusLine,
} from "../shared/components/vscode-ui";
import { messages } from "../shared/localization";
import { buildDependencyGraph } from "./graph";

type AppState = { input: string };

const FILTERABLE_KINDS: DependencyKind[] = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
  "bundledDependencies",
  "bundleDependencies",
];

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
  const [results, setResults] = useState<DependencyResult[]>([]);
  const [workspaceManifests, setWorkspaceManifests] = useState<WorkspaceManifest[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState("all");
  const [enabledKinds, setEnabledKinds] = useState<DependencyKind[]>(FILTERABLE_KINDS);
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

  const scopedReferences = useMemo(
    () => filterDependencyReferences(references, activeWorkspace),
    [activeWorkspace, references],
  );

  const graph = useMemo(() => buildDependencyGraph(filteredResults), [filteredResults]);
  const selectedResult = useMemo(
    () =>
      filteredResults.find((item) => item.name === selectedPackageName) ??
      filteredResults
        .flatMap((item) => item.dependencies ?? [])
        .find((item) => item.name === selectedPackageName),
    [filteredResults, selectedPackageName],
  );
  const versionContext = useMemo(
    () =>
      selectedPackageName
        ? createVersionContext({
            packageName: selectedPackageName,
            declaredVersion: selectedResult?.spec,
            resolvedVersion,
            latestVersion:
              selectedResult && "latestVersion" in selectedResult
                ? selectedResult.latestVersion
                : undefined,
            lockfilePath,
          })
        : undefined,
    [lockfilePath, resolvedVersion, selectedPackageName, selectedResult],
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

  async function resolve() {
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

  function clear() {
    setInput("");
    setResults([]);
    setSelectedPackageName(undefined);
    setReferences([]);
    setReferencesError(undefined);
    setError(undefined);
    setStatus(messages.readyGraph);
    resetFilters();
  }

  function resetFilters() {
    setActiveWorkspace("all");
    setEnabledKinds(FILTERABLE_KINDS);
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

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1600px] px-5 py-6">
        <PageHeader
          eyebrow={messages.appName}
          title={messages.graphTitle}
          description={messages.graphDescription}
          actions={
            <Badge>
              {filteredResults.length} {messages.nodes}
            </Badge>
          }
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Workspace</CardTitle>
                <CardDescription>
                  Scope the graph and reference results to a package manifest.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--dependency-links-muted-foreground)]">
                    Package scope
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md bg-transparent px-2 py-1.5 text-left text-sm text-inherit hover:bg-[var(--dependency-links-accent)]"
                      onClick={() => setActiveWorkspace("all")}
                      aria-pressed={activeWorkspace === "all"}
                    >
                      <span>All packages</span>
                      <Badge variant={activeWorkspace === "all" ? "default" : "outline"}>
                        {workspaceManifests.length}
                      </Badge>
                    </button>
                    {workspaceManifests.map((manifest) => (
                      <button
                        key={manifest.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-md bg-transparent px-2 py-1.5 text-left text-sm text-inherit hover:bg-[var(--dependency-links-accent)]"
                        onClick={() => setActiveWorkspace(manifest.id)}
                        aria-pressed={activeWorkspace === manifest.id}
                      >
                        <span className="truncate">{manifest.name ?? manifest.id}</span>
                        <Badge variant={activeWorkspace === manifest.id ? "default" : "outline"}>
                          {manifest.dependencies.length}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[var(--dependency-links-border)] pt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--dependency-links-muted-foreground)]">
                    Dependency type
                  </div>
                  <div className="space-y-2">
                    {FILTERABLE_KINDS.map((kind) => (
                      <label key={kind} className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enabledKinds.includes(kind)}
                            onChange={() => toggleKind(kind)}
                          />
                          <span>{kind}</span>
                        </span>
                        <span className="text-xs text-[var(--dependency-links-muted-foreground)]">
                          {
                            results.filter(
                              (result) =>
                                result.kind === kind &&
                                (activeWorkspace === "all" ||
                                  result.workspaceId === activeWorkspace),
                            ).length
                          }
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button variant="ghost" className="w-full" onClick={resetFilters}>
                  Reset filters
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{messages.manifestInput}</CardTitle>
                <CardDescription>{messages.manifestKinds}</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="h-[280px] animate-pulse rounded-xl border border-[var(--dependency-links-border)] bg-[var(--dependency-links-muted)]" />
                  }
                >
                  <CodeEditor
                    value={input}
                    onChange={setInput}
                    modelPath="dependency-links://dependency-graph/package.json"
                    height={280}
                  />
                </Suspense>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button variant="ghost" onClick={clear}>
                    {messages.clear}
                  </Button>
                  <Button onClick={resolve} disabled={isResolving || !input.trim()}>
                    {isResolving ? messages.building : messages.buildGraph}
                  </Button>
                </div>

                <div className="mt-4 border-t border-[var(--dependency-links-border)] pt-4">
                  <StatusLine error={Boolean(error)}>{error ?? status}</StatusLine>
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="min-w-0 space-y-5">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-[var(--dependency-links-border)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{messages.dependencyTree}</CardTitle>
                    <CardDescription>
                      {filteredResults.length > 0
                        ? formatMessage(
                            messages.groupCount,
                            new Set(filteredResults.map((item) => item.kind)).size,
                          )
                        : messages.readyGraph}
                    </CardDescription>
                  </div>
                  {filteredResults.length > 0 ? (
                    <Badge variant="outline">
                      {filteredResults.length} {messages.packages}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredResults.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      title={messages.noGraphTitle}
                      description={messages.noGraphDescription}
                    />
                  </div>
                ) : (
                  <div className="h-[620px] bg-[var(--dependency-links-background)]">
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
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-[var(--dependency-links-border)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Version context</CardTitle>
                    <CardDescription>
                      Declared, installed, and latest registry version for the selected package.
                    </CardDescription>
                  </div>
                  {versionContext ? <Badge variant="outline">{versionContext.status}</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 pt-5 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <div className="text-xs text-[var(--dependency-links-muted-foreground)]">
                    Declared
                  </div>
                  <div className="mt-1 font-mono text-sm">
                    {versionContext?.declaredVersion ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--dependency-links-muted-foreground)]">
                    Resolved
                  </div>
                  <div className="mt-1 font-mono text-sm">
                    {versionContext?.resolvedVersion ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--dependency-links-muted-foreground)]">
                    Latest
                  </div>
                  <div className="mt-1 font-mono text-sm">
                    {versionContext?.latestVersion ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--dependency-links-muted-foreground)]">
                    Lockfile
                  </div>
                  <div className="mt-1 truncate text-sm">
                    {versionContext?.lockfilePath ?? "Not found"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-[var(--dependency-links-border)]">
                <CardTitle>Impact analysis</CardTitle>
                <CardDescription>
                  {selectedPackageName
                    ? "Direct workspace dependents and package dependencies for " +
                      selectedPackageName
                    : "Select a package to inspect dependency relationships."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 pt-5 md:grid-cols-2">
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="m-0 text-sm font-semibold">Dependents</h3>
                    <Badge variant="outline">{impact?.dependents.length ?? 0}</Badge>
                  </div>
                  {impact && impact.dependents.length > 0 ? (
                    <div className="space-y-2">
                      {impact.dependents.map((dependent) => (
                        <div
                          key={[
                            dependent.workspace ?? "",
                            dependent.relativePath,
                            dependent.dependencyKind ?? "",
                          ].join(":")}
                          className="rounded-lg border border-[var(--dependency-links-border)] px-3 py-2"
                        >
                          <div className="truncate text-sm">{dependent.relativePath}</div>
                          <div className="mt-1 text-xs text-[var(--dependency-links-muted-foreground)]">
                            {dependent.dependencyKind ?? "dependency"}
                            {dependent.workspace ? " · " + dependent.workspace : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="m-0 text-sm text-[var(--dependency-links-muted-foreground)]">
                      No manifest dependents found in this scope.
                    </p>
                  )}
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="m-0 text-sm font-semibold">Dependencies</h3>
                    <Badge variant="outline">{impact?.dependencies.length ?? 0}</Badge>
                  </div>
                  {impact && impact.dependencies.length > 0 ? (
                    <div className="space-y-2">
                      {impact.dependencies.map((dependency) => (
                        <button
                          key={[dependency.kind, dependency.name, dependency.spec ?? ""].join(":")}
                          type="button"
                          className="flex w-full items-center justify-between gap-3 rounded-lg border border-[var(--dependency-links-border)] bg-transparent px-3 py-2 text-left text-inherit hover:bg-[var(--dependency-links-accent)]"
                          onClick={() => selectPackage(dependency.name)}
                        >
                          <span className="truncate text-sm">{dependency.name}</span>
                          <span className="text-xs text-[var(--dependency-links-muted-foreground)]">
                            {dependency.spec ?? dependency.kind}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="m-0 text-sm text-[var(--dependency-links-muted-foreground)]">
                      No package dependencies were resolved.
                    </p>
                  )}
                </section>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-[var(--dependency-links-border)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{messages.references}</CardTitle>
                    <CardDescription>
                      {selectedPackageName
                        ? formatMessage(messages.referencesFor, selectedPackageName)
                        : "Select a package node to inspect workspace usage."}
                    </CardDescription>
                  </div>
                  {selectedPackageName ? (
                    <Badge variant="outline">{scopedReferences.length}</Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!selectedPackageName ? (
                  <div className="p-5 text-sm text-[var(--dependency-links-muted-foreground)]">
                    Select a package node to inspect workspace usage.
                  </div>
                ) : isLoadingReferences ? (
                  <div className="p-5 text-sm text-[var(--dependency-links-muted-foreground)]">
                    {messages.loadingReferences}
                  </div>
                ) : referencesError ? (
                  <div className="p-5">
                    <StatusLine error>{referencesError}</StatusLine>
                  </div>
                ) : scopedReferences.length === 0 ? (
                  <div className="p-5 text-sm text-[var(--dependency-links-muted-foreground)]">
                    {messages.noReferences}
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--dependency-links-border)]">
                    {scopedReferences.map((reference, index) => (
                      <button
                        key={[
                          reference.uri,
                          reference.line,
                          reference.column ?? 0,
                          reference.kind,
                          index,
                        ].join(":")}
                        type="button"
                        className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-4 bg-transparent px-5 py-3 text-left text-inherit hover:bg-[var(--dependency-links-accent)]"
                        onClick={() => openReference(reference)}
                        title={messages.openReference}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm">{reference.relativePath}</span>
                          {reference.text ? (
                            <code className="mt-1 block truncate text-xs text-[var(--dependency-links-muted-foreground)]">
                              {reference.text}
                            </code>
                          ) : null}
                        </span>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline">{reference.kind}</Badge>
                          <span className="text-xs text-[var(--dependency-links-muted-foreground)]">
                            {reference.line + 1}:{(reference.column ?? 0) + 1}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
