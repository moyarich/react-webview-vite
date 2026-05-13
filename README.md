# Build a VS Code Webview with React, Vite, Tailwind CSS, and VS Code-Themed Components

This tutorial shows how to create a VS Code extension that opens a custom webview powered by:

- **React** for the webview UI
- **Vite** for fast frontend builds
- **Tailwind CSS** for layout and custom styling
- **VS Code CSS theme variables** for native-looking controls
- **VS Code Webview API** for rendering the UI inside VS Code

---

## 1. Prerequisites

Install Node.js and npm first.

Then install the VS Code extension generator:

```bash
npm install --global yo generator-code
```

You should also have VS Code installed.

---

## 2. Create the VS Code Extension

Run:

```bash
yo code
```

Choose these options:

```text
✔ What type of extension do you want to create? New Extension (TypeScript)
✔ What's the name of your extension? react-webview-vite
✔ What's the identifier of your extension? react-webview-vite
✔ What's the description of your extension? webview
✔ Initialize a git repository? Yes
✔ Which bundler to use? unbundled
✔ Which package manager to use? npm
```

This creates the extension shell where the important files are:

```text
react-webview-vite/
  package.json
  src/
    extension.ts
  tsconfig.json
```

Update the extension root `tsconfig.json` so the extension compiler only reads files from `src/` and does not accidentally compile the Vite React app inside `webview-ui`.

```json
{
  "compilerOptions": {
    "module": "Node16",
    "target": "ES2022",
    "outDir": "out",
    "lib": ["ES2022"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true
  },
  "exclude": ["webview-ui"]
}
```

---

## 3. Run the Extension for the First Time

Open the generated extension in VS Code. click on `src/extension.ts`

Press:

```text
F5
```

This starts the extension in a new window called the **Extension Development Host**.

In that new window:

1. Open the Command Palette:
   - **Windows:** `Ctrl + Shift + P`
   - **macOS:** `Cmd + Shift + P`

2. Run: `Hello World`

You should see the extension message: `Hello World from react-webview-vite!`

This confirms that the extension host works before adding React.

---

## 4. Add a React App with Vite

From the extension root, run the command below to create a React + TypeScript app inside a folder named `webview-ui`:

```bash
npm create vite@latest webview-ui
```

Choose these options:

```
✔ Select a framework? React
✔ Select a variant? TypeScript
```

Your project should now look like this:

```text
react-webview-vite/
  src/
    extension.ts
  webview-ui/
    index.html
    package.json
    src/
      App.tsx
      main.tsx
      index.css
    vite.config.ts
```

---

## 5. Install Tailwind CSS for Vite

To install dependencies:

```
cd webview-ui

```

Inside `webview-ui`, install Tailwind using the Vite plugin:

```bash
npm install tailwindcss @tailwindcss/vite
```

Update `webview-ui/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
```

Update `webview-ui/src/index.css`:

```css
@import "tailwindcss";

:root {
  font-family: var(--vscode-font-family);
  color: var(--vscode-foreground);
  background: var(--vscode-editor-background);
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: var(--vscode-editor-background);
  color: var(--vscode-foreground);
}

button,
input,
textarea,
select {
  font-family: inherit;
}
```

This setup keeps Tailwind available while still respecting VS Code theme variables.

---

## 6. Create VS Code-Themed React Components

- Build regular React components.
- Style them with Tailwind.
- Optionally use headless libraries like [Radix UI](https://www.radix-ui.com/themes/docs/overview/getting-started) if you need advanced accessible primitives such as dialogs, popovers, tabs, or dropdown menus.

Create `webview-ui/src/components/vscode-ui.tsx`:

```tsx
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function VSCodeButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded px-3 py-1.5 text-sm font-medium text-[var(--vscode-button-foreground)] bg-[var(--vscode-button-background)] hover:bg-[var(--vscode-button-hoverBackground)] focus:outline focus:outline-1 focus:outline-[var(--vscode-focusBorder)] ${className}`}
      {...props}
    />
  );
}

