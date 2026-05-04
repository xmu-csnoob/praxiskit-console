import { ListTodo, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { StatCard } from './StatCard';
import { ProgressRing } from './ProgressRing';
import { BatchList } from './BatchList';
import { useProjectStore } from '@/store/projectStore';
import type { ParsedTask, ParsedBatch } from '@/parser/types';

interface OverviewPanelProps {
  tasks: ParsedTask[];
  batches: ParsedBatch[];
}

export function OverviewPanel({ tasks, batches }: OverviewPanelProps) {
  const { state } = useProjectStore();
  const currentWave = state.waves[state.currentWaveIndex] ?? null;
  const isMultiWave = state.waves.length > 1 || state.waves.some((wave) => !wave.isActive);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const blocked = tasks.filter((t) => t.status === 'blocked').length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold">Project Overview</h2>
            {isMultiWave && currentWave && (
              <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {currentWave.name}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {total} tasks across {batches.length} batch{batches.length !== 1 ? 'es' : ''}
            {isMultiWave && currentWave && ` · ${currentWave.name}`}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Tasks" value={total} icon={ListTodo} color="info" />
          <StatCard label="Completed" value={completed} icon={CheckCircle2} color="success" />
          <StatCard label="In Progress" value={inProgress} icon={Loader2} color="warning" />
          <StatCard label="Blocked" value={blocked} icon={AlertCircle} color="danger" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex flex-col items-center justify-center rounded-lg border bg-card p-6">
            <ProgressRing value={progress} label="Overall Progress" size={140} strokeWidth={10} />
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Done</span>
                <span className="font-medium ml-auto">{completed}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span className="text-muted-foreground">Active</span>
                <span className="font-medium ml-auto">{inProgress}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium ml-auto">{pending}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Blocked</span>
                <span className="font-medium ml-auto">{blocked}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Recent Batches
            </h3>
            <BatchList batches={batches} tasks={tasks} />
          </div>
        </div>
      </div>
    </div>
  );
}
