import type { ReactFlowProps, Edge, Node } from '@xyflow/react';

export interface DagNodeData {
  label: string;
  labelCn: string;
  labelEn: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  description?: string;
  descriptionCn?: string;
  descriptionEn?: string;
  wave: number;
  /** True if this node is on the critical path (longest dependency chain) */
  isCriticalPath?: boolean;
  /** Topological level — tasks at the same level can run in parallel */
  parallelLevel?: number;
  [key: string]: unknown;
}

export type DagNode = Node<DagNodeData>;
export type DagEdge = Edge;

export const defaultFlowProps: Partial<ReactFlowProps> = {
  fitView: true,
  fitViewOptions: { padding: 0.25 },
  minZoom: 0.1,
  maxZoom: 2,
  defaultEdgeOptions: {
    type: 'dependencyEdge',
    animated: false,
  },
  elevateEdgesOnSelect: true,
  snapToGrid: false,
};

export const nodeColors: Record<DagNodeData['status'], string> = {
  pending: '#9ca3af',
  'in-progress': '#3b82f6',
  completed: '#22c55e',
  blocked: '#ef4444',
};

export const statusLabels: Record<DagNodeData['status'], string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
};
