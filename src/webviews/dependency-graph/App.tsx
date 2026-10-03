import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useState } from "react";
import { formatMessage } from "../../shared/localization";
import type { ExtensionToWebviewMessage } from "../../shared/messages";
import type { DependencyResult } from "../../shared/types";
import { getVsCodeState, postMessage, setVsCodeState } from "../shared/api/vscode-api";
import { CodeEditor } from "../shared/components/code-editor";
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
import {
  buildDependencyGraph,
  type DependencyGraphNodeData,
} from "./graph";

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

  const graph = useMemo(() => buildDependencyGraph(results), [results]);

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

  const openNode: NodeMouseHandler = (_event, node) => {
    const data = node.data as DependencyGraphNodeData;
    if (data.href) {
      window.open(data.href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1600px] px-5 py-6">
        <PageHeader
          eyebrow={messages.appName}
          title={messages.graphTitle}
          description={messages.graphDescription}
          actions={<Badge>{results.length} {messages.nodes}</Badge>}
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-5 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>{messages.manifestInput}</CardTitle>
                <CardDescription>{messages.manifestKinds}</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeEditor value={input} onChange={setInput} height={320} />

                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button variant="ghost" onClick={clear}>
                    {messages.clear}
                  </Button>
                  <Button
                    onClick={resolve}
                    disabled={isResolving || !input.trim()}
                  >
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
                    <ReactFlow
                      nodes={graph.nodes}
                      edges={graph.edges}
                      fitView
                      fitViewOptions={{ padding: 0.18 }}
                      minZoom={0.2}
                      maxZoom={1.8}
                      onNodeClick={openNode}
                      nodesDraggable
                      nodesConnectable={false}
                      elementsSelectable
                      colorMode="system"
                    >
                      <Background gap={24} size={1} />
                      <MiniMap pannable zoomable />
                      <Controls showInteractive={false} />
                    </ReactFlow>
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
