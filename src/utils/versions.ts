import type { DependencyVersionContext, DependencyVersionStatus } from "../shared/types";

type PackageLockLike = {
  packages?: Record<string, { version?: string } | undefined>;
  dependencies?: Record<string, { version?: string } | undefined>;
};

export function getPackageLockVersion(lock: unknown, packageName: string) {
  if (!lock || typeof lock !== "object") {
    return undefined;
  }

  const packageLock = lock as PackageLockLike;
  const packageEntry = packageLock.packages?.["node_modules/" + packageName];

  return packageEntry?.version ?? packageLock.dependencies?.[packageName]?.version;
}

export function createVersionContext(input: {
  packageName: string;
  declaredVersion?: string;
  resolvedVersion?: string;
  latestVersion?: string;
  lockfilePath?: string;
}): DependencyVersionContext {
  return {
    ...input,
    status: getVersionStatus(input.declaredVersion, input.resolvedVersion, input.latestVersion),
  };
}

export function getVersionStatus(
  declaredVersion?: string,
  resolvedVersion?: string,
  latestVersion?: string,
): DependencyVersionStatus {
  if (!resolvedVersion) {
    return latestVersion ? "unresolved" : "unknown";
  }

  const exactDeclared = parseExactVersion(declaredVersion);
  if (exactDeclared && exactDeclared !== resolvedVersion) {
    return "resolved-mismatch";
  }

  if (latestVersion && latestVersion !== resolvedVersion) {
    return "update-available";
  }

  if (latestVersion && latestVersion === resolvedVersion) {
    return "up-to-date";
  }

  return "unknown";
}

function parseExactVersion(value?: string) {
  if (!value) {
    return undefined;
  }

  const match = value.trim().match(/^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/);
  return match?.[1];
}
