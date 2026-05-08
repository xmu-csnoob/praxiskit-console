import { useState, useCallback } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Shield,
  ShieldAlert,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/store';
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
  const { lang } = useLanguage();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  if (batches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No execution batches found.
      </div>
    );
  }

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const taskStatusMap = new Map(tasks.map((t) => [t.id, t.status]));
  const sorted = [...batches].sort((a, b) => b.id - a.id);

  return (
    <div className="space-y-2">
      {sorted.map((batch) => {
        const total = batch.tasks.length;
        const completed = batch.tasks.filter(
          (t) => taskStatusMap.get(t.id) === 'completed'
        ).length;
        const isExpanded = expanded.has(batch.id);

        return (
          <div
            key={batch.id}
            className="rounded-lg border bg-card overflow-hidden transition-shadow hover:shadow-sm"
          >
            <button
              onClick={() => toggle(batch.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <h4 className="font-semibold text-sm">Batch {batch.id}</h4>
              <BatchStatusBadge
                authorization={batch.authorization}
                baselineStatus={batch.baselineStatus}
                allCompleted={completed === total}
              />
              <span className="ml-auto text-xs text-muted-foreground shrink-0">
                {completed}/{total} done
              </span>
            </button>

            {isExpanded && (
              <div className="px-4 pb-3 pt-0">
                <div className="border-t pt-2 space-y-1">
                  {batch.tasks.slice(0, 6).map((btask) => {
                    const fullTask = taskMap.get(btask.id);
                    const displayTitle =
                      lang === 'zh' && fullTask?.titleCn
                        ? fullTask.titleCn
                        : fullTask?.titleEn ?? btask.title;
                    return (
                      <div key={btask.id} className="flex items-center gap-2 text-sm">
                        <TaskStatusIcon status={taskStatusMap.get(btask.id) ?? btask.statusAtSelection} />
                        <span className="truncate">{displayTitle}</span>
                      </div>
                    );
                  })}
                  {batch.tasks.length > 6 && (
                    <p className="text-xs text-muted-foreground pl-5.5">
                      +{batch.tasks.length - 6} more tasks
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
