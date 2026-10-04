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
}: {
  nodes: Node<DependencyGraphNodeData>[];
  edges: Edge[];
}) {
  const openNode: NodeMouseHandler = (_event, node) => {
    const data = node.data as DependencyGraphNodeData;

    if (data.href) {
      window.open(data.href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      fitViewOptions={{ padding: 0.18 }}
      minZoom={0.2}
      maxZoom={1.8}
      onNodeClick={openNode}
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
