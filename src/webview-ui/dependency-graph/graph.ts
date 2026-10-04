import type { Edge, Node } from "@xyflow/react";
import type { DependencyResult } from "../../shared/types";

export type DependencyGraphNodeData = {
  label: string;
  spec?: string;
  href?: string;
  kind: "root" | "group" | "package";
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
    const groupId = `group:${kind}`;
    const groupX = 320;
    const groupY = groupIndex * 220;

    nodes.push({
      id: groupId,
      position: { x: groupX, y: groupY },
      data: { label: kind, kind: "group" },
    });
    edges.push({ id: `manifest->${groupId}`, source: "manifest", target: groupId });

    items.forEach((item, itemIndex) => {
      const id = `${kind}:${item.name}:${item.spec ?? ""}`;
      nodes.push({
        id,
        position: { x: 680, y: groupY + itemIndex * 110 },
        data: {
          label: item.name,
          spec: item.spec,
          href: item.repositoryUrl ?? item.npmUrl,
          kind: "package",
        },
      });
      edges.push({ id: `${groupId}->${id}`, source: groupId, target: id });
    });
  });

  return { nodes, edges };
}
