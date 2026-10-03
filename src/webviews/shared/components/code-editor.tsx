import Editor, { loader, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/language/json/json.worker?worker";

self.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    if (label === "json") {
      return new JsonWorker();
    }
    return new EditorWorker();
  },
};

loader.config({ monaco });

export function CodeEditor({
  value,
  onChange,
  height = 260,
}: {
  value: string;
  onChange: (value: string) => void;
  height?: number;
}) {
  const handleMount: OnMount = (editor) => {
    editor.focus();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--dependency-links-border)] bg-[var(--dependency-links-input)] shadow-[var(--dependency-links-shadow-sm)]">
      <Editor
        height={height}
        defaultLanguage="json"
        value={value}
        onChange={(next) => onChange(next ?? "")}
        onMount={handleMount}
        theme="vs-dark"
        options={{
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
        }}
      />
    </div>
  );
}
