import { describe, expect, it } from "vitest";
import { filterDependencyReferences } from "../../src/utils/filters";

describe("reference filtering", () => {
  it("filters references by workspace while preserving all-reference mode", () => {
    const refs = [
      { packageName:"react",specifier:"react",uri:"file:///a.ts",relativePath:"a.ts",workspace:"app",line:0,kind:"import" as const },
      { packageName:"react",specifier:"react",uri:"file:///b.ts",relativePath:"b.ts",workspace:"lib",line:0,kind:"require" as const },
    ];
    expect(filterDependencyReferences(refs, "all")).toHaveLength(2);
    expect(filterDependencyReferences(refs, "app")).toHaveLength(1);
  });
});
