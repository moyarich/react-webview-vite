import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import type { PreviewDefinition } from "./previews";

export function PreviewPage({ preview }: { preview: PreviewDefinition }) {
  const location = useLocation();
  const [reloadKey, setReloadKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const cleanUrl = useMemo(
    () => window.location.origin + location.pathname,
    [location.pathname],
  );

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(cleanUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      window.prompt("Copy preview URL:", cleanUrl);
    }
  }

  return (
    <main className="preview-main">
      <header className="preview-toolbar">
        <div className="preview-toolbar-copy">
          <div className="preview-eyebrow">Development preview</div>
          <div className="preview-title-row">
            <h1>{preview.title}</h1>
            <span className="preview-runtime-badge">Vite</span>
          </div>
          <p>{preview.description}</p>
        </div>

        <div className="preview-actions">
          <button
            className="preview-action"
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
          >
            Reload
          </button>
          <button className="preview-action" type="button" onClick={copyUrl}>
            {copied ? "Copied" : "Copy URL"}
          </button>
          <a
            className="preview-action preview-action-primary"
            href={preview.iframePath}
            target="_blank"
            rel="noreferrer"
          >
            Open webview
          </a>
        </div>
      </header>

      <section className="preview-viewport" aria-label={preview.title + " preview"}>
        <div className="preview-browser-bar">
          <div className="preview-traffic-lights" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <code className="preview-address">{cleanUrl}</code>
          <span className="preview-browser-label">webview</span>
        </div>

        <iframe
          key={reloadKey}
          src={preview.iframePath}
          title={preview.title + " webview preview"}
        />
      </section>
    </main>
  );
}
