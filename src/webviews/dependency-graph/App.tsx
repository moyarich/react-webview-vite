import { useEffect, useMemo, useState } from "react";
import { formatMessage } from "../../shared/localization";
import type { ExtensionToWebviewMessage } from "../../shared/messages";
import type { DependencyResult } from "../../shared/types";
import { getVsCodeState, postMessage, setVsCodeState } from "../shared/api/vscode-api";
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
  Textarea,
} from "../shared/components/vscode-ui";
import { messages } from "../shared/localization";

type AppState = { input: string };

const defaultInput =
  '{\n  "dependencies": {\n    "react": "^19.2.0"\n  },\n  "devDependencies": {\n    "vite": "^8.0.0"\n  }\n}';

function App() {
  const savedState = getVsCodeState<AppState>();
  const [input, setInput] = useState(savedState?.input ?? defaultInput);
  const [results, setResults] = useState<DependencyResult[]>([]);
  const [status, setStatus] = useState(messages.readyGraph);
  const [error, setError] = useState<string>();
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => setVsCodeState({ input }), [input]);

  useEffect(() => {
    function handleMessage(event: MessageEvent<ExtensionToWebviewMessage>) {
      const message = event.data;
      if (message.type === "resolved") {
        setResults(message.payload.results);
        setStatus(
          message.payload.results.length === 0
            ? messages.noDependencies
            : formatMessage(messages.graphContainsCount, message.payload.results.length),
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

  const grouped = useMemo(
    () => results.reduce<Record<string, DependencyResult[]>>((groups, result) => {
      (groups[result.kind] ??= []).push(result);
      return groups;
    }, {}),
    [results],
  );

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
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1440px] px-5 py-6">
        <PageHeader
          eyebrow={messages.appName}
          title={messages.graphTitle}
          description={messages.graphDescription}
          actions={<Badge>{results.length} {messages.nodes}</Badge>}
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-5 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>{messages.manifestInput}</CardTitle>
                <CardDescription>{messages.manifestKinds}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={12} aria-label={messages.manifestInput} />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button variant="ghost" onClick={clear}>{messages.clear}</Button>
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

          <section className="min-w-0">
            <Card className="min-h-[560px] overflow-hidden">
              <CardHeader className="border-b border-[var(--dependency-links-border)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{messages.dependencyTree}</CardTitle>
                    <CardDescription>
                      {results.length > 0
                        ? formatMessage(messages.groupCount, Object.keys(grouped).length)
                        : messages.readyGraph}
                    </CardDescription>
                  </div>
                  {results.length > 0 ? <Badge variant="outline">{results.length} {messages.packages}</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {results.length === 0 ? (
                  <div className="p-6">
                    <EmptyState title={messages.noGraphTitle} description={messages.noGraphDescription} />
                  </div>
                ) : (
                  <div className="overflow-auto p-6">
                    <div className="min-w-[720px] space-y-5">
                      <div className="inline-flex items-center rounded-lg border border-[var(--dependency-links-border)] bg-[var(--dependency-links-code)] px-3 py-2 font-mono text-xs font-semibold shadow-[var(--dependency-links-shadow-sm)]">
                        {messages.manifest}
                      </div>
                      <div className="ml-5 border-l border-[var(--dependency-links-border)] pl-7">
                        <div className="grid gap-5">
                          {Object.entries(grouped).map(([kind, items]) => (
                            <section key={kind} className="relative">
                              <span className="absolute -left-7 top-4 h-px w-7 bg-[var(--dependency-links-border)]" />
                              <div className="mb-3 flex items-center gap-2">
                                <Badge variant="outline">{kind}</Badge>
                                <span className="text-xs text-[var(--dependency-links-muted-foreground)]">
                                  {formatMessage(messages.packageCount, items.length)}
                                </span>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                                {items.map((item) => (
                                  <a
                                    key={kind + ":" + item.name + ":" + (item.spec ?? "")}
                                    href={item.repositoryUrl ?? item.npmUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group rounded-xl border border-[var(--dependency-links-border)] bg-[var(--dependency-links-card)] p-4 text-left no-underline shadow-[var(--dependency-links-shadow-sm)] transition-all hover:-translate-y-px hover:border-[var(--dependency-links-ring)] hover:bg-[var(--dependency-links-accent)] hover:shadow-[var(--dependency-links-shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dependency-links-ring)]"
                                  >
                                    <div className="font-mono text-sm font-semibold text-[var(--dependency-links-foreground)]">{item.name}</div>
                                    <div className="mt-1 truncate font-mono text-xs text-[var(--dependency-links-muted-foreground)]">{item.spec ?? messages.directInput}</div>
                                    <div className="mt-4 text-xs font-medium text-[var(--dependency-links-link)]">{messages.openPackage}</div>
                                  </a>
                                ))}
                              </div>
                            </section>
                          ))}
                        </div>
                      </div>
                    </div>
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
