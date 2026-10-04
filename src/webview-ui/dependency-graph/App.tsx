import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { formatMessage } from "../../shared/localization";
import type { DependencyResult } from "../../shared/types";
import { resolveInput } from "../../utils";
import { getVsCodeState, setVsCodeState } from "../shared/api/vscode-api";
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
  const [status, setStatus] = useState(messages.readyGraph);
  const [error, setError] = useState<string>();
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    setVsCodeState({ input });
  }, [input]);

  const graph = useMemo(() => buildDependencyGraph(results), [results]);

  async function resolve() {
    setIsResolving(true);
    setError(undefined);
    setStatus(messages.resolving);

    try {
      const resolved = await resolveInput(input);
      setResults(resolved);
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
    setError(undefined);
    setStatus(messages.readyGraph);
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
              {results.length} {messages.nodes}
            </Badge>
          }
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-5 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>{messages.manifestInput}</CardTitle>
                <CardDescription>{messages.manifestKinds}</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="h-[320px] animate-pulse rounded-xl border border-[var(--dependency-links-border)] bg-[var(--dependency-links-muted)]" />
                  }
                >
                  <CodeEditor
                    value={input}
                    onChange={setInput}
                    modelPath="dependency-links://dependency-graph/package.json"
                    height={320}
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

          <section className="min-w-0">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-[var(--dependency-links-border)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{messages.dependencyTree}</CardTitle>
                    <CardDescription>
                      {results.length > 0
                        ? formatMessage(
                            messages.groupCount,
                            new Set(results.map((item) => item.kind)).size,
                          )
                        : messages.readyGraph}
                    </CardDescription>
                  </div>
                  {results.length > 0 ? (
                    <Badge variant="outline">
                      {results.length} {messages.packages}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {results.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      title={messages.noGraphTitle}
                      description={messages.noGraphDescription}
                    />
                  </div>
                ) : (
                  <div className="h-[680px] bg-[var(--dependency-links-background)]">
                    <Suspense
                      fallback={
                        <div className="flex h-full items-center justify-center text-sm text-[var(--dependency-links-muted-foreground)]">
                          Loading graph…
                        </div>
                      }
                    >
                      <DependencyFlow nodes={graph.nodes} edges={graph.edges} />
                    </Suspense>
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
