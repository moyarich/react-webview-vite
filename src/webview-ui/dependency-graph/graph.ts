import type { Edge, Node } from "@xyflow/react";
import type { DependencyResult } from "../../shared/types";

export type DependencyGraphNodeData = {
  label: string;
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
          spec: item.spec,
          href: item.repositoryUrl ?? item.npmUrl,
          packageName: item.name,
          kind: "package",
          relationship: "direct",
        },
      });
      edges.push({ id: groupId + "->" + id, source: groupId, target: id });

      appendTransitive(item, id, itemY, item.workspaceId, nodes, edges, new Set([item.name]));
    });
  });

  return { nodes, edges };
}

function appendTransitive(
  parent: DependencyResult,
  parentId: string,
  parentY: number,
  workspaceId: string | undefined,
  nodes: Node<DependencyGraphNodeData>[],
  edges: Edge[],
  ancestry: Set<string>,
) {
  (parent.dependencies ?? []).forEach((dependency, index) => {
    if (ancestry.has(dependency.name)) return;
    const depth = dependency.depth ?? 1;
    const dependencyId = ["transitive", workspaceId ?? "manual", ...ancestry, dependency.name].join(
      ":",
    );
    if (!nodes.some((node) => node.id === dependencyId)) {
      nodes.push({
        id: dependencyId,
        position: { x: 1020 + Math.max(0, depth - 1) * 320, y: parentY + index * 82 },
        data: {
          label: dependency.name,
          spec: dependency.spec,
          href: dependency.repositoryUrl ?? dependency.npmUrl,
          packageName: dependency.name,
          kind: "package",
          relationship: "transitive",
        },
      });
    }
    const edgeId = `${parentId}->${dependencyId}`;
    if (!edges.some((edge) => edge.id === edgeId)) {
      edges.push({
        id: edgeId,
        source: parentId,
        target: dependencyId,
        animated: false,
        style: { strokeDasharray: "4 4" },
      });
    }
    appendTransitive(
      dependency,
      dependencyId,
      parentY + index * 82,
      workspaceId,
      nodes,
      edges,
      new Set(ancestry).add(dependency.name),
    );
  });
}
