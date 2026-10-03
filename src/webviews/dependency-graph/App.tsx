import { useEffect, useMemo, useState } from "react";
import type { ExtensionToWebviewMessage } from "../../shared/messages";
import type { DependencyResult } from "../../shared/types";
import {
  getVsCodeState,
  postMessage,
  setVsCodeState,
} from "../shared/api/vscode-api";
import {
  Badge,
  EmptyState,
  SectionHeading,
  StatusMessage,
  VSCodeButton,
  VSCodeCard,
  VSCodeSecondaryButton,
  VSCodeTextArea,
  WebviewHeader,
} from "../shared/components/vscode-ui";

type AppState = {
  input: string;
};

const defaultInput =
  '{\n  "dependencies": {\n    "react": "^19.2.0"\n  },\n  "devDependencies": {\n    "vite": "^8.0.0"\n  }\n}';

function App() {
  const savedState = getVsCodeState<AppState>();
  const [input, setInput] = useState(savedState?.input ?? defaultInput);
  const [results, setResults] = useState<DependencyResult[]>([]);
  const [status, setStatus] = useState("Ready to build a dependency graph.");
  const [error, setError] = useState<string>();
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    setVsCodeState({ input });
  }, [input]);

  useEffect(() => {
    function handleMessage(event: MessageEvent<ExtensionToWebviewMessage>) {
      const message = event.data;

      if (message.type === "resolved") {
        setResults(message.payload.results);
        setStatus(
          message.payload.results.length === 0
            ? "No dependencies found."
            : `Graph contains ${message.payload.results.length} package${message.payload.results.length === 1 ? "" : "s"}.`,
        );
        setError(undefined);
        setIsResolving(false);
        return;
      }

      setResults([]);
      setStatus("Graph resolution failed.");
      setError(message.payload.message);
      setIsResolving(false);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const grouped = useMemo(() => {
    return results.reduce<Record<string, DependencyResult[]>>((groups, result) => {
      (groups[result.kind] ??= []).push(result);
      return groups;
    }, {});
  }, [results]);

  function resolve() {
    setIsResolving(true);
    setError(undefined);
    setStatus("Resolving dependency graph...");
    postMessage({ type: "resolve", payload: { input } });
  }

  function openPackage(item: DependencyResult) {
    postMessage({
      type: "openExternal",
      payload: { url: item.repositoryUrl ?? item.npmUrl },
    });
  }

  function clear() {
    setInput("");
    setResults([]);
    setError(undefined);
    setStatus("Ready to build a dependency graph.");
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6">
      <section className="mx-auto grid max-w-7xl gap-4">
        <WebviewHeader
          title="Dependency Graph"
          description="Visualize manifest dependencies by section and open package repositories directly from the graph."
          actions={<Badge>{results.length} nodes</Badge>}
        />

        <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="grid content-start gap-4">
            <VSCodeCard>
              <SectionHeading title="Manifest input" meta="JSON · YAML" />
              <VSCodeTextArea
                className="mt-4"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={13}
                aria-label="Dependency graph input"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <VSCodeButton
                  onClick={resolve}
                  disabled={isResolving || !input.trim()}
                >
                  {isResolving ? "Building…" : "Build graph"}
                </VSCodeButton>
                <VSCodeSecondaryButton onClick={clear}>
                  Clear
                </VSCodeSecondaryButton>
              </div>
            </VSCodeCard>

            <VSCodeCard>
              <SectionHeading title="Graph status" />
              <div className="mt-4">
                <StatusMessage tone={error ? "error" : "neutral"}>
                  {error ?? status}
                </StatusMessage>
              </div>
            </VSCodeCard>
          </div>

          <VSCodeCard className="min-h-[420px]">
            <SectionHeading
              title="Dependency tree"
              meta={
                results.length > 0 ? (
                  <Badge>
                    {Object.keys(grouped).length} group
                    {Object.keys(grouped).length === 1 ? "" : "s"}
                  </Badge>
                ) : undefined
              }
            />

            {results.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No graph yet"
                  description="Resolve a manifest to create a grouped dependency tree. Package nodes open their source repository when available."
                />
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto pb-2">
                <div className="min-w-[680px]">
                  <div className="inline-flex rounded-[var(--dependency-links-radius-sm)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-code-bg)] px-3 py-2 font-mono text-sm font-semibold">
                    manifest
                  </div>

                  <div className="relative ml-5 mt-4 grid gap-5 border-l border-[var(--dependency-links-border-strong)] pl-6">
                    {Object.entries(grouped).map(([kind, items]) => (
                      <section key={kind} className="relative">
                        <span className="absolute -left-6 top-4 h-px w-6 bg-[var(--dependency-links-border-strong)]" />
                        <div className="inline-flex rounded-[var(--dependency-links-radius-sm)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-surface-raised)] px-3 py-2 font-mono text-sm font-medium">
                          {kind}
                        </div>

                        <div className="relative ml-5 mt-3 grid grid-cols-2 gap-2 border-l border-[var(--dependency-links-border)] pl-6 2xl:grid-cols-3">
                          {items.map((item) => (
                            <button
                              key={
                                kind + ":" + item.name + ":" + (item.spec ?? "")
                              }
                              type="button"
                              onClick={() => openPackage(item)}
                              className="relative min-h-20 rounded-[var(--dependency-links-radius-md)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-surface-raised)] p-3 text-left transition-colors hover:border-[var(--dependency-links-focus)] hover:bg-[var(--dependency-links-surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dependency-links-focus)]"
                            >
                              <span className="absolute -left-6 top-1/2 h-px w-6 bg-[var(--dependency-links-border)]" />
                              <span className="block font-mono text-sm font-semibold">
                                {item.name}
                              </span>
                              <span className="mt-1 block truncate font-mono text-xs text-[var(--dependency-links-muted-fg)]">
                                {item.spec ?? "Direct input"}
                              </span>
                              <span className="mt-2 block text-[11px] text-[var(--dependency-links-link)]">
                                Open package →
                              </span>
                            </button>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </VSCodeCard>
        </div>
      </section>
    </main>
  );
}

export default App;
