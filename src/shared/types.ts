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
