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
  it("adds one-hop transitive package nodes and edges", () => {
    const graph = buildDependencyGraph([
      {
        name: "react",
        spec: "^19.2.0",
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
    ]);

    const transitive = graph.nodes.find((node) => node.data.packageName === "scheduler");

    expect(transitive?.data.relationship).toBe("transitive");
    expect(
      graph.edges.some(
        (edge) =>
          edge.source === "dependencies:react:^19.2.0" &&
          edge.target === "transitive:react:scheduler",
      ),
    ).toBe(true);
  });

  it("renders recursive transitive dependencies without cycles", () => {
    const graph = buildDependencyGraph([
      {
        name: "a",
        kind: "dependencies",
        npmUrl: "https://www.npmjs.com/package/a",
        dependencies: [
          {
            name: "b",
            kind: "dependencies",
            npmUrl: "https://www.npmjs.com/package/b",
            depth: 1,
            dependencies: [
              {
                name: "c",
                kind: "dependencies",
                npmUrl: "https://www.npmjs.com/package/c",
                depth: 2,
              },
            ],
          },
        ],
      },
    ]);
    expect(graph.nodes.some((node) => node.data.packageName === "c")).toBe(true);
    expect(
      graph.edges.some(
        (edge) => graph.nodes.find((node) => node.id === edge.target)?.data.packageName === "c",
      ),
    ).toBe(true);
  });
});