export function VSCodeSecondaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded px-3 py-1.5 text-sm font-medium text-[var(--vscode-button-secondaryForeground)] bg-[var(--vscode-button-secondaryBackground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)] focus:outline focus:outline-1 focus:outline-[var(--vscode-focusBorder)] ${className}`}
      {...props}
    />
  );
}

export function VSCodeTextField({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded border border-[var(--vscode-input-border)] bg-[var(--vscode-input-background)] px-3 py-2 text-sm text-[var(--vscode-input-foreground)] placeholder:text-[var(--vscode-input-placeholderForeground)] focus:outline focus:outline-1 focus:outline-[var(--vscode-focusBorder)] ${className}`}
      {...props}
    />
  );
}

export function VSCodeTextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-24 w-full rounded border border-[var(--vscode-input-border)] bg-[var(--vscode-input-background)] px-3 py-2 text-sm text-[var(--vscode-input-foreground)] placeholder:text-[var(--vscode-input-placeholderForeground)] focus:outline focus:outline-1 focus:outline-[var(--vscode-focusBorder)] ${className}`}
      {...props}
    />
  );
}

export function VSCodeCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] p-5 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}
```

The UI intentionally combines Tailwind utility classes with VS Code CSS variables such as:

```
var(--vscode-editor-background)
var(--vscode-foreground)
var(--vscode-descriptionForeground)
var(--vscode-panel-border)
var(--vscode-button-background)
var(--vscode-input-background)
```

That keeps the webview aligned with the active VS Code theme.

---

##

---

## 7. Create the React Webview UI with VS Code API Messaging

Create the React webview UI with VS Code message passing included from the start.

A webview runs like a small web app, but it cannot directly call the VS Code extension API. Instead, the React app sends messages to the extension, and the extension runs VS Code APIs on its behalf.

The flow looks like this:

```text
React button click
  → webview postMessage
  → extension receives message
  → extension runs VS Code API
  → extension sends response back to React
  → React updates the UI
```

### Create the VS Code API wrapper

Create `webview-ui/src/api/vscode-api.ts`:

```ts
export type WebviewMessage =
  | {
      type: "saveSettings";
      payload: {
        projectName: string;
        format: string;
        notes: string;
      };
    }
  | {
      type: "showInfo";
      payload: {
        message: string;
      };
    };

let vscodeApi: VSCodeApi | undefined;

function getVsCodeApi() {
  if (vscodeApi) {
    return vscodeApi;
  }

  if (typeof acquireVsCodeApi === "function") {
    vscodeApi = acquireVsCodeApi();
    return vscodeApi;
  }

  return undefined;
}

export function postMessage(message: WebviewMessage) {
  const vscode = getVsCodeApi();

  if (!vscode) {
    console.log("VS Code API is not available. Message was not sent:", message);
    return;
  }

  vscode.postMessage(message);
}

export function getVsCodeState<T>() {
  const vscode = getVsCodeApi();
  return vscode?.getState<T>();
}

export function setVsCodeState<T>(state: T) {
  const vscode = getVsCodeApi();
  vscode?.setState(state);
}
```

This wrapper is the only place where the React app should call `acquireVsCodeApi()`.

The wrapper calls `acquireVsCodeApi()` lazily, only when the app needs to communicate with VS Code. This prevents the app from crashing during Vite browser development or testing.

### Add webview API types for the wrapper

Create `webview-ui/src/vscode.d.ts`:

```ts
type VSCodeApi = {
  postMessage: (message: unknown) => void;
  getState: <T = unknown>() => T | undefined;
  setState: <T = unknown>(state: T) => void;
};

declare function acquireVsCodeApi(): VSCodeApi;
```

VS Code provides `acquireVsCodeApi()` inside the webview, but TypeScript does not know about it by default. This file adds the type information needed by `webview-ui/src/api/vscode-api.ts`.

The wrapper checks `typeof acquireVsCodeApi === "function"` because the function only exists inside VS Code, not when previewing the React app in a normal browser.

