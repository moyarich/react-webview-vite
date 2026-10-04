export type WebviewMessages = {
  appName: string;
  inspectorTitle: string;
  inspectorDescription: string;
  graphTitle: string;
  graphDescription: string;
  input: string;
  dependencySource: string;
  manifestInput: string;
  status: string;
  graphStatus: string;
  dependencyTree: string;
  resolveDependencies: string;
  resolving: string;
  buildGraph: string;
  building: string;
  clear: string;
  readyResolve: string;
  readyGraph: string;
  noDependencies: string;
  resolutionFailed: string;
  graphResolutionFailed: string;
  noResolvedPackagesTitle: string;
  noResolvedPackagesDescription: string;
  noGraphTitle: string;
  noGraphDescription: string;
  repository: string;
  npm: string;
  homepage: string;
  directInput: string;
  openPackage: string;
  packages: string;
  dependencyGroups: string;
  groups: string;
  nodes: string;
  working: string;
  idle: string;
  manifest: string;
  inputKinds: string;
  manifestKinds: string;
  inputPlaceholder: string;
  resolvedCount: string;
  graphContainsCount: string;
  packageCount: string;
  groupCount: string;
  nodeCount: string;
  references: string;
  noReferences: string;
  referencesFor: string;
  loadingReferences: string;
  openReference: string;
};

export const defaultWebviewMessages: WebviewMessages = {
  appName: "Dependency Links",
  inspectorTitle: "Dependency Inspector",
  inspectorDescription:
    "Resolve npm packages, repository references, manifest URLs, JSON, YAML, or dependency maps into source and package links.",
  graphTitle: "Dependency Graph",
  graphDescription:
    "Visualize manifest dependencies by section and open package repositories directly from the graph.",
  input: "Input",
  dependencySource: "Dependency source",
  manifestInput: "Manifest input",
  status: "Status",
  graphStatus: "Graph status",
  dependencyTree: "Dependency tree",
  resolveDependencies: "Resolve dependencies",
  resolving: "Resolving…",
  buildGraph: "Build graph",
  building: "Building…",
  clear: "Clear",
  readyResolve: "Ready to resolve dependencies.",
  readyGraph: "Ready to build a dependency graph.",
  noDependencies: "No dependencies found.",
  resolutionFailed: "Resolution failed.",
  graphResolutionFailed: "Graph resolution failed.",
  noResolvedPackagesTitle: "No resolved packages yet",
  noResolvedPackagesDescription:
    "Paste a package or manifest above and resolve it to inspect repository, npm, and homepage links.",
  noGraphTitle: "No graph yet",
  noGraphDescription:
    "Resolve a manifest to create a grouped dependency tree. Package nodes open their source repository when available.",
  repository: "Repository",
  npm: "npm",
  homepage: "Homepage",
  directInput: "Direct input",
  openPackage: "Open package →",
  packages: "packages",
  dependencyGroups: "dependency groups",
  groups: "groups",
  nodes: "nodes",
  working: "Working",
  idle: "Idle",
  manifest: "manifest",
  inputKinds: "npm · GitHub · JSON · YAML · URL",
  manifestKinds: "JSON · YAML",
  inputPlaceholder: "@scope/package@^1.0.0, owner/repo, URL, JSON, or YAML",
  resolvedCount: "Resolved {0}",
  graphContainsCount: "Graph contains {0}",
  packageCount: "{0} package(s)",
  groupCount: "{0} group(s)",
  nodeCount: "{0} node(s)",
  references: "References",
  noReferences: "No workspace references found.",
  referencesFor: "References for {0}",
  loadingReferences: "Finding references…",
  openReference: "Open reference",
};

export function formatMessage(message: string, ...args: Array<string | number>): string {
  return args.reduce<string>(
    (result, value, index) => result.replaceAll(`{${index}}`, String(value)),
    message,
  );
}
