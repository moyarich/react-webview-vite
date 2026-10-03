import * as vscode from "vscode";
import { resolveInput } from "../../dependencies";
import type {
  ExtensionToWebviewMessage,
  WebviewId,
  WebviewToExtensionMessage,
} from "../../shared/messages";

type WebviewDefinition = {
  viewType: string;
  title: string;
  entry: string;
};

const WEBVIEWS: Record<WebviewId, WebviewDefinition> = {
  inspector: {
    viewType: "dependencyLinks.inspector",
    title: "Dependency Links",
    entry: "inspector",
  },
  dependencyGraph: {
    viewType: "dependencyLinks.dependencyGraph",
    title: "Dependency Graph",
    entry: "dependency-graph",
  },
};

export function openWebviewPanel(
  context: vscode.ExtensionContext,
  webviewId: WebviewId,
) {
  const definition = WEBVIEWS[webviewId];
  const assetRoot = vscode.Uri.joinPath(
    context.extensionUri,
    "dist",
    "webviews",
  );

  const panel = vscode.window.createWebviewPanel(
    definition.viewType,
    definition.title,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [assetRoot],
    },
  );

  panel.webview.html = getWebviewHtml(
    panel.webview,
    assetRoot,
    definition.entry,
    definition.title,
  );

  const messageSubscription = panel.webview.onDidReceiveMessage(
    async (message: WebviewToExtensionMessage) => {
      switch (message.type) {
        case "resolve": {
          try {
            const results = await resolveInput(message.payload.input);
            const response: ExtensionToWebviewMessage = {
              type: "resolved",
              payload: { results },
            };
            await panel.webview.postMessage(response);
          } catch (error) {
            const response: ExtensionToWebviewMessage = {
              type: "resolveError",
              payload: {
                message:
                  error instanceof Error
                    ? error.message
                    : "Unable to resolve input.",
              },
            };
            await panel.webview.postMessage(response);
          }
          break;
        }

        case "openExternal": {
          const uri = vscode.Uri.parse(message.payload.url);
          if (uri.scheme === "http" || uri.scheme === "https") {
            await vscode.env.openExternal(uri);
          }
          break;
        }
      }
    },
  );

  panel.onDidDispose(() => messageSubscription.dispose());
}

function getWebviewHtml(
  webview: vscode.Webview,
  assetRoot: vscode.Uri,
  entry: string,
  title: string,
) {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(assetRoot, `${entry}.js`),
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(assetRoot, "webview.css"),
  );
  const nonce = getNonce();

  return /* html */ `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource} 'nonce-${nonce}';"
    />
    <link rel="stylesheet" href="${styleUri}" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
}

function getNonce() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  return Array.from(
    { length: 32 },
    () => characters[Math.floor(Math.random() * characters.length)],
  ).join("");
}