### Create `webview-ui/src/App.tsx`

Now create `webview-ui/src/App.tsx` :

```tsx
import { useEffect, useState } from "react";
import {
  VSCodeButton,
  VSCodeCard,
  VSCodeSecondaryButton,
  VSCodeTextArea,
  VSCodeTextField,
} from "./components/vscode-ui";
import { getVsCodeState, postMessage, setVsCodeState } from "./api/vscode-api";

type AppState = {
  projectName: string;
  format: string;
  notes: string;
};

type ExtensionMessage =
  | {
      type: "settingsSaved";
      payload: {
        savedAt: string;
      };
    }
  | {
      type: "fromExtension";
      payload: {
        message: string;
      };
    };

const defaultState: AppState = {
  projectName: "Jupytext Pair Helper",
  format: "ipynb,py:percent",
  notes: "",
};

function App() {
  const savedState = getVsCodeState<AppState>();

  const [projectName, setProjectName] = useState(
    savedState?.projectName ?? defaultState.projectName,
  );
  const [format, setFormat] = useState(
    savedState?.format ?? defaultState.format,
  );
  const [notes, setNotes] = useState(savedState?.notes ?? defaultState.notes);
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    setVsCodeState({ projectName, format, notes });
  }, [projectName, format, notes]);

  useEffect(() => {
    function handleMessage(event: MessageEvent<ExtensionMessage>) {
      const message = event.data;

      switch (message.type) {
        case "settingsSaved":
          setStatus(`Settings saved at ${message.payload.savedAt}`);
          break;
        case "fromExtension":
          setStatus(message.payload.message);
          break;
      }
    }

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  function saveSettings() {
    postMessage({
      type: "saveSettings",
      payload: {
        projectName,
        format,
        notes,
      },
    });
  }

  function showInfoMessage() {
    postMessage({
      type: "showInfo",
      payload: {
        message: `Current project: ${projectName}`,
      },
    });
  }

  function resetSettings() {
    setProjectName(defaultState.projectName);
    setFormat(defaultState.format);
    setNotes(defaultState.notes);
    setStatus(
      "Reset locally. Click Save settings to send the update to VS Code.",
    );
  }

  return (
    <main className="min-h-screen p-5">
      <section className="mx-auto grid max-w-4xl gap-5">
        <VSCodeCard>
          <p className="text-xs uppercase tracking-wide text-[var(--vscode-descriptionForeground)]">
            VS Code Webview Tutorial
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--vscode-foreground)]">
            React + Vite + Tailwind + VS Code Message Passing
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vscode-descriptionForeground)]">
            This webview uses React for state, Tailwind for layout, and VS Code
            message passing to communicate with the extension.
          </p>
        </VSCodeCard>

        <div className="grid gap-5 md:grid-cols-2">
          <VSCodeCard>
            <h2 className="text-lg font-medium">Settings</h2>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-1 text-sm">
                <span className="text-[var(--vscode-descriptionForeground)]">
                  Project name
                </span>
                <VSCodeTextField
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-[var(--vscode-descriptionForeground)]">
                  Pairing format
                </span>
                <select
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                  className="w-full rounded border border-[var(--vscode-dropdown-border)] bg-[var(--vscode-dropdown-background)] px-3 py-2 text-sm text-[var(--vscode-dropdown-foreground)] focus:outline focus:outline-1 focus:outline-[var(--vscode-focusBorder)]"
                >
                  <option value="ipynb,py:percent">Python percent pair</option>
                  <option value="ipynb,md:myst">Markdown MyST pair</option>
                  <option value="ipynb,md,pct.py:percent">
                    Notebook + Markdown + percent script
                  </option>
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-[var(--vscode-descriptionForeground)]">
                  Notes
                </span>
                <VSCodeTextArea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Notes about the selected pairing format..."
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <VSCodeButton onClick={saveSettings}>
                  Save settings
                </VSCodeButton>
                <VSCodeButton onClick={showInfoMessage}>
                  Show VS Code message
                </VSCodeButton>
                <VSCodeSecondaryButton onClick={resetSettings}>
                  Reset
                </VSCodeSecondaryButton>
              </div>
            </div>
          </VSCodeCard>

          <VSCodeCard>
            <h2 className="text-lg font-medium">Preview</h2>
            <div className="mt-4 grid gap-4">
              <div className="rounded-lg border border-[var(--vscode-panel-border)] p-4">
                <p className="text-sm text-[var(--vscode-descriptionForeground)]">
                  Project
                </p>
                <h3 className="mt-1 text-lg font-medium">{projectName}</h3>
              </div>

              <div className="rounded-lg border border-[var(--vscode-panel-border)] p-4">
                <p className="text-sm text-[var(--vscode-descriptionForeground)]">
                  Selected Jupytext format
                </p>
                <code className="mt-2 block rounded bg-[var(--vscode-textCodeBlock-background)] p-3">
                  {format}
                </code>
              </div>

              <div className="rounded-lg border border-[var(--vscode-panel-border)] p-4">
                <p className="text-sm text-[var(--vscode-descriptionForeground)]">
                  Status
                </p>
                <p className="mt-1 text-sm">{status}</p>
              </div>
            </div>
          </VSCodeCard>
        </div>
      </section>
    </main>
  );
}

export default App;
```

