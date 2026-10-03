import { useEffect, useMemo, useState } from "react";
import type { ExtensionToWebviewMessage } from "../shared/messages";
import {
  VSCodeButton,
  VSCodeCard,
  VSCodeSecondaryButton,
  VSCodeTextArea,
} from "./components/vscode-ui";
import { getVsCodeState, postMessage, setVsCodeState } from "./api/vscode-api";

type DependencyResult = Extract<
  ExtensionToWebviewMessage,
  { type: "resolved" }
>["payload"]["results"][number];

type AppState = {
  input: string;
};

const defaultInput =
  '{\n  "dependencies": {\n    "react": "^19.2.0"\n  },\n  "devDependencies": {\n    "vite": "^8.0.0"\n  }\n}';

function App() {
  const savedState = getVsCodeState<AppState>();
  const [input, setInput] = useState(savedState?.input ?? defaultInput);
  const [results, setResults] = useState<DependencyResult[]>([]);
  const [status, setStatus] = useState("Paste a package, repo, URL, JSON, or YAML.");
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
            : "Resolved " + message.payload.results.length + " item(s).",
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
    setStatus("Resolving dependencies...");
    postMessage({ type: "resolve", payload: { input } });
  }

  function openExternal(url: string) {
    postMessage({ type: "openExternal", payload: { url } });
  }

  function clear() {
    setInput("");
    setResults([]);
    setStatus("Paste a package, repo, URL, JSON, or YAML.");
  }

  return (
    <main className="min-h-screen p-5">
      <section className="mx-auto grid max-w-5xl gap-5">
        <VSCodeCard>
          <p className="text-xs uppercase tracking-wide text-[var(--vscode-descriptionForeground)]">
            Dependency Links
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            Inspect package dependency repositories
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--vscode-descriptionForeground)]">
            Enter an npm package name, GitHub owner/repo, manifest URL, full
            package.json/YAML content, or just a dependency object. The same
            resolver also powers clickable dependency names in package files.
          </p>
        </VSCodeCard>

        <VSCodeCard>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Dependency input</span>
            <VSCodeTextArea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="@scope/package@^1.0.0, owner/repo, URL, JSON, or YAML"
              rows={14}
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <VSCodeButton onClick={resolve} disabled={isResolving || !input.trim()}>
              {isResolving ? "Resolving..." : "Resolve"}
            </VSCodeButton>
            <VSCodeSecondaryButton onClick={clear}>Clear</VSCodeSecondaryButton>
          </div>

          <p className="mt-3 text-sm text-[var(--vscode-descriptionForeground)]">
            {status}
          </p>
        </VSCodeCard>

        {Object.entries(grouped).map(([kind, items]) => (
          <VSCodeCard key={kind}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-medium">{kind}</h2>
              <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                {items.length} item(s)
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {items.map((item) => (
                <article
                  key={kind + ":" + item.name + ":" + (item.spec ?? "")}
                  className="rounded border border-[var(--vscode-panel-border)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-mono text-base font-medium">{item.name}</h3>
                      {item.spec && (
                        <p className="mt-1 font-mono text-xs text-[var(--vscode-descriptionForeground)]">
                          {item.spec}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.repositoryUrl && (
                        <VSCodeButton onClick={() => openExternal(item.repositoryUrl!)}>
                          Repository
                        </VSCodeButton>
                      )}
                      <VSCodeSecondaryButton onClick={() => openExternal(item.npmUrl)}>
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
        ))}
      </section>
    </main>
  );
}

export default App;
