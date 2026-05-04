import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FileText, ArrowRight, GitGraph } from 'lucide-react';
import type { ParsedFunctionalRequirement, ParsedTask } from '@/parser/types';

interface PrdMappingViewProps {
  functionalRequirements: ParsedFunctionalRequirement[];
  tasks: ParsedTask[];
  onTaskClick?: (taskId: string) => void;
}

interface TaskCardProps {
  task: ParsedTask;
  onClick?: () => void;
}

const statusConfig = {
  pending: { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600', label: 'Pending' },
  'in-progress': { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700', label: 'In Progress' },
  completed: { dot: 'bg-green-500', badge: 'bg-green-100 text-green-700', label: 'Completed' },
  blocked: { dot: 'bg-red-500', badge: 'bg-red-100 text-red-700', label: 'Blocked' },
};

function TaskCard({ task, onClick }: TaskCardProps) {
  const config = statusConfig[task.status];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border bg-card p-3 transition-all duration-150',
        'hover:shadow-sm hover:border-primary/40 hover:bg-accent/30',
        'focus:outline-none focus:ring-2 focus:ring-primary/20'
      )}
    >
      <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full shrink-0', config.dot)} />
        <span className="font-mono text-xs text-muted-foreground shrink-0">{task.id}</span>
        <span className="text-sm font-medium text-foreground truncate flex-1">{task.title}</span>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
      </div>
      <div className="flex items-center gap-2 mt-1.5 ml-4">
        <span className={cn('inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-medium', config.badge)}>
          {config.label}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          W{task.wave}
        </span>
        {task.dependencies.length > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {task.dependencies.length} dep{task.dependencies.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </button>
  );
}

function EmptyFRState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
        <FileText className="w-5 h-5 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">No Functional Requirements Found</h3>
      <p className="text-xs text-muted-foreground max-w-sm">
        The project does not contain a PRD.md file with a Functional Requirements section, or the section is empty.
      </p>
    </div>
  );
}

/**
 * Maps a functional requirement to related tasks using heuristic matching.
 *
 * Matching strategy (in order of priority):
 * 1. Task title or acceptance criteria contains the FR ID (e.g., "FR4", "FR 4")
 * 2. Task acceptance criteria semantically relates to the FR requirement text
 * 3. Task write scope mentions the FR
 */
function findRelatedTasks(fr: ParsedFunctionalRequirement, tasks: ParsedTask[]): ParsedTask[] {
  const frIdPattern = new RegExp(`\\b${fr.id}\\b`, 'i');
  const frIdLoosePattern = new RegExp(`\\b${fr.id.replace(/FR/i, 'FR ')}\\b`, 'i');

  const related: ParsedTask[] = [];
  const scored = new Map<string, number>();

  for (const task of tasks) {
    let score = 0;

    // Direct mention of FR ID in task title or acceptance criteria
    if (frIdPattern.test(task.title) || frIdPattern.test(task.acceptanceCriteria)) {
      score += 100;
    }
    if (frIdLoosePattern.test(task.title) || frIdLoosePattern.test(task.acceptanceCriteria)) {
      score += 50;
    }

    // Mention of FR ID in write scope
    if (frIdPattern.test(task.writeScope)) {
      score += 30;
    }

    // Semantic overlap: key words from FR requirement appear in task
    const frWords = fr.requirement
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['the', 'and', 'for', 'with', 'from', 'that', 'this', 'then', 'when', 'given'].includes(w));

    const taskText = `${task.title} ${task.acceptanceCriteria}`.toLowerCase();
    let wordMatches = 0;
    for (const word of frWords) {
      if (taskText.includes(word)) {
        wordMatches++;
      }
    }
    if (frWords.length > 0) {
      const matchRatio = wordMatches / frWords.length;
      if (matchRatio >= 0.5) {
        score += Math.round(matchRatio * 25);
      }
    }

    if (score > 0) {
      related.push(task);
      scored.set(task.id, score);
    }
  }

  // Sort by relevance score descending
  related.sort((a, b) => (scored.get(b.id) ?? 0) - (scored.get(a.id) ?? 0));

  return related;
}

const priorityConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Must: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', label: 'Must' },
  Should: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Should' },
  Could: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Could' },
};

export function PrdMappingView({ functionalRequirements, tasks, onTaskClick }: PrdMappingViewProps) {
  const frTaskMap = useMemo(() => {
    const map = new Map<string, ParsedTask[]>();
    for (const fr of functionalRequirements) {
      map.set(fr.id, findRelatedTasks(fr, tasks));
    }
    return map;
  }, [functionalRequirements, tasks]);

  const totalMappedTasks = useMemo(() => {
    const allTaskIds = new Set<string>();
    for (const [, relatedTasks] of frTaskMap) {
      for (const t of relatedTasks) {
        allTaskIds.add(t.id);
      }
    }
    return allTaskIds.size;
  }, [frTaskMap]);

  if (functionalRequirements.length === 0) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <EmptyFRState />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">PRD to Task Mapping</h2>
            <p className="text-muted-foreground text-sm">
              {functionalRequirements.length} functional requirement{functionalRequirements.length !== 1 ? 's' : ''} mapped to {totalMappedTasks} task{totalMappedTasks !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <GitGraph className="w-3.5 h-3.5" />
            <span>Click a task to focus in DAG</span>
          </div>
        </div>

        {/* FR List */}
        <div className="space-y-4">
          {functionalRequirements.map((fr) => {
            const relatedTasks = frTaskMap.get(fr.id) ?? [];
            const pConfig = priorityConfig[fr.priority] ?? priorityConfig.Should;

            return (
              <div
                key={fr.id}
                className="rounded-xl border bg-card overflow-hidden"
              >
                {/* FR Header */}
                <div className="px-4 py-3 border-b bg-muted/30">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-sm font-semibold text-primary shrink-0 mt-0.5">
                      {fr.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        {fr.requirement}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={cn(
                          'inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium border',
                          pConfig.color,
                          pConfig.bg,
                          pConfig.border
                        )}>
                          {pConfig.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {fr.validation}
                        </span>
                        {relatedTasks.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {relatedTasks.length} task{relatedTasks.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Related Tasks */}
                {relatedTasks.length > 0 ? (
                  <div className="p-3 space-y-2">
                    {relatedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => onTaskClick?.(task.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-xs text-muted-foreground italic">
                    No associated tasks found
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
