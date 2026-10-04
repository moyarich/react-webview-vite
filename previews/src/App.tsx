import { useMemo, useState } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

type PreviewDefinition = {
  id: string;
  route: string;
  title: string;
  description: string;
  iframePath: string;
};

const previews: PreviewDefinition[] = [
  {
    id: "inspector",
    route: "/previews/inspector",
    title: "Inspector",
    description:
      "Resolve npm packages, repositories, manifests, JSON, YAML, and URLs.",
    iframePath: "/previews/inspector.html",
  },
  {
    id: "dependency-explorer",
    route: "/previews/dependency-explorer",
    title: "Dependency Explorer",
    description:
      "Explore package relationships, references, impact, filters, and version context.",
    iframePath: "/previews/dependency-graph.html",
  },
];

export default function App() {
  return (
    <Routes>
      <Route path="/previews" element={<PreviewWorkspace />} />
      <Route path="/previews/" element={<PreviewWorkspace />} />
      {previews.map((preview) => (
        <Route
          key={preview.id}
          path={preview.route}
          element={<PreviewWorkspace preview={preview} />}
        />
      ))}
      <Route
        path="*"
        element={<Navigate replace to="/previews/dependency-explorer" />}
      />
    </Routes>
  );
}

function PreviewWorkspace({
  preview = previews[1],
}: {
  preview?: PreviewDefinition;
}) {
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
    <div className="preview-app">
      <aside className="preview-sidebar">
        <header className="preview-brand">
          <div className="preview-brand-mark">DL</div>
          <div>
            <div className="preview-brand-title">Dependency Links</div>
            <div className="preview-brand-subtitle">Webview previews</div>
          </div>
        </header>

        <div className="preview-section-label">Available webviews</div>
        <nav className="preview-nav" aria-label="Available webview previews">
          {previews.map((item) => (
            <NavLink
              key={item.id}
              to={item.route}
              className={({ isActive }) =>
                "preview-nav-item" + (isActive ? " is-active" : "")
              }
            >
              <span className="preview-nav-title">
                <span className="preview-status-dot" aria-hidden="true" />
                {item.title}
              </span>
              <span className="preview-nav-description">
                {item.description}
              </span>
            </NavLink>
          ))}
        </nav>

        <footer className="preview-sidebar-footer">
          Browser previews use the Vite development server. Launch the extension
          host when testing VS Code APIs or real workspace state.
        </footer>
      </aside>

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
    </div>
  );
}
