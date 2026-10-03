import type { WebviewToExtensionMessage } from "../../shared/messages";

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

export function postMessage(message: WebviewToExtensionMessage) {
  const vscode = getVsCodeApi();

  if (!vscode) {
    console.log("VS Code API is not available. Message was not sent:", message);
    return;
  }

  vscode.postMessage(message);
}

export function getVsCodeState<T>() {
  return getVsCodeApi()?.getState<T>();
}

export function setVsCodeState<T>(state: T) {
  getVsCodeApi()?.setState(state);
}
