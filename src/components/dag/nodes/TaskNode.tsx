import { memo, useState } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { DagNodeData } from '../flowConfig';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, AlertCircle, Clock, CheckCircle2, Circle } from 'lucide-react';

interface TaskNodeData extends DagNodeData {
  priority?: 'Must' | 'Should' | 'Could';
  taskId?: string;
  description?: string;
}

type TaskNodeType = Node<TaskNodeData>;

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Circle,
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    badge: 'bg-gray-100 text-gray-600',
    dot: 'bg-gray-400',
  },
  'in-progress': {
    label: 'In Progress',
    icon: Clock,
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    bg: 'bg-green-50',
    border: 'border-green-300',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
  },
  blocked: {
    label: 'Blocked',
    icon: AlertCircle,
    bg: 'bg-red-50',
    border: 'border-red-300',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
};

const priorityConfig = {
  Must: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  Should: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  Could: { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
};

function TaskNodeComponent({ data }: NodeProps<TaskNodeType>) {
  const [expanded, setExpanded] = useState(false);
  const status = data.status;
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const priority = data.priority;
  const pConfig = priority ? priorityConfig[priority] : null;
  const isCritical = data.isCriticalPath ?? false;
  const parallelLevel = data.parallelLevel ?? 0;

  return (
    <div
      className={cn(
        'relative w-[200px] rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-px',
        config.bg,
        config.border,
        isCritical && 'border-l-amber-500 border-l-[4px]',
        expanded && 'shadow-md translate-y-0'
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-foreground/70 !border-2 !border-background" />

      <div className="p-4">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-3 h-3 rounded-full shrink-0', config.dot)} />
          <span className="font-medium text-sm text-foreground truncate flex-1 leading-snug">
            {data.label}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-black/5 transition-colors shrink-0"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <span className={cn('inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium', config.badge)}>
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </span>
          {pConfig && priority && (
            <span className={cn(
              'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium border',
              pConfig.color,
              pConfig.bg,
              pConfig.border
            )}>
              {priority}
            </span>
          )}
          {isCritical && (
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 border border-amber-200">
              CP
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">
            W{data.wave} · L{parallelLevel}
          </span>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-black/8">
            {data.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {data.description}
              </p>
            )}
            {data.taskId && (
              <p className="text-xs text-muted-foreground/70 mt-2 font-mono">
                {data.taskId}
              </p>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-foreground/70 !border-2 !border-background" />
    </div>
  );
}

export const TaskNode = memo(TaskNodeComponent);
export type { TaskNodeData };
