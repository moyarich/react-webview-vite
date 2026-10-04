import { describe, expect, it } from "vitest";
import { normalizeLicense } from "../../src/utils/resolve";

describe("package metadata normalization", () => {
  it("normalizes string and object licenses", () => {
    expect(normalizeLicense("MIT")).toBe("MIT");
    expect(normalizeLicense({ type: "Apache-2.0" })).toBe("Apache-2.0");
  });

  it("gracefully ignores missing or invalid license metadata", () => {
    expect(normalizeLicense(undefined)).toBeUndefined();
    expect(normalizeLicense({})).toBeUndefined();
  });
});
