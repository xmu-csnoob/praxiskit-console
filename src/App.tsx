import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

import { AppShell, type ViewType } from '@/components/layout';
import { DagCanvas } from '@/components/dag/DagCanvas';
import { OverviewPanel } from '@/components/overview';
import { PrdMappingView } from '@/components/prd-mapping';
import { useProject } from '@/hooks/useProject';
import { useFileWatcher } from '@/hooks/useFileWatcher';
import { archiveActiveWave } from '@/parser/waveScanner';
import {
  computeTopologicalLayout,
  computeCriticalPath,
  computeParallelGroups,
  computeLevels,
} from '@/layout/topologicalLayout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

import type { DagNode, DagEdge } from '@/components/dag/flowConfig';
import type { ParsedTask } from '@/parser/types';
import { FolderOpen, AlertCircle, RefreshCw } from 'lucide-react';

function detectCycleEdges(tasks: ParsedTask[]): Set<string> {
  const adj = new Map<string, string[]>();
  for (const t of tasks) {
    adj.set(t.id, t.dependencies);
  }

  const cycleEdges = new Set<string>();
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string, path: string[]): boolean {
    visited.add(node);
    recStack.add(node);

    const deps = adj.get(node) ?? [];
    for (const dep of deps) {
      if (!visited.has(dep)) {
        if (dfs(dep, [...path, node])) {
          return true;
        }
      } else if (recStack.has(dep)) {
        // Found a cycle - mark edges in the cycle
        const cycleStart = path.indexOf(dep);
        if (cycleStart >= 0) {
          for (let i = cycleStart; i < path.length; i++) {
            const src = i === cycleStart ? dep : path[i];
            const tgt = path[i];
            cycleEdges.add(`${src}-${tgt}`);
          }
          cycleEdges.add(`${node}-${dep}`);
        } else {
          cycleEdges.add(`${node}-${dep}`);
        }
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  for (const id of adj.keys()) {
    if (!visited.has(id)) {
      dfs(id, []);
    }
  }

  return cycleEdges;
}

function tasksToFlowData(tasks: ParsedTask[]): {
  nodes: DagNode[];
  edges: DagEdge[];
  criticalPathLength: number;
  parallelGroups: { level: number; nodeIds: string[] }[];
} {
  const cycleEdges = detectCycleEdges(tasks);

  const layoutTasks = tasks.map((t) => ({ id: t.id, dependencies: t.dependencies }));
  const positions = computeTopologicalLayout(layoutTasks, {
    nodeWidth: 260,
    nodeHeight: 104,
    levelGap: 240,
    siblingGap: 64,
  });

  const criticalPath = computeCriticalPath(layoutTasks);
  const parallelGroups = computeParallelGroups(layoutTasks);
  const levels = computeLevels(layoutTasks);

  const nodes: DagNode[] = tasks.map((task) => {
    const pos = positions.get(task.id);
    const isCritical = criticalPath.nodeIds.has(task.id);
    return {
      id: task.id,
      type: 'taskNode',
      position: pos ? { x: pos.x, y: pos.y } : { x: 0, y: 0 },
      data: {
        label: task.title,
        labelCn: task.titleCn,
        labelEn: task.titleEn,
        status: task.status,
        description: task.acceptanceCriteria,
        descriptionCn: task.acceptanceCriteriaCn,
        descriptionEn: task.acceptanceCriteriaEn,
        writeScope: task.writeScope,
        wave: task.wave,
        taskId: task.id,
        isCriticalPath: isCritical,
        parallelLevel: levels.get(task.id) ?? 0,
      },
    };
  });

  const edges: DagEdge[] = [];
  for (const task of tasks) {
    for (const depId of task.dependencies) {
      const edgeId = `${depId}-${task.id}`;
      const isCycle = cycleEdges.has(edgeId);
      const isCritical = criticalPath.edgeIds.has(edgeId);
      edges.push({
        id: edgeId,
        source: depId,
        target: task.id,
        type: 'dependencyEdge',
        data: {
          isCritical: isCritical || false,
          isCycle: isCycle || false,
        },
      });
    }
  }

  return { nodes, edges, criticalPathLength: criticalPath.length, parallelGroups };
}

function createFilesFingerprint(files: Map<string, string>): string {
  const entries = Array.from(files.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let hash = 0;
  for (const [path, content] of entries) {
    const str = `${path}:${content.length}:${content}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
  }
  return String(hash);
}

function splitMarkdownTableRow(line: string): string[] {
  const trimmed = line.trim();
  const withoutLeadingPipe = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const withoutTrailingPipe = withoutLeadingPipe.endsWith('|')
    ? withoutLeadingPipe.slice(0, -1)
    : withoutLeadingPipe;
  return withoutTrailingPipe.split('|').map((p) => p.trim());
}

function createTaskGraphStructureFingerprint(content: string | undefined): string {
  if (!content) return '';

  const structuralLines: string[] = [];
  for (const line of content.split('\n')) {
    const waveMatch = line.match(/^#{2,6}\s*Wave\s*\d+\b/i);
    if (waveMatch) {
      structuralLines.push(line.trim());
      continue;
    }

    if (!line.trim().startsWith('|')) continue;
    const cells = splitMarkdownTableRow(line);
    if (!cells[0]?.match(/^T\d+\.\d+$/)) continue;

    // Ignore status changes so normal task completion updates do not create
    // archive waves. New or reshaped task graphs still produce a new snapshot.
    structuralLines.push([cells[0], cells[1], cells[3], cells[4], cells[5]].join('|'));
  }

  return structuralLines.join('\n');
}

function ProjectLanding({ onLoad, error }: { onLoad: () => void; error?: string | null }) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-6 bg-background">
      <h1 className="text-3xl font-bold">PraxisKit Visual Workbench</h1>
      <p className="text-muted-foreground max-w-md text-center">
        Load a PraxisKit project to visualize task dependencies, critical path, and execution progress.
      </p>
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-lg max-w-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Button onClick={onLoad} size="lg" className="gap-2">
        <FolderOpen className="w-5 h-5" />
        Select Project Folder
      </Button>
    </div>
  );
}

function AppContent() {
  const { state, loadProject, reloadProject, clearError } = useProject();
  const [currentView, setCurrentView] = useState<ViewType>('dag');
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const workFilesRef = useRef<Map<string, string> | null>(null);
  const workSnapshotFingerprintRef = useRef<string | null>(null);
  const lastArchivedFingerprintRef = useRef<string | null>(null);

  const handleLoadProject = useCallback(async () => {
    await loadProject();
  }, [loadProject]);

  // Snapshot the active iteration after each successful load for potential auto-archive.
  useEffect(() => {
    async function snapshot() {
      if (!state.adapter || state.isLoading || !state.parseResult) return;
      try {
        const entries = await state.adapter.readDirectoryRecursively('work');
        const files = new Map<string, string>();
        for (const entry of entries) {
          if (entry.kind !== 'file') continue;
          if (entry.path.startsWith('work/archive/')) continue;
          try {
            const content = await state.adapter.readFile(entry.path);
            files.set(entry.path, content);
          } catch {
            // skip
          }
        }
        try {
          files.set('seed.md', await state.adapter.readFile('seed.md'));
        } catch {
          // seed.md is optional
        }
        workFilesRef.current = files;
        workSnapshotFingerprintRef.current = createFilesFingerprint(files);
      } catch {
        // ignore snapshot failures
      }
    }
    snapshot();
  }, [state.adapter, state.parseResult, state.isLoading, state.currentWaveIndex]);

  const handleFileChange = useCallback(
    async (_changedFiles: string[], _previousFiles: Map<string, string>) => {
      // Auto-archive previous iteration data before reloading, but only if we have
      // a snapshot and the active iteration appears to have changed significantly.
      if (state.adapter && workFilesRef.current) {
        const currentWave = state.waves[state.currentWaveIndex];
        if (currentWave?.isActive) {
          const previousTaskGraph = _previousFiles.get('work/task-graph.md');
          const previousSeed = _previousFiles.get('seed.md');
          let currentTaskGraph: string | undefined;
          let currentSeed: string | undefined;
          try {
            currentTaskGraph = await state.adapter.readFile('work/task-graph.md');
          } catch {
            currentTaskGraph = undefined;
          }
          try {
            currentSeed = await state.adapter.readFile('seed.md');
          } catch {
            currentSeed = undefined;
          }

          const shouldArchive =
            previousSeed !== currentSeed ||
            createTaskGraphStructureFingerprint(previousTaskGraph) !==
            createTaskGraphStructureFingerprint(currentTaskGraph);
          const fingerprint = workSnapshotFingerprintRef.current ?? createFilesFingerprint(workFilesRef.current);

          if (shouldArchive && fingerprint !== lastArchivedFingerprintRef.current) {
            try {
              await archiveActiveWave(state.adapter, workFilesRef.current);
              lastArchivedFingerprintRef.current = fingerprint;
            } catch {
              // Archive failure is non-fatal; proceed with reload
            }
          }
        }
      }
      await reloadProject();
    },
    [reloadProject, state.adapter, state.waves, state.currentWaveIndex]
  );

  useFileWatcher(state.adapter, handleFileChange, 5000);

  const { nodes, edges } = useMemo(() => {
    if (!state.parseResult) return { nodes: [], edges: [] };
    return tasksToFlowData(state.parseResult.tasks);
  }, [state.parseResult]);

  const handleTaskClick = useCallback((taskId: string) => {
    setFocusedTaskId(taskId);
    setCurrentView('dag');
  }, []);

  if (!state.parseResult) {
    return <ProjectLanding onLoad={handleLoadProject} error={state.error} />;
  }

  const projectName = state.parseResult.meta.name || 'Untitled Project';
  const tasks = state.parseResult.tasks;
  const batches = state.parseResult.batches;
  const functionalRequirements = state.parseResult.functionalRequirements;
  const hasTaskGraph = tasks.length > 0;
  const visibleFocusedTaskId = focusedTaskId && tasks.some((task) => task.id === focusedTaskId)
    ? focusedTaskId
    : null;

  let content: React.ReactNode;

  switch (currentView) {
    case 'dag':
      content = hasTaskGraph ? (
        <DagCanvas
          initialNodes={nodes}
          initialEdges={edges}
          focusedNodeId={visibleFocusedTaskId ?? undefined}
          onNodeClick={() => setFocusedTaskId(null)}
        />
      ) : (
        <EmptyState
          title="No tasks found"
          description="The project doesn't contain a task-graph.md file with task definitions."
          action={{
            label: 'Select another project',
            onClick: handleLoadProject,
          }}
        />
      );
      break;
    case 'overview':
      content = <OverviewPanel tasks={tasks} batches={batches} />;
      break;
    case 'prd':
      content = (
        <PrdMappingView
          functionalRequirements={functionalRequirements}
          tasks={tasks}
          onTaskClick={handleTaskClick}
        />
      );
      break;
    default:
      content = <DagCanvas initialNodes={nodes} initialEdges={edges} />;
  }

  return (
    <AppShell
      projectName={projectName}
      currentView={currentView}
      onViewChange={setCurrentView}
      onSelectProject={handleLoadProject}
    >
      {state.error && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-destructive/10 text-destructive px-4 py-2 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate">{state.error}</span>
          <button
            onClick={clearError}
            className="text-xs underline hover:no-underline shrink-0"
          >
            Dismiss
          </button>
          {state.adapter && (
            <button
              onClick={() => reloadProject()}
              className="flex items-center gap-1 text-xs underline hover:no-underline shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      )}
      <ErrorBoundary>
        <div className="relative h-full">
          {content}
          {state.isLoading && (
            <div className="absolute inset-0 z-40 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground bg-background border shadow-sm px-4 py-2 rounded-lg">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Refreshing...</span>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </AppShell>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
