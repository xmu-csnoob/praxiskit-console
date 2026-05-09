import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Panel,
  type Connection,
  type Node,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Maximize2, Plus, Minus } from 'lucide-react';

import { defaultFlowProps } from './flowConfig';
import { TaskNode } from './nodes/TaskNode';
import { DependencyEdge } from './edges/DependencyEdge';
import { DagLegend } from './DagLegend';

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
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const prevFocusedRef = useRef<string | undefined>(undefined);
  const prevNodesRef = useRef<DagNode[]>(initialNodes);
  const prevEdgesRef = useRef<DagEdge[]>(initialEdges);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Compute connected nodes/edges for hover dimming
  const { connectedNodeIds, connectedEdgeIds } = useMemo(() => {
    if (!hoveredNodeId) return { connectedNodeIds: new Set<string>(), connectedEdgeIds: new Set<string>() };
    const nodeIds = new Set<string>([hoveredNodeId]);
    const edgeIds = new Set<string>();
    for (const e of edges) {
      if (e.source === hoveredNodeId || e.target === hoveredNodeId) {
        edgeIds.add(e.id);
        nodeIds.add(e.source);
        nodeIds.add(e.target);
      }
    }
    return { connectedNodeIds: nodeIds, connectedEdgeIds: edgeIds };
  }, [hoveredNodeId, edges]);

  // Apply opacity dimming to non-connected nodes
  const displayNodes = useMemo(() =>
    nodes.map(n => ({
      ...n,
      style: {
        ...n.style,
        opacity: hoveredNodeId && !connectedNodeIds.has(n.id) ? 0.25 : 1,
        transition: 'opacity 0.15s ease',
      },
    })),
  [nodes, hoveredNodeId, connectedNodeIds]);

  // Mark dimmed edges via data
  const displayEdges = useMemo(() =>
    edges.map(e => ({
      ...e,
      data: {
        ...e.data,
        dimmed: !!(hoveredNodeId && !connectedEdgeIds.has(e.id)),
      },
    })),
  [edges, hoveredNodeId, connectedEdgeIds]);

  // Sync nodes/edges without resetting viewport when props change.
  useEffect(() => {
    if (initialNodes !== prevNodesRef.current) {
      setNodes(initialNodes);
      prevNodesRef.current = initialNodes;
    }
  }, [initialNodes, setNodes]);

  useEffect(() => {
    if (initialEdges !== prevEdgesRef.current) {
      setEdges(initialEdges);
      prevEdgesRef.current = initialEdges;
    }
  }, [initialEdges, setEdges]);

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
      nodes={displayNodes}
      edges={displayEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={handleNodeClick}
      onNodeMouseEnter={(_evt, node) => setHoveredNodeId(node.id)}
      onNodeMouseLeave={() => setHoveredNodeId(null)}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      {...defaultFlowProps}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1.2}
        color="hsl(0 0% 88%)"
      />
      <MiniMap
        nodeColor={(node) => {
          const status = (node.data as { status?: string })?.status;
          const colorMap: Record<string, string> = {
            'pending': 'hsl(215 14% 60%)',
            'in-progress': 'hsl(217 91% 60%)',
            'completed': 'hsl(142 71% 45%)',
            'blocked': 'hsl(0 84% 60%)',
          };
          return colorMap[status ?? 'pending'] ?? 'hsl(215 14% 60%)';
        }}
        nodeStrokeWidth={0}
        nodeBorderRadius={6}
        zoomable
        pannable
        className="!bg-background !border-border !shadow-sm !rounded-xl"
        maskColor="hsl(0 0% 96% / 0.75)"
      />
      <Panel position="bottom-left" className="flex gap-1 m-3">
        <button
          onClick={() => fitView({ padding: 0.25, duration: 400 })}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-background border border-border shadow-sm hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Fit view"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => zoomIn({ duration: 200 })}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-background border border-border shadow-sm hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Zoom in"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => zoomOut({ duration: 200 })}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-background border border-border shadow-sm hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Zoom out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </Panel>
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
    <div className="w-full h-full relative">
      <ReactFlowProvider>
        <FlowContent
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          onNodeClick={onNodeClick}
          focusedNodeId={focusedNodeId}
        />
      </ReactFlowProvider>
      <DagLegend />
    </div>
  );
}
