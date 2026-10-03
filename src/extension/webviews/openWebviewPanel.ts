import * as vscode from "vscode";
import { resolveInput } from "../../dependencies";
import { getWebviewMessages } from "../localization";
import type {
  ExtensionToWebviewMessage,
  WebviewId,
  WebviewToExtensionMessage,
} from "../../shared/messages";
import type { WebviewMessages } from "../../shared/localization";

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

export function openWebviewPanel(
  context: vscode.ExtensionContext,
  webviewId: WebviewId,
) {
  const definition = WEBVIEWS[webviewId];
  const title = definition.title();
  const messages = getWebviewMessages();
  const assetRoot = vscode.Uri.joinPath(
    context.extensionUri,
    "dist",
    "webviews",
  );

  const panel = vscode.window.createWebviewPanel(
    definition.viewType,
    title,
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
    title,
    vscode.env.language,
    messages,
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
                    : vscode.l10n.t("Unable to resolve input."),
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
  locale: string,
  messages: WebviewMessages,
) {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(assetRoot, `${entry}.js`),
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(assetRoot, "webview.css"),
  );
  const nonce = getNonce();
  const serializedMessages = JSON.stringify(messages).replaceAll("<", "\\u003c");

  return /* html */ `<!doctype html>
<html lang="${locale}">
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
    <script nonce="${nonce}">
      window.__DEPENDENCY_LINKS_L10N__ = ${serializedMessages};
    </script>
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
