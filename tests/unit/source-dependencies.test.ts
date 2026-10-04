import { describe, expect, it } from "vitest";
import {
  normalizePackageName,
  parseSourceDependencyReferences,
} from "../../src/utils/source-dependencies";

describe("parseSourceDependencyReferences", () => {
  it("finds imports, type imports, dynamic imports, requires, and reexports", () => {
    const source = [
      'import value from "pkg";',
      'import { other } from "pkg";',
      'import type { Type } from "typed";',
      'const lazy = import("dynamic");',
      'const common = require("common");',
      'export { thing } from "reexported";',
      'export * from "starred";',
    ].join("\n");

    const references = parseSourceDependencyReferences(source);

    expect(references.map(({ packageName, kind }) => [packageName, kind])).toEqual(
      expect.arrayContaining([
        ["pkg", "import"],
        ["typed", "type-import"],
        ["dynamic", "dynamic-import"],
        ["common", "require"],
        ["reexported", "reexport"],
        ["starred", "reexport"],
      ]),
    );
  });

  it("normalizes package subpaths and scoped packages", () => {
    expect(normalizePackageName("lodash/debounce")).toBe("lodash");
    expect(normalizePackageName("@scope/pkg/subpath")).toBe("@scope/pkg");
  });

  it("ignores local and Node built-in imports", () => {
    expect(normalizePackageName("./local")).toBeUndefined();
    expect(normalizePackageName("../shared")).toBeUndefined();
    expect(normalizePackageName("node:path")).toBeUndefined();
  });

  it("returns stable source locations", () => {
    const source = ["const first = 1;", 'import value from "pkg";'].join("\n");
    const [reference] = parseSourceDependencyReferences(source).filter(
      (item) => item.packageName === "pkg",
    );

    expect(reference).toMatchObject({ line: 1, column: 0 });
  });
});
