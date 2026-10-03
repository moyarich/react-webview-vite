export type WebviewMessage =
  | {
      type: "resolve";
      payload: {
        input: string;
      };
    }
  | {
      type: "openExternal";
      payload: {
        url: string;
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
