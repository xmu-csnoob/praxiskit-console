# Execution Batch 2

## Source
- Task graph: `work/task-graph.md`
- Task graph fingerprint: 2026-05-02T00:00:00Z
- Generated: 2026-05-02

## Baseline
- Test command: `npx tsc --noEmit` -> pass
- Build command: `npm run build` -> pass (151ms)
- Status: pass
- Baseline repair: false

## Selected Tasks
| ID | Title | Acceptance Criteria | Write Scope | Dependencies | Status At Batch | Parallel Group |
|----|-------|---------------------|-------------|--------------|-----------------|----------------|
| T1.1 | Implement wave directory scanner | Given a PraxisKit project directory, When scanner runs, Then it detects `work/archive/wave-{n}/` directories and the current active wave from `work/` root, returning sorted wave descriptors with id, path, and isActive flag | `src/parser/waveScanner.ts`, `src/parser/index.ts` | [T0.1] | [ ] | A |
| T1.2 | Extract reusable single-wave parser | Given existing parseProject logic, When refactored, Then `parseWave(adapter, wavePath)` function parses task-graph, execution-batches, PRD, and idea for a single wave, and existing `parseProject` uses this function for backward compatibility | `src/parser/waveParser.ts`, `src/parser/projectParser.ts` | [T0.1] | [ ] | A |

## Parallel Groups
- Group A: [T1.1, T1.2] — disjoint write scopes (waveScanner.ts+index.ts vs waveParser.ts+projectParser.ts)

## Sequential Tasks
- None (both tasks are in the parallel group)

## Execution Mode
- Mode: subagent-driven
- Dispatch expectation: one subagent per task in Group A; orchestrator owns bookkeeping only

## Authorization
- Mode: execute
- Approved by user: yes
- Authorization source: auto-mode
- Approval timestamp: 2026-05-02
- Upgraded by batch-to-build: no

## Handoff
Next: `batch-to-build`. Execute with a narrow phrase: "execute this batch" or "implement this wave".
