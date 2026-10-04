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
};

export type DependencyReferenceKind =
  | "manifest"
  | "import"
  | "type-import"
  | "require"
  | "dynamic-import"
  | "reexport";

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
