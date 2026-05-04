import { BaseEdge, getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

export function DependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 20,
    offset: 20,
  });

  const isCritical = style.stroke === '#f59e0b';
  const isCycle = style.strokeDasharray === '5,5';

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        strokeWidth: selected ? 3 : isCritical ? 2.5 : isCycle ? 1.5 : 1.5,
        stroke: selected
          ? '#3b82f6'
          : isCritical
            ? '#f59e0b'
            : isCycle
              ? '#ef4444'
              : style.stroke
                ? style.stroke
                : '#9ca3af',
        transition: 'stroke-width 0.2s ease, stroke 0.2s ease, opacity 0.2s ease',
        opacity: selected ? 1 : 0.85,
      }}
    />
  );
}
