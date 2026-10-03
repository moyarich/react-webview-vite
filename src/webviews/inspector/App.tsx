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
  const [status, setStatus] = useState(messages.readyResolve);
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
                messages.resolvedCount,
                message.payload.results.length,
              ),
        );
        setError(undefined);
        setIsResolving(false);
        return;
      }

      setResults([]);
      setStatus(messages.resolutionFailed);
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

  function openExternal(url: string) {
    postMessage({ type: "openExternal", payload: { url } });
  }

  function clear() {
    setInput("");
    setResults([]);
    setError(undefined);
    setStatus(messages.readyResolve);
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6">
      <section className="mx-auto grid max-w-6xl gap-4">
        <WebviewHeader
          eyebrow={messages.appName}
          title={messages.inspectorTitle}
          description={messages.inspectorDescription}
          actions={
            <Badge>{formatMessage(messages.nodeCount, results.length)}</Badge>
          }
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <VSCodeCard>
            <SectionHeading title={messages.input} meta={messages.inputKinds} />

            <label className="mt-4 grid gap-2">
              <span className="text-xs font-medium text-[var(--dependency-links-muted-fg)]">
                {messages.dependencySource}
              </span>
              <VSCodeTextArea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={messages.inputPlaceholder}
                rows={15}
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <VSCodeButton
                onClick={resolve}
                disabled={isResolving || !input.trim()}
              >
                {isResolving ? messages.resolving : messages.resolveDependencies}
              </VSCodeButton>
              <VSCodeSecondaryButton onClick={clear}>
                {messages.clear}
              </VSCodeSecondaryButton>
            </div>
          </VSCodeCard>

          <VSCodeCard>
            <SectionHeading
              title={messages.status}
              meta={isResolving ? messages.working : messages.idle}
            />

            <div className="mt-4 grid gap-3">
              <StatusMessage tone={error ? "error" : "neutral"}>
                {error ?? status}
              </StatusMessage>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[var(--dependency-links-radius-md)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-surface-raised)] p-4">
                  <div className="text-2xl font-semibold">{results.length}</div>
                  <div className="mt-1 text-xs text-[var(--dependency-links-muted-fg)]">
                    {messages.packages}
                  </div>
                </div>
                <div className="rounded-[var(--dependency-links-radius-md)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-surface-raised)] p-4">
                  <div className="text-2xl font-semibold">
                    {Object.keys(grouped).length}
                  </div>
                  <div className="mt-1 text-xs text-[var(--dependency-links-muted-fg)]">
                    {messages.dependencyGroups}
                  </div>
                </div>
              </div>
            </div>
          </VSCodeCard>
        </div>

        {results.length === 0 ? (
          <VSCodeCard>
            <EmptyState
              title={messages.noResolvedPackagesTitle}
              description={messages.noResolvedPackagesDescription}
            />
          </VSCodeCard>
        ) : (
          Object.entries(grouped).map(([kind, items]) => (
            <VSCodeCard key={kind}>
              <SectionHeading
                title={kind}
                meta={
                  <Badge>
                    {formatMessage(messages.packageCount, items.length)}
                  </Badge>
                }
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
                          {item.spec ?? messages.directInput}
                        </p>
                      </div>

                      <div className="mt-auto flex flex-wrap gap-2">
                        {item.repositoryUrl && (
                          <VSCodeButton
                            onClick={() => openExternal(item.repositoryUrl!)}
                          >
                            {messages.repository}
                          </VSCodeButton>
                        )}
                        <VSCodeSecondaryButton
                          onClick={() => openExternal(item.npmUrl)}
                        >
                          {messages.npm}
                        </VSCodeSecondaryButton>
                        {item.homepageUrl && (
                          <VSCodeSecondaryButton
                            onClick={() => openExternal(item.homepageUrl!)}
                          >
                            {messages.homepage}
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
