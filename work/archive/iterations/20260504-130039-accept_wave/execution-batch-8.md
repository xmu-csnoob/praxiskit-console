# Execution Batch 8

## Metadata
- **Generated**: 2026-05-02
- **Task graph**: work/task-graph.md
- **Authorization**: execute
- **Approved by user**: yes (auto mode — user has authorized all prior batches)
- **Authorization source**: auto-mode-continuation
- **Baseline status**: pass (`npx tsc --noEmit`)

## Selected Tasks

| ID | Title | Status at Selection | Dependencies | Write Scope |
|----|-------|---------------------|--------------|-------------|
| T4.1 | Wire wave switching through App | [ ] | T3.3 [x] | `src/App.tsx`, `src/hooks/useProject.ts` |

## Execution Order

### Sequential (1 task)
- **T4.1** — Orchestrator implements directly

## Acceptance Criteria (from task-graph.md)

**T4.1**: Given wave switching UI, When user selects a different wave, Then all views (Overview, DAG, PRD) update to show selected wave's data within 1 second

## Validation Commands
- `npx tsc --noEmit`
- `npm run build`

## Execution Mode
orchestrator-single-task

## Parallel Groups
None (single task)
