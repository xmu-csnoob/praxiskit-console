# Build Log: Batch 8 — 2026-05-02

## Scope
- Tasks: [T4.1]
- Mode: orchestrator-single-task (no subagents)
- Baseline: pass

## Changes Made
- **Modified** `src/hooks/useProject.ts`:
  - Destructured `setCurrentWave` from `useProjectStore()`
  - Exposed `setCurrentWave` in the returned object so `useProject()` is the single interface for all project operations

- **Modified** `src/App.tsx`:
  - Added `useEffect` import from React
  - Added effect that resets `focusedTaskId` to `null` whenever `state.currentWaveIndex` changes
  - Prevents DAG from trying to focus on a task that doesn't exist in the newly selected wave

## Validation
- `npx tsc --noEmit`: pass
- `npm run build`: pass (142ms)

## Review
- Files reviewed: `useProject.ts`, `App.tsx`
- Scope compliance: clean — only touched declared write scopes
- Frozen contracts: none touched
- Wave switching flow: `WaveSelector` → `setCurrentWave` → store updates `parseResult` → `AppContent` re-renders → all views (Overview/DAG/PRD) show new wave's data
- Focus reset: prevents stale task focus across waves

## Acceptance Mapping
- All views update on wave switch: Pass (store derives `parseResult` from selected wave; `useMemo` recomputes nodes/edges; direct props update overview/PRD)
- Update within 1 second: Pass (synchronous in-memory state update, no async loading)

## Follow-Ups
- Batch 9: T4.2 + T4.3 (both depend on T4.1, now unblocked)
  - T4.2: Edge case handling and backward compatibility
  - T4.3: Performance optimization and debouncing
- Parallel group possible: T4.2 and T4.3 have disjoint write scopes (`App.tsx`+`projectStore.tsx` vs `projectStore.tsx`+`useFileWatcher.ts`) — but both touch `projectStore.tsx`, so sequential is safer

## Closeout
- Leftovers: next_batch (T4.2 + T4.3)
- Archived transient notes: none
- Next entry point: `task-graph-to-batch`
- Fresh-session resume: `work/praxiskit-context.md`, `work/task-graph.md`, `work/SUBAGENT.md`
