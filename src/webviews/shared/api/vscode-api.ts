function createPreviewVsCodeApi(): VSCodeApi {
  let state: unknown;

  return {
    postMessage() {},
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

export function getVsCodeState<T>() {
  return getVsCodeApi().getState<T>();
}

export function setVsCodeState<T>(state: T) {
  return getVsCodeApi().setState(state);
}
