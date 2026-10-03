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
  const [status, setStatus] = useState("Ready to resolve dependencies.");
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
            : `Resolved ${message.payload.results.length} package${message.payload.results.length === 1 ? "" : "s"}.`,
        );
        setError(undefined);
        setIsResolving(false);
        return;
      }

      setResults([]);
      setStatus("Resolution failed.");
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
    setStatus("Resolving dependencies...");
    postMessage({ type: "resolve", payload: { input } });
  }

  function openExternal(url: string) {
    postMessage({ type: "openExternal", payload: { url } });
  }

  function clear() {
    setInput("");
    setResults([]);
    setError(undefined);
    setStatus("Ready to resolve dependencies.");
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6">
      <section className="mx-auto grid max-w-6xl gap-4">
        <WebviewHeader
          title="Dependency Inspector"
          description="Resolve npm packages, repository references, manifest URLs, JSON, YAML, or dependency maps into source and package links."
          actions={<Badge>{results.length} resolved</Badge>}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <VSCodeCard>
            <SectionHeading
              title="Input"
              meta="npm · GitHub · JSON · YAML · URL"
            />

            <label className="mt-4 grid gap-2">
              <span className="text-xs font-medium text-[var(--dependency-links-muted-fg)]">
                Dependency source
              </span>
              <VSCodeTextArea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="@scope/package@^1.0.0, owner/repo, URL, JSON, or YAML"
                rows={15}
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <VSCodeButton
                onClick={resolve}
                disabled={isResolving || !input.trim()}
              >
                {isResolving ? "Resolving…" : "Resolve dependencies"}
              </VSCodeButton>
              <VSCodeSecondaryButton onClick={clear}>
                Clear
              </VSCodeSecondaryButton>
            </div>
          </VSCodeCard>

          <VSCodeCard>
            <SectionHeading title="Status" meta={isResolving ? "Working" : "Idle"} />

            <div className="mt-4 grid gap-3">
              <StatusMessage tone={error ? "error" : "neutral"}>
                {error ?? status}
              </StatusMessage>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[var(--dependency-links-radius-md)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-surface-raised)] p-4">
                  <div className="text-2xl font-semibold">{results.length}</div>
                  <div className="mt-1 text-xs text-[var(--dependency-links-muted-fg)]">
                    packages
                  </div>
                </div>
                <div className="rounded-[var(--dependency-links-radius-md)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-surface-raised)] p-4">
                  <div className="text-2xl font-semibold">
                    {Object.keys(grouped).length}
                  </div>
                  <div className="mt-1 text-xs text-[var(--dependency-links-muted-fg)]">
                    dependency groups
                  </div>
                </div>
              </div>
            </div>
          </VSCodeCard>
        </div>

        {results.length === 0 ? (
          <VSCodeCard>
            <EmptyState
              title="No resolved packages yet"
              description="Paste a package or manifest above and resolve it to inspect repository, npm, and homepage links."
            />
          </VSCodeCard>
        ) : (
          Object.entries(grouped).map(([kind, items]) => (
            <VSCodeCard key={kind}>
              <SectionHeading
                title={kind}
                meta={<Badge>{items.length} package{items.length === 1 ? "" : "s"}</Badge>}
              />

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {items.map((item) => (
                  <article
                    key={kind + ":" + item.name + ":" + (item.spec ?? "")}
                    className="rounded-[var(--dependency-links-radius-md)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-surface-raised)] p-4 transition-colors hover:bg-[var(--dependency-links-surface-hover)]"
                  >
                    <div className="flex h-full flex-col gap-4">
                      <div>
                        <h3 className="m-0 font-mono text-sm font-semibold">
                          {item.name}
                        </h3>
                        <p className="mt-1 min-h-5 font-mono text-xs text-[var(--dependency-links-muted-fg)]">
                          {item.spec ?? "Direct input"}
                        </p>
                      </div>

                      <div className="mt-auto flex flex-wrap gap-2">
                        {item.repositoryUrl && (
                          <VSCodeButton
                            onClick={() => openExternal(item.repositoryUrl!)}
                          >
                            Repository
                          </VSCodeButton>
                        )}
                        <VSCodeSecondaryButton
                          onClick={() => openExternal(item.npmUrl)}
                        >
                          npm
                        </VSCodeSecondaryButton>
                        {item.homepageUrl && (
                          <VSCodeSecondaryButton
                            onClick={() => openExternal(item.homepageUrl!)}
                          >
                            Homepage
                          </VSCodeSecondaryButton>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </VSCodeCard>
          ))
        )}
      </section>
    </main>
  );
}

export default App;
