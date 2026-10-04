import { NavLink, Outlet } from "react-router-dom";
import { previews } from "./previews";

export function PreviewLayout() {
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
          {previews.map((preview) => (
            <NavLink
              key={preview.id}
              to={preview.route}
              className={({ isActive }) =>
                "preview-nav-item" + (isActive ? " is-active" : "")
              }
            >
              <span className="preview-nav-title">
                <span className="preview-status-dot" aria-hidden="true" />
                {preview.title}
              </span>
              <span className="preview-nav-description">{preview.description}</span>
            </NavLink>
          ))}
        </nav>

        <footer className="preview-sidebar-footer">
          Browser previews use the Vite development server. Launch the extension host when testing
          VS Code APIs or real workspace state.
        </footer>
      </aside>

      <Outlet />
    </div>
  );
}
