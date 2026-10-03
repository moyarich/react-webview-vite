import { useEffect, useMemo, useState } from "react";
import type { ExtensionToWebviewMessage } from "../../shared/messages";
import type { DependencyResult } from "../../shared/types";
import { formatMessage } from "../../shared/localization";
import {
  getVsCodeState,
  postMessage,
  setVsCodeState,
} from "../shared/api/vscode-api";
import { messages } from "../shared/localization";
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
  const [status, setStatus] = useState(messages.readyGraph);
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
            ? messages.noDependencies
            : formatMessage(
                messages.graphContainsCount,
                message.payload.results.length,
              ),
        );
        setError(undefined);
        setIsResolving(false);
        return;
      }

      setResults([]);
      setStatus(messages.graphResolutionFailed);
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
    setStatus(messages.resolving);
    postMessage({ type: "resolve", payload: { input } });
  }

  function clear() {
    setInput("");
    setResults([]);
    setError(undefined);
    setStatus(messages.readyGraph);
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6">
      <section className="mx-auto grid max-w-7xl gap-4">
        <WebviewHeader
          eyebrow={messages.appName}
          title={messages.graphTitle}
          description={messages.graphDescription}
          actions={
            <Badge>{formatMessage(messages.nodeCount, results.length)}</Badge>
          }
        />

        <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="grid content-start gap-4">
            <VSCodeCard>
              <SectionHeading
                title={messages.manifestInput}
                meta={messages.manifestKinds}
              />
              <VSCodeTextArea
                className="mt-4"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={13}
                aria-label={messages.manifestInput}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <VSCodeButton
                  onClick={resolve}
                  disabled={isResolving || !input.trim()}
                >
                  {isResolving ? messages.building : messages.buildGraph}
                </VSCodeButton>
                <VSCodeSecondaryButton onClick={clear}>
                  {messages.clear}
                </VSCodeSecondaryButton>
              </div>
            </VSCodeCard>

            <VSCodeCard>
              <SectionHeading title={messages.graphStatus} />
              <div className="mt-4">
                <StatusMessage tone={error ? "error" : "neutral"}>
                  {error ?? status}
                </StatusMessage>
              </div>
            </VSCodeCard>
          </div>

          <VSCodeCard className="min-h-[420px]">
            <SectionHeading
              title={messages.dependencyTree}
              meta={
                results.length > 0 ? (
                  <Badge>
                    {formatMessage(
                      messages.groupCount,
                      Object.keys(grouped).length,
                    )}
                  </Badge>
                ) : undefined
              }
            />

            {results.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title={messages.noGraphTitle}
                  description={messages.noGraphDescription}
                />
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto pb-2">
                <div className="min-w-[680px]">
                  <div className="inline-flex rounded-[var(--dependency-links-radius-sm)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-code-bg)] px-3 py-2 font-mono text-sm font-semibold">
                    {messages.manifest}
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
                            <a
                              key={
                                kind + ":" + item.name + ":" + (item.spec ?? "")
                              }
                              href={item.repositoryUrl ?? item.npmUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative min-h-20 rounded-[var(--dependency-links-radius-md)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-surface-raised)] p-3 text-left no-underline transition-colors hover:border-[var(--dependency-links-focus)] hover:bg-[var(--dependency-links-surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dependency-links-focus)]"
                            >
                              <span className="absolute -left-6 top-1/2 h-px w-6 bg-[var(--dependency-links-border)]" />
                              <span className="block font-mono text-sm font-semibold text-[var(--dependency-links-fg)]">
                                {item.name}
                              </span>
                              <span className="mt-1 block truncate font-mono text-xs text-[var(--dependency-links-muted-fg)]">
                                {item.spec ?? messages.directInput}
                              </span>
                              <span className="mt-2 block text-[11px] text-[var(--dependency-links-link)]">
                                {messages.openPackage}
                              </span>
                            </a>
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
