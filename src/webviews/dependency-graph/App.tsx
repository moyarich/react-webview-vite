import { useEffect, useMemo, useState } from "react";
import type { ExtensionToWebviewMessage } from "../../shared/messages";
import type { DependencyResult } from "../../shared/types";
import { getVsCodeState, postMessage, setVsCodeState } from "../shared/api/vscode-api";
import {
  VSCodeButton,
  VSCodeCard,
  VSCodeSecondaryButton,
  VSCodeTextArea,
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
  const [status, setStatus] = useState("Resolve a manifest to build the graph.");
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
            ? "No dependencies were found."
            : `Graph contains ${message.payload.results.length} package(s).`,
        );
        setIsResolving(false);
        return;
      }

      setResults([]);
      setStatus(message.payload.message);
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
    setStatus("Resolving dependency graph...");
    postMessage({ type: "resolve", payload: { input } });
  }

  function openPackage(item: DependencyResult) {
    postMessage({
      type: "openExternal",
      payload: { url: item.repositoryUrl ?? item.npmUrl },
    });
  }

  return (
    <main className="min-h-screen p-5">
      <section className="mx-auto grid max-w-6xl gap-5">
        <VSCodeCard>
          <p className="text-xs uppercase tracking-wide text-[var(--vscode-descriptionForeground,#999)]">
            Dependency Links
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Dependency Graph</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--vscode-descriptionForeground,#999)]">
            Resolve package manifest input into a dependency tree grouped by
            dependency type. Select a package node to open its repository or npm page.
          </p>
        </VSCodeCard>

        <VSCodeCard>
          <VSCodeTextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={10}
            aria-label="Dependency graph input"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <VSCodeButton onClick={resolve} disabled={isResolving || !input.trim()}>
              {isResolving ? "Resolving..." : "Build graph"}
            </VSCodeButton>
            <VSCodeSecondaryButton
              onClick={() => {
                setInput("");
                setResults([]);
                setStatus("Resolve a manifest to build the graph.");
              }}
            >
              Clear
            </VSCodeSecondaryButton>
          </div>
          <p className="mt-3 text-sm text-[var(--vscode-descriptionForeground,#999)]">
            {status}
          </p>
        </VSCodeCard>

        {results.length > 0 && (
          <VSCodeCard>
            <div className="rounded-lg border border-[var(--vscode-panel-border,#3c3c3c)] p-4">
              <div className="inline-flex rounded-md bg-[var(--vscode-textCodeBlock-background,#2d2d2d)] px-3 py-2 font-mono text-sm font-semibold">
                manifest
              </div>

              <div className="ml-5 mt-4 grid gap-5 border-l border-[var(--vscode-panel-border,#3c3c3c)] pl-5">
                {Object.entries(grouped).map(([kind, items]) => (
                  <section key={kind}>
                    <div className="inline-flex rounded-md border border-[var(--vscode-panel-border,#3c3c3c)] px-3 py-2 font-mono text-sm">
                      {kind}
                    </div>
                    <div className="ml-5 mt-3 grid gap-2 border-l border-[var(--vscode-panel-border,#3c3c3c)] pl-5 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((item) => (
                        <button
                          key={kind + ":" + item.name + ":" + (item.spec ?? "")}
                          type="button"
                          onClick={() => openPackage(item)}
                          className="text-left rounded-md border border-[var(--vscode-panel-border,#3c3c3c)] bg-[var(--vscode-editor-background,#1e1e1e)] p-3 hover:bg-[var(--vscode-list-hoverBackground,#2a2d2e)]"
                        >
                          <span className="block font-mono text-sm font-medium">
                            {item.name}
                          </span>
                          {item.spec && (
                            <span className="mt-1 block font-mono text-xs text-[var(--vscode-descriptionForeground,#999)]">
                              {item.spec}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </VSCodeCard>
        )}
      </section>
    </main>
  );
}

export default App;
