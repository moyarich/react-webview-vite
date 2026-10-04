import type { DependencyReference, WorkspaceManifest } from "./types";

export type WebviewId = "inspector" | "dependencyGraph";

export type DependencyLinksWebviewRequest =
  | {
      type: "dependencyLinks/findReferences";
      packageName: string;
    }
  | {
      type: "dependencyLinks/openReference";
      reference: Pick<DependencyReference, "uri" | "line" | "column">;
    }
  | {
      type: "dependencyLinks/listWorkspaceManifests";
    }
  | {
      type: "dependencyLinks/getVersionContext";
      packageName: string;
      workspaceId?: string;
    };

export type DependencyLinksExtensionMessage =
  | {
      type: "dependencyLinks/references";
      packageName: string;
      references: DependencyReference[];
    }
  | {
      type: "dependencyLinks/referencesError";
      packageName: string;
      message: string;
    }
  | {
      type: "dependencyLinks/workspaceManifests";
      manifests: WorkspaceManifest[];
    }
  | {
      type: "dependencyLinks/versionContext";
      packageName: string;
      workspaceId?: string;
      resolvedVersion?: string;
      lockfilePath?: string;
    };
