import { describe, expect, it } from "vitest";
import {
  createVersionContext,
  getPackageLockVersion,
  getVersionStatus,
} from "../../src/utils/versions";

describe("dependency version context", () => {
  it("reads package-lock v2/v3 package entries", () => {
    expect(
      getPackageLockVersion(
        {
          packages: {
            "node_modules/react": { version: "19.2.0" },
          },
        },
        "react",
      ),
    ).toBe("19.2.0");
  });

  it("falls back to package-lock v1 dependencies", () => {
    expect(
      getPackageLockVersion(
        {
          dependencies: {
            react: { version: "18.3.1" },
          },
        },
        "react",
      ),
    ).toBe("18.3.1");
  });

  it("classifies exact-version mismatches before update availability", () => {
    expect(getVersionStatus("19.1.0", "19.2.0", "19.2.0")).toBe("resolved-mismatch");
  });

  it("reports update availability and up-to-date installations", () => {
    expect(getVersionStatus("^19.0.0", "19.1.0", "19.2.0")).toBe("update-available");
    expect(getVersionStatus("^19.0.0", "19.2.0", "19.2.0")).toBe("up-to-date");
  });

  it("builds a version context without mutating dependencies", () => {
    expect(
      createVersionContext({
        packageName: "react",
        declaredVersion: "^19.0.0",
        resolvedVersion: "19.2.0",
        latestVersion: "19.2.0",
        lockfilePath: "package-lock.json",
      }),
    ).toEqual({
      packageName: "react",
      declaredVersion: "^19.0.0",
      resolvedVersion: "19.2.0",
      latestVersion: "19.2.0",
      lockfilePath: "package-lock.json",
      status: "up-to-date",
    });
  });
});
