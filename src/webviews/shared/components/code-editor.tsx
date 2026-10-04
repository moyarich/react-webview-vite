import Editor, { loader, type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/language/json/json.worker?worker";

function createMonacoWorker(label: string) {
  const worker = label === "json" ? new JsonWorker() : new EditorWorker();

  worker.addEventListener("error", (event) => {
    console.error(`[dependency-links] Monaco ${label} worker error`, event);
  });
  worker.addEventListener("messageerror", (event) => {
    console.error(`[dependency-links] Monaco ${label} worker message error`, event);
  });

  return worker;
}

self.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    return createMonacoWorker(label);
  },
};

loader.config({ monaco });

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  fontSize: 13,
  lineHeight: 20,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: "on",
  folding: true,
  renderLineHighlight: "line",
  overviewRulerLanes: 0,
  padding: { top: 10, bottom: 10 },
};

export function CodeEditor({
  value,
  onChange,
  modelPath,
  height = 260,
}: {
  value: string;
  onChange: (value: string) => void;
  modelPath: string;
  height?: number;
}) {
  const handleMount: OnMount = (editorInstance) => {
    // The webview may become visible after Monaco's first measurement.
    // automaticLayout handles later resizes; this handles the initial frame.
    requestAnimationFrame(() => editorInstance.layout());
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--dependency-links-border)] bg-[var(--dependency-links-input)] shadow-[var(--dependency-links-shadow-sm)]">
      <Editor
        height={height}
        path={modelPath}
        keepCurrentModel
        defaultLanguage="json"
        value={value}
        onChange={(next) => onChange(next ?? "")}
        onMount={handleMount}
        theme="vs-dark"
        options={editorOptions}
      />
    </div>
  );
}
