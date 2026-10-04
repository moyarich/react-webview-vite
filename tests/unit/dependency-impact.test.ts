import { describe, expect, it } from "vitest";
import { buildDependencyImpact } from "../../src/utils/impact";

describe("buildDependencyImpact", () => {
  it("combines manifest dependents with resolved package dependencies", () => {
    const impact = buildDependencyImpact(
      [
        {
          name: "react",
          spec: "^19",
          kind: "dependencies",
          npmUrl: "https://www.npmjs.com/package/react",
          dependencies: [
            {
              name: "scheduler",
              spec: "^0.27.0",
              kind: "dependencies",
            },
          ],
        },
      ],
      [
        {
          packageName: "react",
          specifier: "react",
          uri: "file:///workspace/package.json",
          relativePath: "package.json",
          workspace: "app",
          line: 4,
          kind: "manifest",
          dependencyKind: "dependencies",
        },
        {
          packageName: "react",
          specifier: "react",
          uri: "file:///workspace/src/App.tsx",
          relativePath: "src/App.tsx",
          workspace: "app",
          line: 0,
          kind: "import",
        },
      ],
      "react",
    );

    expect(impact.dependents).toEqual([
      {
        workspace: "app",
        relativePath: "package.json",
        dependencyKind: "dependencies",
      },
    ]);
    expect(impact.dependencies.map((item) => item.name)).toEqual(["scheduler"]);
  });

  it("deduplicates manifest dependents", () => {
    const reference = {
      packageName: "react",
      specifier: "react",
      uri: "file:///workspace/package.json",
      relativePath: "package.json",
      workspace: "app",
      line: 4,
      kind: "manifest" as const,
      dependencyKind: "dependencies",
    };

    const impact = buildDependencyImpact([], [reference, reference], "react");

    expect(impact.dependents).toHaveLength(1);
  });
});