### How the interaction works

The React webview sends this message when the user clicks **Save settings**:

```ts
postMessage({
  type: "saveSettings",
  payload: {
    projectName,
    format,
    notes,
  },
});
```

The extension receives that message, runs extension-side logic, and sends a response back to React.

The React webview receives extension messages here:

```ts
window.addEventListener("message", handleMessage);
```

## 8. Build the React App

From inside `webview-ui`, run:

```bash
npm run build
```

Vite creates:

```text
webview-ui/dist/
  index.html
  assets/
    index.js
    index.css
```

The extension will load these built files into the webview.

---

## 9. Add the Webview Command to `package.json`

Open the extension root `package.json`.

Update `contributes.commands`:

```json
{
  "contributes": {
    "commands": [
      {
        "command": "react-webview-vite.openPanel",
        "title": "Open React Webview"
      }
    ]
  }
}
```

Make sure the command name matches the command registered in `extension.ts`.

---

## 10. Create the Webview Panel in `extension.ts`

Replace `src/extension.ts` with:

```ts
import * as vscode from "vscode";

type WebviewMessage =
  | {
      type: "saveSettings";
      payload: {
        projectName: string;
        format: string;
        notes: string;
      };
    }
  | {
      type: "showInfo";
      payload: {
        message: string;
      };
    };

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "react-webview-vite.openPanel",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "reactWebviewVite",
        "React Webview",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, "webview-ui", "dist"),
          ],
        },
      );

      panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri);

      panel.webview.onDidReceiveMessage(
        async (message: WebviewMessage) => {
          switch (message.type) {
            case "saveSettings": {
              await context.globalState.update(
                "reactWebviewVite.settings",
                message.payload,
              );

              vscode.window.showInformationMessage(
                `Saved settings for ${message.payload.projectName}`,
              );

              panel.webview.postMessage({
                type: "settingsSaved",
                payload: {
                  savedAt: new Date().toLocaleTimeString(),
                },
              });

              break;
            }

            case "showInfo": {
              vscode.window.showInformationMessage(message.payload.message);

              panel.webview.postMessage({
                type: "fromExtension",
                payload: {
                  message:
                    "VS Code received the message and showed a notification.",
                },
              });

              break;
            }
          }
        },
        undefined,
        context.subscriptions,
      );
    },
  );

  context.subscriptions.push(disposable);
}

function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri) {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(
      extensionUri,
      "webview-ui",
      "dist",
      "assets",
      "index.js",
    ),
  );

  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(
      extensionUri,
      "webview-ui",
      "dist",
      "assets",
      "index.css",
    ),
  );

  const nonce = getNonce();

  return /* html */ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'none'; img-src ${webview.cspSource} https:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';"
        />

        <link rel="stylesheet" href="${styleUri}" />
        <title>React Webview</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>
  `;
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

