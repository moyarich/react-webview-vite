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

  const selectedNodes = nodes.map((node) => ({
    ...node,
    selected: node.data.packageName === selectedPackageName,
  }));

  return (
    <ReactFlow
      nodes={selectedNodes}
      edges={edges}
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
