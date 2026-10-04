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

export function getYarnLockVersion(text: string, packageName: string) {
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = new RegExp(
    `(?:^|\\n)(?:"?${escaped}@[^\\n:]+"?(?:,\\s*"?${escaped}@[^\\n:]+"?)*)\\:\\n([\\s\\S]*?)(?=\\n\\S|$)`,
    "m",
  ).exec(text)?.[1];
  return block?.match(/^\s+version\s+"?([^"\n]+)"?/m)?.[1];
}

export function getPnpmLockVersion(text: string, packageName: string) {
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const importerMatch = new RegExp(
    `\\n\\s{4}${escaped}:\\n(?:[\\s\\S]*?\\n\\s{6}version:\\s*([^\\s(]+))`,
    "m",
  ).exec(text)?.[1];
  if (importerMatch) return importerMatch;
  return new RegExp(`\\n\s{2}/?${escaped}@([^:\\s]+):`, "m").exec(text)?.[1];
}