export function deactivate() {}
```

Important details:

- `enableScripts: true` allows the React bundle to run.
- `localResourceRoots` allows the webview to read files from `webview-ui/dist`.
- `webview.asWebviewUri(...)` converts extension file paths into safe webview URLs.
- `context.extensionUri` points to the extension root folder, not the `out/` folder.
- The compiled extension runs from `out/extension.js`, but it can still reference `webview-ui/dist/assets/index.js` relative to the extension root.
- The CSP uses a `nonce` so only the intended script can run.

---

## 11. Run Both Development Watchers

From your terminal, make sure you are in the extension root folder:

```bash
cd react-webview-vite
```

For development, run the extension's TypeScript watcher and the Vite webview watcher at the same time.

You need both because they build different parts of the project:

```text
Extension watcher → compiles src/extension.ts into out/extension.js
Webview watcher   → builds React/Tailwind files into webview-ui/dist/
```

Use `concurrently` because both watcher commands are long-running processes.

From the extension root, install it:

```bash
npm install -D concurrently
```

Add these scripts to the extension root `package.json`:

```json
{
  "scripts": {
    "watch": "tsc -watch -p ./",
    "watch:webview": "npm --prefix webview-ui run build -- --watch",
    "dev": "concurrently \"npm run watch\" \"npm run watch:webview\""
  }
}
```

Now start both watchers from the extension root:

```bash
npm run dev
```

This keeps both outputs updated while you work:

```text
out/extension.js
webview-ui/dist/assets/index.js
webview-ui/dist/assets/index.css
```

---

## 12. Start and Reload the Extension

To start the extension:

1. Open the extension project in VS Code.
2. Press `F5`.
3. A new **Extension Development Host** window opens.
4. Open the Command Palette.
5. Run:

```text
Open React Webview
```

The React webview should appear.

### Reloading after changes

There are two common reload flows.

#### If you changed React code

1. Keep `npm run dev` running from the extension root.
2. Close the webview panel.
3. Run `Open React Webview` again.

Usually you do not need to restart the full Extension Development Host for React-only changes.

#### If you changed the extension code

If you changed `src/extension.ts` or `package.json`:

1. Go to the Extension Development Host window.
2. Press:

```text
Ctrl + R
```

On macOS, use:

```text
Cmd + R
```

This reloads the Extension Development Host.

Then run:

```text
Open React Webview
```

again from the Command Palette.

---

## 13. Production Build

Before packaging or publishing the extension, build both parts:

```bash
npm run compile
npm --prefix webview-ui run build
```

You should commit or package the built webview assets depending on your publishing workflow.

## 14. Quick Checks

Before running the extension, confirm these files exist:

```text
out/extension.js
webview-ui/dist/assets/index.js
webview-ui/dist/assets/index.css
```

Also confirm the command ID matches in both places:

```text
package.json → contributes.commands[].command
src/extension.ts → vscode.commands.registerCommand(...)
```

If the webview is blank, open VS Code Developer Tools with:

```text
Developer: Toggle Developer Tools
```

---

## 15. Final Folder Structure

```text
react-webview-vite/
  package.json
  tsconfig.json
  src/
    extension.ts
  out/
    extension.js
    extension.js.map
  webview-ui/
    package.json
    vite.config.ts
    index.html
    src/
      App.tsx
      main.tsx
      index.css
    dist/
      assets/
        index.js
        index.css
```

---

## Summary

You now have a VS Code extension that:

- Registers a command in the Command Palette
- Opens a custom webview panel
- Loads a React app built by Vite
- Uses Tailwind CSS for layout and styling
- Uses small reusable React components styled with VS Code theme variables
- Supports a practical reload workflow during development

The key development loop is:

```bash
npm run dev
```

Then:

```text
F5 → Open React Webview → edit React → close/reopen panel → edit extension → Ctrl/Cmd + R
```
