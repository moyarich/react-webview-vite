import type {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from "../../../shared/messages";
import type { DependencyResult } from "../../../shared/types";

const previewResults: DependencyResult[] = [
  {
    name: "react",
    spec: "^19.2.0",
    kind: "dependencies",
    npmUrl: "https://www.npmjs.com/package/react",
    repositoryUrl: "https://github.com/facebook/react",
    homepageUrl: "https://react.dev/",
  },
  {
    name: "vite",
    spec: "^8.0.0",
    kind: "devDependencies",
    npmUrl: "https://www.npmjs.com/package/vite",
    repositoryUrl: "https://github.com/vitejs/vite",
    homepageUrl: "https://vite.dev/",
  },
];

function createPreviewVsCodeApi(): VSCodeApi {
  let state: unknown;

  return {
    postMessage(message) {
      const outgoing = message as WebviewToExtensionMessage;

      if (outgoing.type === "resolve") {
        const response: ExtensionToWebviewMessage = {
          type: "resolved",
          payload: { results: previewResults },
        };

        window.setTimeout(() => {
          window.dispatchEvent(
            new MessageEvent("message", {
              data: response,
            }),
          );
        }, 150);
      }
    },
    getState<T>() {
      return state as T | undefined;
    },
    setState<T>(nextState: T) {
      state = nextState;
      return nextState;
    },
  };
}

let vscodeApi: VSCodeApi | undefined;

export function getVsCodeApi() {
  if (vscodeApi) {
    return vscodeApi;
  }

  vscodeApi =
    typeof acquireVsCodeApi === "function"
      ? acquireVsCodeApi()
      : createPreviewVsCodeApi();

  return vscodeApi;
}

export function postMessage(message: WebviewToExtensionMessage) {
  getVsCodeApi().postMessage(message);
}

export function getVsCodeState<T>() {
  return getVsCodeApi().getState<T>();
}

export function setVsCodeState<T>(state: T) {
  return getVsCodeApi().setState(state);
}
