import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { DependencyGraphNodeData } from "./graph";

export function DependencyFlow({
  nodes,
  edges,
  selectedPackageName,
  onPackageSelect,
}: {
  nodes: Node<DependencyGraphNodeData>[];
  edges: Edge[];
  selectedPackageName?: string;
  onPackageSelect: (packageName: string) => void;
}) {
  const selectNode: NodeMouseHandler = (_event, node) => {
    const data = node.data as DependencyGraphNodeData;

    if (data.kind === "package" && data.packageName) {
      onPackageSelect(data.packageName);
    }
  };

  const openNode: NodeMouseHandler = (_event, node) => {
    const data = node.data as DependencyGraphNodeData;

    if (data.href) {
      window.open(data.href, "_blank", "noopener,noreferrer");
    }
  };

  const selectedIds = new Set(
    nodes.filter((node) => node.data.packageName === selectedPackageName).map((node) => node.id),
  );
  const relatedIds = new Set(selectedIds);

  if (selectedIds.size > 0) {
    for (const edge of edges) {
      if (selectedIds.has(edge.source) || selectedIds.has(edge.target)) {
        relatedIds.add(edge.source);
        relatedIds.add(edge.target);
      }
    }
  }

  const displayNodes = nodes.map((node) => ({
    ...node,
    selected: selectedIds.has(node.id),
    style:
      selectedIds.size > 0 && !relatedIds.has(node.id)
        ? { ...node.style, opacity: 0.32 }
        : node.style,
  }));

  const displayEdges = edges.map((edge) => ({
    ...edge,
    style: {
      ...edge.style,
      opacity:
        selectedIds.size === 0 || selectedIds.has(edge.source) || selectedIds.has(edge.target)
          ? 1
          : 0.2,
    },
  }));

  return (
    <ReactFlow
      nodes={displayNodes}
      edges={displayEdges}
      fitView
      fitViewOptions={{ padding: 0.18 }}
      minZoom={0.2}
      maxZoom={1.8}
      onNodeClick={selectNode}
      onNodeDoubleClick={openNode}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable
      colorMode="system"
    >
      <Background gap={24} size={1} />
      <MiniMap pannable zoomable />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export default DependencyFlow;
