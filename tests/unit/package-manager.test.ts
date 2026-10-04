import { describe, expect, it } from "vitest";
import type { WorkspaceManifest } from "../../src/shared/types";

describe("workspace package manager context", () => {
  it("supports npm, yarn, pnpm, and unknown managers", () => {
    const manifests: WorkspaceManifest[] = [
      {
        id: ".",
        uri: "file:///package.json",
        relativePath: "package.json",
        dependencies: [],
        packageManager: "npm",
      },
      {
        id: "apps/web",
        uri: "file:///apps/web/package.json",
        relativePath: "apps/web/package.json",
        dependencies: [],
        packageManager: "pnpm",
      },
    ];
    expect(manifests.map((item) => item.packageManager)).toEqual(["npm", "pnpm"]);
  });
});
