import { describe, expect, it } from "vitest";
import { filterDependencyReferences, filterDependencyResults } from "../../src/utils/filters";

const results = [
  {
    name: "react",
    kind: "dependencies" as const,
    npmUrl: "https://www.npmjs.com/package/react",
    workspaceId: "packages/app",
  },
  {
    name: "vitest",
    kind: "devDependencies" as const,
    npmUrl: "https://www.npmjs.com/package/vitest",
    workspaceId: "packages/app",
  },
  {
    name: "react",
    kind: "peerDependencies" as const,
    npmUrl: "https://www.npmjs.com/package/react",
    workspaceId: "packages/ui",
  },
];

describe("dependency explorer filters", () => {
  it("filters results by workspace and dependency type", () => {
    expect(
      filterDependencyResults(results, {
        workspaceId: "packages/app",
        enabledKinds: ["dependencies"],
      }).map((item) => item.name),
    ).toEqual(["react"]);
  });

  it("keeps all workspaces when all is selected", () => {
    expect(
      filterDependencyResults(results, {
        workspaceId: "all",
        enabledKinds: ["dependencies", "peerDependencies"],
      }),
    ).toHaveLength(2);
  });

  it("scopes references to their nearest manifest workspace", () => {
    const references = [
      {
        packageName: "react",
        specifier: "react",
        uri: "file:///repo/packages/app/src/App.tsx",
        relativePath: "packages/app/src/App.tsx",
        workspace: "packages/app",
        line: 0,
        kind: "import" as const,
      },
      {
        packageName: "react",
        specifier: "react",
        uri: "file:///repo/packages/ui/src/Button.tsx",
        relativePath: "packages/ui/src/Button.tsx",
        workspace: "packages/ui",
        line: 0,
        kind: "import" as const,
      },
    ];

    expect(filterDependencyReferences(references, "packages/ui")).toEqual([references[1]]);
  });
});
