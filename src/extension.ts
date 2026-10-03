import * as vscode from "vscode";
import {
  getJsonDependencyLinks,
  getYamlDependencyLinks,
  resolvePackage,
} from "./dependencies";
import { openWebviewPanel } from "./extension/webviews/openWebviewPanel";

type DependencyDocumentLink = vscode.DocumentLink & {
  data?: { packageName: string };
};

export function activate(context: vscode.ExtensionContext) {
  const provider: vscode.DocumentLinkProvider = {
    async provideDocumentLinks(document) {
      if (document.languageId === "json" || document.languageId === "jsonc") {
        return getJsonDependencyLinks(document);
      }

      return getYamlDependencyLinks(document);
    },

    async resolveDocumentLink(link: DependencyDocumentLink) {
      const packageName = link.data?.packageName;
      if (!packageName) {
        return link;
      }

      const resolved = await resolvePackage(packageName);
      link.target = vscode.Uri.parse(resolved.repositoryUrl ?? resolved.npmUrl);
      link.tooltip = resolved.repositoryUrl
        ? `Open ${packageName} repository`
        : `Open ${packageName} on npm`;

      return link;
    },
  };

  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      [
        { language: "json", pattern: "**/package.json" },
        { language: "jsonc", pattern: "**/package.json" },
        { language: "yaml", pattern: "**/*.{yaml,yml}" },
      ],
      provider,
    ),
    vscode.commands.registerCommand("dependencyLinks.openPanel", () => {
      openWebviewPanel(context, "inspector");
    }),
    vscode.commands.registerCommand("dependencyLinks.openDependencyGraph", () => {
      openWebviewPanel(context, "dependencyGraph");
    }),
  );
}

export function deactivate() {}
