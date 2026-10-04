import { describe, expect, it } from "vitest";
import { buildDependencyGraph } from "../../src/webview-ui/dependency-graph/graph";

describe("buildDependencyGraph", () => {
  it("creates a manifest root, dependency groups, package nodes, and edges", () => {
    const graph = buildDependencyGraph([
      {
        name: "react",
        spec: "^19.2.0",
        kind: "dependencies",
        npmUrl: "https://www.npmjs.com/package/react",
        repositoryUrl: "https://github.com/facebook/react",
      },
      {
        name: "vite",
        spec: "^8.0.0",
        kind: "devDependencies",
        npmUrl: "https://www.npmjs.com/package/vite",
      },
    ]);

    expect(graph.nodes.map((node) => node.id)).toEqual([
      "manifest",
      "group:dependencies",
      "dependencies:react:^19.2.0",
      "group:devDependencies",
      "devDependencies:vite:^8.0.0",
    ]);

    expect(graph.edges.map((edge) => [edge.source, edge.target])).toEqual([
      ["manifest", "group:dependencies"],
      ["group:dependencies", "dependencies:react:^19.2.0"],
      ["manifest", "group:devDependencies"],
      ["group:devDependencies", "devDependencies:vite:^8.0.0"],
    ]);

    expect(graph.nodes.find((node) => node.id.includes("react"))?.data.href).toBe(
      "https://github.com/facebook/react",
    );
  });
});
