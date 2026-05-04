# SUBAGENT: PraxisKit Multi-Wave Iteration Support

## Project Summary
Add multi-wave iteration support to the PraxisKit Visual Workbench. Users can view, switch between, and browse archived iteration waves within a single project.

## Stack
- React 18 + Vite + TypeScript
- Tailwind CSS v4 + shadcn/ui
- React Flow (@xyflow/react) for DAG
- File System Access API + drag-drop fallback

## Frozen Contracts
Do NOT modify:
- `src/parser/taskGraphParser.ts` — task graph parsing logic
- `src/parser/batchParser.ts` — batch parsing logic
- `src/parser/prdParser.ts` — PRD parsing logic
- `src/layout/topologicalLayout.ts` — DAG layout algorithms
- `src/components/dag/flowConfig.ts` — React Flow config types
- `src/components/ui/button.tsx`, `src/components/ui/EmptyState.tsx`, `src/components/ui/ErrorBoundary.tsx` — base UI primitives

## Task Write Scopes

| Task | Write Scope |
|------|-------------|
| T0.1 | `src/parser/types.ts` |
| T1.1 | `src/parser/waveScanner.ts`, `src/parser/index.ts` |
| T1.2 | `src/parser/waveParser.ts`, `src/parser/projectParser.ts` |
| T1.3 | `src/parser/projectParser.ts`, `src/parser/index.ts` |
| T2.1 | `src/store/projectStore.tsx` |
| T3.1 | `src/components/wave-selector/WaveSelector.tsx`, `src/components/wave-selector/index.ts` |
| T3.2 | `src/components/layout/TopBar.tsx`, `src/components/layout/AppShell.tsx` |
| T3.3 | `src/components/overview/OverviewPanel.tsx` |
| T4.1 | `src/App.tsx`, `src/hooks/useProject.ts` |
| T4.2 | `src/App.tsx`, `src/store/projectStore.tsx` |
| T4.3 | `src/store/projectStore.tsx`, `src/hooks/useFileWatcher.ts` |

## Context Budget

Workers read this file plus their assigned `work/execution-batch-{n}.md` task entry. They should read only source files needed for their write scope and should not load full PRDs, full task graphs, previous build logs, or unrelated source trees unless the task explicitly requires it.

## Subagent Reporting Convention

Report completion as:
```
RESULT: {T_ID} | files: [path1, path2, ...] | summary: what changed | validation: pass/fail + evidence
```

## Write-Scope Boundary

Spawned workers may modify only their assigned task write scope. They must not update PraxisKit bookkeeping files.

The orchestrator, and only the orchestrator, may update:
- `work/task-graph.md`
- `work/execution-batch-*.md`
- `work/build-log-*.md`
- `work/praxiskit-context.md`
- `work/review.md`
- `work/acceptance.md`
