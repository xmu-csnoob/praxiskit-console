# Execution Batch 4

## Source
- Task graph: `work/task-graph.md`
- Task graph fingerprint: 2026-05-02T00:00:00Z
- Generated: 2026-05-02

## Baseline
- Test command: `npx tsc --noEmit` -> pass
- Build command: `npm run build` -> pass (146ms)
- Status: pass
- Baseline repair: false

## Selected Tasks
| ID | Title | Acceptance Criteria | Write Scope | Dependencies | Status At Batch | Parallel Group |
|----|-------|---------------------|-------------|--------------|-----------------|----------------|
| T2.1 | Add wave state to project store | Given the existing project store, When updated, Then it holds `waves: ParsedWave[]`, `currentWaveIndex: number`, and `setCurrentWave(index: number)` action; `parseResult` is derived from current wave for backward compatibility; single-wave projects auto-select wave 0 | `src/store/projectStore.tsx` | [T1.3] | [ ] | — |

## Parallel Groups
- None (single task)

## Sequential Tasks
- T2.1

## Execution Mode
- Mode: orchestrator-single-task
- Dispatch expectation: orchestrator implements directly; no subagents needed

## Authorization
- Mode: execute
- Approved by user: yes
- Authorization source: decision-ui
- Approval timestamp: 2026-05-02
- Upgraded by batch-to-build: no

## Notes
- T2.1 requires reading the existing `src/store/projectStore.tsx` to understand current store shape before extending it with wave state.

## Handoff
Next: `batch-to-build`. It executes only when `Mode: execute`, or when the user explicitly authorizes upgrading this dry-run batch and freshness checks pass.
