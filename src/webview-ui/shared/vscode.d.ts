type VSCodeApi = {
  postMessage: (message: unknown) => void;
  getState: <T = unknown>() => T | undefined;
  setState: <T = unknown>(state: T) => T;
};

declare function acquireVsCodeApi(): VSCodeApi;
