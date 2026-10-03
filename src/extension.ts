import * as vscode from "vscode";
import {
  getJsonDependencyLinks,
  getYamlDependencyLinks,
  resolveInput,
  resolvePackage,
} from "./dependencies";
import type { WebviewToExtensionMessage } from "./shared/messages";

type DependencyDocumentLink = vscode.DocumentLink & {
  data?: { packageName: string };
};

export function activate(context: vscode.ExtensionContext) {
  const provider: vscode.DocumentLinkProvider = {
    async provideDocumentLinks(document) {
      if (document.languageId === "json" || document.languageId === "jsonc") {
        return getJsonDependencyLinks(document);
      }

      return getYamlDependencyLinks(document);
    },

    async resolveDocumentLink(link: DependencyDocumentLink) {
      const packageName = link.data?.packageName;
      if (!packageName) {
        return link;
      }

      const resolved = await resolvePackage(packageName);
      link.target = vscode.Uri.parse(resolved.repositoryUrl ?? resolved.npmUrl);
      link.tooltip = resolved.repositoryUrl
        ? `Open ${packageName} repository`
        : `Open ${packageName} on npm`;

      return link;
    },
  };

  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      [
        { language: "json", pattern: "**/package.json" },
        { language: "jsonc", pattern: "**/package.json" },
        { language: "yaml", pattern: "**/*.{yaml,yml}" },
      ],
      provider,
    ),
    vscode.commands.registerCommand("dependencyLinks.openPanel", () => {
      openDependencyPanel(context);
    }),
  );
}

function openDependencyPanel(context: vscode.ExtensionContext) {
  const webviewRoot = vscode.Uri.joinPath(
    context.extensionUri,
    "dist",
    "webview",
  );

  const panel = vscode.window.createWebviewPanel(
    "dependencyLinks",
    "Dependency Links",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [webviewRoot],
    },
  );

  panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri);

  panel.webview.onDidReceiveMessage(
    async (message: WebviewToExtensionMessage) => {
      switch (message.type) {
        case "resolve": {
          try {
            const results = await resolveInput(message.payload.input);
            await panel.webview.postMessage({
              type: "resolved",
              payload: { results },
            });
          } catch (error) {
            await panel.webview.postMessage({
              type: "resolveError",
              payload: {
                message:
                  error instanceof Error
                    ? error.message
                    : "Unable to resolve input.",
              },
            });
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
    undefined,
    context.subscriptions,
  );
}

function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri) {
  const webviewRoot = vscode.Uri.joinPath(
    extensionUri,
    "dist",
    "webview",
  );
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(webviewRoot, "webview.js"),
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(webviewRoot, "webview.css"),
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
          content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"
        />
        <link rel="stylesheet" href="${styleUri}" />
        <title>Dependency Links</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>
  `;
}

function getNonce() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let value = "";

  for (let index = 0; index < 32; index += 1) {
    value += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return value;
}

export function deactivate() {}
