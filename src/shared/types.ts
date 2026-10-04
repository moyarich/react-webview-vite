export type DependencyKind =
  | "dependencies"
  | "devDependencies"
  | "peerDependencies"
  | "optionalDependencies"
  | "bundledDependencies"
  | "bundleDependencies"
  | "input";

export type DependencyEntry = {
  name: string;
  spec?: string;
  kind: DependencyKind;
};

export type DependencyResult = DependencyEntry & {
  npmUrl: string;
  repositoryUrl?: string;
  homepageUrl?: string;
  latestVersion?: string;
  description?: string;
  license?: string;
  publishedAt?: string;
  unpackedSize?: number;
  maintainerCount?: number;
  dependencies?: DependencyEntry[];
  workspaceId?: string;
  manifestPath?: string;
};

export type DependencyReferenceKind =
  "manifest" | "import" | "type-import" | "require" | "dynamic-import" | "reexport";

export type ParsedDependencyReference = {
  packageName: string;
  specifier: string;
  kind: Exclude<DependencyReferenceKind, "manifest">;
  start: number;
  end: number;
  line: number;
  column: number;
  text?: string;
};

export type DependencyReference = {
  packageName: string;
  specifier: string;
  uri: string;
  relativePath: string;
  workspace?: string;
  line: number;
  column?: number;
  kind: DependencyReferenceKind;
  text?: string;
  dependencyKind?: string;
};

export type DependencyDependent = {
  workspace?: string;
  relativePath: string;
  dependencyKind?: string;
};

export type DependencyImpact = {
  packageName: string;
  dependents: DependencyDependent[];
  dependencies: DependencyEntry[];
};

export type WorkspaceManifest = {
  id: string;
  name?: string;
  uri: string;
  relativePath: string;
  dependencies: DependencyEntry[];
};

export type DependencyVersionStatus =
  "unknown" | "unresolved" | "up-to-date" | "update-available" | "resolved-mismatch";

export type DependencyVersionContext = {
  packageName: string;
  declaredVersion?: string;
  resolvedVersion?: string;
  latestVersion?: string;
  lockfilePath?: string;
  status: DependencyVersionStatus;
};
