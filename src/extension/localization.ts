import * as vscode from "vscode";
import type { WebviewMessages } from "../shared/localization";

export function getWebviewMessages(): WebviewMessages {
  return {
    appName: vscode.l10n.t("Dependency Links"),
    inspectorTitle: vscode.l10n.t("Dependency Inspector"),
    inspectorDescription: vscode.l10n.t(
      "Resolve npm packages, repository references, manifest URLs, JSON, YAML, or dependency maps into source and package links.",
    ),
    graphTitle: vscode.l10n.t("Dependency Graph"),
    graphDescription: vscode.l10n.t(
      "Visualize manifest dependencies by section and open package repositories directly from the graph.",
    ),
    input: vscode.l10n.t("Input"),
    dependencySource: vscode.l10n.t("Dependency source"),
    manifestInput: vscode.l10n.t("Manifest input"),
    status: vscode.l10n.t("Status"),
    graphStatus: vscode.l10n.t("Graph status"),
    dependencyTree: vscode.l10n.t("Dependency tree"),
    resolveDependencies: vscode.l10n.t("Resolve dependencies"),
    resolving: vscode.l10n.t("Resolving…"),
    buildGraph: vscode.l10n.t("Build graph"),
    building: vscode.l10n.t("Building…"),
    clear: vscode.l10n.t("Clear"),
    readyResolve: vscode.l10n.t("Ready to resolve dependencies."),
    readyGraph: vscode.l10n.t("Ready to build a dependency graph."),
    noDependencies: vscode.l10n.t("No dependencies found."),
    resolutionFailed: vscode.l10n.t("Resolution failed."),
    graphResolutionFailed: vscode.l10n.t("Graph resolution failed."),
    noResolvedPackagesTitle: vscode.l10n.t("No resolved packages yet"),
    noResolvedPackagesDescription: vscode.l10n.t(
      "Paste a package or manifest above and resolve it to inspect repository, npm, and homepage links.",
    ),
    noGraphTitle: vscode.l10n.t("No graph yet"),
    noGraphDescription: vscode.l10n.t(
      "Resolve a manifest to create a grouped dependency tree. Package nodes open their source repository when available.",
    ),
    repository: vscode.l10n.t("Repository"),
    npm: vscode.l10n.t("npm"),
    homepage: vscode.l10n.t("Homepage"),
    directInput: vscode.l10n.t("Direct input"),
    openPackage: vscode.l10n.t("Open package →"),
    packages: vscode.l10n.t("packages"),
    dependencyGroups: vscode.l10n.t("dependency groups"),
    groups: vscode.l10n.t("groups"),
    nodes: vscode.l10n.t("nodes"),
    working: vscode.l10n.t("Working"),
    idle: vscode.l10n.t("Idle"),
    manifest: vscode.l10n.t("manifest"),
    inputKinds: vscode.l10n.t("npm · GitHub · JSON · YAML · URL"),
    manifestKinds: vscode.l10n.t("JSON · YAML"),
    inputPlaceholder: vscode.l10n.t(
      "@scope/package@^1.0.0, owner/repo, URL, JSON, or YAML",
    ),
    resolvedCount: vscode.l10n.t("Resolved {0}"),
    graphContainsCount: vscode.l10n.t("Graph contains {0}"),
    packageCount: vscode.l10n.t("{0} package(s)"),
    groupCount: vscode.l10n.t("{0} group(s)"),
    nodeCount: vscode.l10n.t("{0} node(s)"),
  };
}
