import { BaseEdge, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

interface DependencyEdgeData {
  isCritical?: boolean;
  isCycle?: boolean;
  dimmed?: boolean;
}

export function DependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const isCritical = (data as DependencyEdgeData)?.isCritical ?? false;
  const isCycle = (data as DependencyEdgeData)?.isCycle ?? false;
  const dimmed = (data as DependencyEdgeData)?.dimmed ?? false;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.3,
  });

  const strokeColor = selected
    ? 'hsl(217 91% 60%)'
    : isCritical
    ? 'var(--dag-critical)'
    : isCycle
    ? 'var(--dag-cycle)'
    : 'var(--dag-edge-default)';

  const strokeWidth = selected ? 2.5 : isCritical ? 2.5 : 1.5;
  const markerId = `dag-arrow-${id}`;

  return (
    <>
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'visible',
          pointerEvents: 'none',
          width: 0,
          height: 0,
        }}
      >
        <defs>
          <marker
            id={markerId}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L8,3 z" fill={strokeColor} />
          </marker>
        </defs>
      </svg>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        style={{
          strokeWidth,
          stroke: strokeColor,
          strokeDasharray: isCycle ? '6,4' : undefined,
          opacity: dimmed ? 0.15 : selected ? 1 : 0.75,
          transition: 'stroke-width 0.15s ease, stroke 0.15s ease, opacity 0.2s ease',
          ...(isCritical && !selected && {
            filter: 'drop-shadow(0 0 2px hsl(38 92% 50% / 0.35))',
          }),
        }}
      />
      {isCritical && (
        <path
          d={edgePath}
          fill="none"
          stroke="var(--dag-critical)"
          strokeWidth={strokeWidth}
          strokeDasharray="8,12"
          style={{
            opacity: selected ? 0.9 : 0.55,
            animation: 'dag-flow 1.5s linear infinite',
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
}
