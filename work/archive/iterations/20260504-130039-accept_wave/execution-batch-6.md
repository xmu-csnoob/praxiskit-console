# Execution Batch 6

## Source
- Task graph: `work/task-graph.md`
- Task graph fingerprint: 2026-05-02T00:00:00Z
- Generated: 2026-05-02

## Baseline
- Test command: `npx tsc --noEmit` -> pass
- Build command: `npm run build` -> pass (141ms)
- Status: pass
- Baseline repair: false

## Selected Tasks
| ID | Title | Acceptance Criteria | Write Scope | Dependencies | Status At Batch | Parallel Group |
|----|-------|---------------------|-------------|--------------|-----------------|----------------|
| T3.2 | Integrate WaveSelector into layout | Given WaveSelector component, When integrated, Then it appears in TopBar only when project has multiple waves, is hidden for single-wave projects, and AppShell passes wave selection state and handlers | `src/components/layout/TopBar.tsx`, `src/components/layout/AppShell.tsx` | [T3.1] | [ ] | — |

## Parallel Groups
- None (single task)

## Sequential Tasks
- T3.2

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
- T3.2 requires reading existing `TopBar.tsx` and `AppShell.tsx` to understand current prop contracts before extending them.
- WaveSelector is imported from `@/components/wave-selector`.

## Handoff
Next: `batch-to-build`. It executes only when `Mode: execute`, or when the user explicitly authorizes upgrading this dry-run batch and freshness checks pass.
