import * as vscode from "vscode";
import { getWebviewMessages } from "../localization";
import type { DependencyLinksWebviewRequest, WebviewId } from "../../shared/messages";
import type { WebviewMessages } from "../../shared/localization";
import { findDependencyReferences, openDependencyReference } from "../source-references";
import { listWorkspaceManifests } from "../workspace-manifests";

type WebviewDefinition = {
  viewType: string;
  title: () => string;
  entry: string;
};

const WEBVIEWS: Record<WebviewId, WebviewDefinition> = {
  inspector: {
    viewType: "dependencyLinks.inspector",
    title: () => vscode.l10n.t("Dependency Links"),
    entry: "inspector",
  },
  dependencyGraph: {
    viewType: "dependencyLinks.dependencyGraph",
    title: () => vscode.l10n.t("Dependency Graph"),
    entry: "dependency-graph",
  },
};

export function openWebviewPanel(context: vscode.ExtensionContext, webviewId: WebviewId) {
  const definition = WEBVIEWS[webviewId];
  const title = definition.title();
  const messages = getWebviewMessages();
  const assetRoot = vscode.Uri.joinPath(context.extensionUri, "out", "webview-ui");

  const panel = vscode.window.createWebviewPanel(
    definition.viewType,
    title,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [assetRoot],
    },
  );

  panel.webview.onDidReceiveMessage(async (message: DependencyLinksWebviewRequest) => {
    if (message.type === "dependencyLinks/findReferences") {
      try {
        const references = await findDependencyReferences(message.packageName);
        await panel.webview.postMessage({
          type: "dependencyLinks/references",
          packageName: message.packageName,
          references,
        });
      } catch (error) {
        await panel.webview.postMessage({
          type: "dependencyLinks/referencesError",
          packageName: message.packageName,
          message: error instanceof Error ? error.message : String(error),
        });
      }
      return;
    }

    if (message.type === "dependencyLinks/openReference") {
      await openDependencyReference(message.reference);
      return;
    }

    if (message.type === "dependencyLinks/listWorkspaceManifests") {
      const manifests = await listWorkspaceManifests();
      await panel.webview.postMessage({
        type: "dependencyLinks/workspaceManifests",
        manifests,
      });
    }
  });

  panel.webview.html = getWebviewHtml(
    panel.webview,
    assetRoot,
    definition.entry,
    title,
    vscode.env.language,
    messages,
  );
}

function getWebviewHtml(
  webview: vscode.Webview,
  assetRoot: vscode.Uri,
  entry: string,
  title: string,
  locale: string,
  messages: WebviewMessages,
) {
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(assetRoot, `${entry}.js`));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(assetRoot, "webview.css"));
  const nonce = getNonce();
  const serializedMessages = JSON.stringify(messages).replaceAll("<", "\\u003c");

  return /* html */ `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource} 'nonce-${nonce}'; worker-src ${webview.cspSource} blob:; connect-src https://registry.npmjs.org https:;"
    />
    <link rel="stylesheet" href="${styleUri}" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}">
      window.__DEPENDENCY_LINKS_L10N__ = ${serializedMessages};
    </script>
    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
}

function getNonce() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  return Array.from(
    { length: 32 },
    () => characters[Math.floor(Math.random() * characters.length)],
  ).join("");
}
