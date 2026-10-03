import type { DependencyResult } from "./types";

export type WebviewId = "inspector" | "dependencyGraph";

export type WebviewToExtensionMessage = {
  type: "resolve";
  payload: { input: string };
};

export type ExtensionToWebviewMessage =
  | {
      type: "resolved";
      payload: { results: DependencyResult[] };
    }
  | {
      type: "resolveError";
      payload: { message: string };
    };
