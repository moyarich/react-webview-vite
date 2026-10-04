import type { Edge, Node } from "@xyflow/react";
import type { DependencyResult } from "../../shared/types";

export type DependencyGraphNodeData = {
  label: string;
  iconText?: string;
  spec?: string;
  href?: string;
  packageName?: string;
  kind: "root" | "group" | "package";
  relationship?: "direct" | "transitive";
};

export function buildDependencyGraph(results: DependencyResult[]): {
  nodes: Node<DependencyGraphNodeData>[];
  edges: Edge[];
} {
  const grouped = results.reduce<Record<string, DependencyResult[]>>((groups, item) => {
    (groups[item.kind] ??= []).push(item);
    return groups;
  }, {});

  const nodes: Node<DependencyGraphNodeData>[] = [
    {
      id: "manifest",
      position: { x: 0, y: 0 },
      data: { label: "manifest", kind: "root" },
      type: "default",
    },
  ];
  const edges: Edge[] = [];

  Object.entries(grouped).forEach(([kind, items], groupIndex) => {
    const groupId = "group:" + kind;
    const groupX = 320;
    const groupY = groupIndex * 260;

    nodes.push({
      id: groupId,
      position: { x: groupX, y: groupY },
      data: { label: kind, kind: "group" },
    });
    edges.push({ id: "manifest->" + groupId, source: "manifest", target: groupId });

    items.forEach((item, itemIndex) => {
      const id = item.workspaceId
        ? [item.workspaceId, kind, item.name, item.spec ?? ""].join(":")
        : [kind, item.name, item.spec ?? ""].join(":");
      const itemY = groupY + itemIndex * 140;

      nodes.push({
        id,
        position: { x: 680, y: itemY },
        data: {
          label: item.name,
          iconText: packageIconText(item.name),
          spec: item.spec,
          href: item.repositoryUrl ?? item.npmUrl,
          packageName: item.name,
          kind: "package",
          relationship: "direct",
        },
      });
      edges.push({ id: groupId + "->" + id, source: groupId, target: id });

      (item.dependencies ?? []).forEach((dependency, dependencyIndex) => {
        const dependencyId = item.workspaceId
          ? ["transitive", item.workspaceId, item.name, dependency.name].join(":")
          : ["transitive", item.name, dependency.name].join(":");

        nodes.push({
          id: dependencyId,
          position: { x: 1020, y: itemY + dependencyIndex * 82 },
          data: {
            label: dependency.name,
            iconText: packageIconText(dependency.name),
            spec: dependency.spec,
            packageName: dependency.name,
            kind: "package",
            relationship: "transitive",
          },
        });
        edges.push({
          id: id + "->" + dependencyId,
          source: id,
          target: dependencyId,
          animated: false,
          style: { strokeDasharray: "4 4" },
        });
      });
    });
  });

  return { nodes, edges };
}

export function packageIconText(name: string) {
  const unscoped = name.startsWith("@") ? (name.split("/").at(-1) ?? name) : name;
  return unscoped.slice(0, 2).toUpperCase();
}
