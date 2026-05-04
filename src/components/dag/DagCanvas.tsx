import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Connection,
  type Node,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { defaultFlowProps } from './flowConfig';
import { TaskNode } from './nodes/TaskNode';
import { DependencyEdge } from './edges/DependencyEdge';

import type { DagNode, DagEdge } from './flowConfig';

const nodeTypes = {
  taskNode: TaskNode,
};

const edgeTypes = {
  dependencyEdge: DependencyEdge,
};

interface DagCanvasProps {
  initialNodes?: DagNode[];
  initialEdges?: DagEdge[];
  onNodeClick?: (nodeId: string) => void;
  focusedNodeId?: string;
}

function FlowContent({
  initialNodes,
  initialEdges,
  onNodeClick,
  focusedNodeId,
}: {
  initialNodes: DagNode[];
  initialEdges: DagEdge[];
  onNodeClick?: (nodeId: string) => void;
  focusedNodeId?: string;
}) {
  const [nodes, , onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();
  const prevFocusedRef = useRef<string | undefined>(undefined);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  // Focus on a specific node when focusedNodeId changes
  useEffect(() => {
    if (focusedNodeId && focusedNodeId !== prevFocusedRef.current) {
      prevFocusedRef.current = focusedNodeId;
      // Find the node
      const targetNode = nodes.find((n) => n.id === focusedNodeId);
      if (targetNode) {
        fitView({
          nodes: [targetNode],
          padding: 0.4,
          duration: 600,
        });
      }
    }
  }, [focusedNodeId, nodes, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      {...defaultFlowProps}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="hsl(0 0% 89.8%)"
        className="opacity-60"
      />
      <Controls
        className="!bg-background !border-border !shadow-sm"
      />
      <MiniMap
        nodeStrokeWidth={2}
        nodeBorderRadius={8}
        zoomable
        pannable
        className="!bg-background !border-border !shadow-sm !rounded-lg"
        maskColor="hsl(0 0% 96.1% / 0.7)"
        maskStrokeColor="hsl(0 0% 89.8%)"
        maskStrokeWidth={1}
      />
    </ReactFlow>
  );
}

export function DagCanvas({
  initialNodes = [],
  initialEdges = [],
  onNodeClick,
  focusedNodeId,
}: DagCanvasProps) {
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <FlowContent
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          onNodeClick={onNodeClick}
          focusedNodeId={focusedNodeId}
        />
      </ReactFlowProvider>
    </div>
  );
}
