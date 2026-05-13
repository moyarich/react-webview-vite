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
