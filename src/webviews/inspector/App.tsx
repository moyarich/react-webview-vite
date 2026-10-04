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
  LinkButton,
  PageHeader,
  Separator,
  StatusLine,
} from "../shared/components/vscode-ui";
import { messages } from "../shared/localization";

type AppState = { input: string };

const CodeEditor = lazy(() =>
  import("../shared/components/code-editor").then((module) => ({
    default: module.CodeEditor,
  })),
);

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

  const grouped = useMemo(
    () =>
      results.reduce<Record<string, DependencyResult[]>>((groups, result) => {
        (groups[result.kind] ??= []).push(result);
        return groups;
      }, {}),
    [results],
  );

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
          : formatMessage(messages.resolvedCount, resolved.length),
      );
    } catch (resolveError) {
      setResults([]);
      setStatus(messages.resolutionFailed);
      setError(resolveError instanceof Error ? resolveError.message : messages.resolutionFailed);
    } finally {
      setIsResolving(false);
    }
  }

  function clear() {
    setInput("");
    setResults([]);
    setError(undefined);
    setStatus(messages.readyResolve);
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <PageHeader
          eyebrow={messages.appName}
          title={messages.inspectorTitle}
          description={messages.inspectorDescription}
          actions={
            <>
              <Badge variant="outline">
                {Object.keys(grouped).length} {messages.groups}
              </Badge>
              <Badge>
                {results.length} {messages.packages}
              </Badge>
            </>
          }
        />

        <div className="mt-6 grid gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{messages.input}</CardTitle>
                  <CardDescription>{messages.inputKinds}</CardDescription>
                </div>
                <Badge variant="outline">{messages.dependencySource}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="h-[260px] animate-pulse rounded-xl border border-[var(--dependency-links-border)] bg-[var(--dependency-links-muted)]" />
                }
              >
                <CodeEditor\n                  value={input}\n                  onChange={setInput}\n                  modelPath="dependency-links://inspector/package.json"\n                  height={260}\n                />
              </Suspense>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <StatusLine error={Boolean(error)}>{error ?? status}</StatusLine>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={clear}>
                    {messages.clear}
                  </Button>
                  <Button onClick={resolve} disabled={isResolving || !input.trim()}>
                    {isResolving ? messages.resolving : messages.resolveDependencies}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {results.length === 0 ? (
            <EmptyState
              title={messages.noResolvedPackagesTitle}
              description={messages.noResolvedPackagesDescription}
            />
          ) : (
            <div className="grid gap-6">
              {Object.entries(grouped).map(([kind, items]) => (
                <section key={kind}>
                  <div className="mb-3 flex items-center gap-3">
                    <h2 className="m-0 text-sm font-semibold">{kind}</h2>
                    <Badge variant="outline">
                      {formatMessage(messages.packageCount, items.length)}
                    </Badge>
                    <Separator className="flex-1" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                      <Card
                        key={kind + ":" + item.name + ":" + (item.spec ?? "")}
                        className="transition-colors hover:bg-[var(--dependency-links-accent)]"
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="font-mono text-sm">{item.name}</CardTitle>
                          <CardDescription className="font-mono text-xs">
                            {item.spec ?? messages.directInput}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {item.repositoryUrl ? (
                              <LinkButton href={item.repositoryUrl}>
                                {messages.repository}
                              </LinkButton>
                            ) : null}
                            <LinkButton href={item.npmUrl} variant="secondary">
                              {messages.npm}
                            </LinkButton>
                            {item.homepageUrl ? (
                              <LinkButton href={item.homepageUrl} variant="ghost">
                                {messages.homepage}
                              </LinkButton>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
