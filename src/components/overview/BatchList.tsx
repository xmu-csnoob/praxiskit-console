import { CheckCircle2, Circle, Clock, Shield, ShieldAlert, ClipboardCheck } from 'lucide-react';
import type { ParsedBatch, ParsedTask } from '@/parser/types';

interface BatchListProps {
  batches: ParsedBatch[];
  tasks: ParsedTask[];
}

function BatchStatusBadge({
  authorization,
  baselineStatus,
  allCompleted,
}: {
  authorization: string;
  baselineStatus: string;
  allCompleted: boolean;
}) {
  if (authorization === 'execute') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <Shield className="w-3 h-3" />
        Executed
      </span>
    );
  }
  if (baselineStatus === 'fail') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
        <ShieldAlert className="w-3 h-3" />
        Failed
      </span>
    );
  }
  if (allCompleted) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
        <ClipboardCheck className="w-3 h-3" />
        Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" />
      Dry Run
    </span>
  );
}

function TaskStatusIcon({ status }: { status: string }) {
  if (status === 'completed' || status === 'done' || status === '[x]') {
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
  }
  if (status === 'in-progress' || status === '[/]') {
    return <Clock className="w-3.5 h-3.5 text-sky-500" />;
  }
  return <Circle className="w-3.5 h-3.5 text-muted-foreground/50" />;
}

export function BatchList({ batches, tasks }: BatchListProps) {
  if (batches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No execution batches found.
      </div>
    );
  }

  const taskStatusMap = new Map(tasks.map((t) => [t.id, t.status]));

  const sorted = [...batches].sort((a, b) => b.id - a.id);

  return (
    <div className="space-y-3">
      {sorted.map((batch) => {
        const total = batch.tasks.length;
        const completed = batch.tasks.filter(
          (t) => taskStatusMap.get(t.id) === 'completed'
        ).length;

        return (
          <div
            key={batch.id}
            className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Batch {batch.id}</h4>
              <BatchStatusBadge
                authorization={batch.authorization}
                baselineStatus={batch.baselineStatus}
                allCompleted={completed === total}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span>{total} task{total !== 1 ? 's' : ''}</span>
              <span>·</span>
              <span>{completed} completed</span>
            </div>
            <div className="space-y-1">
              {batch.tasks.slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <TaskStatusIcon status={taskStatusMap.get(task.id) ?? task.statusAtSelection} />
                  <span className="truncate">{task.title}</span>
                </div>
              ))}
              {batch.tasks.length > 4 && (
                <p className="text-xs text-muted-foreground pl-5.5">
                  +{batch.tasks.length - 4} more tasks
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
