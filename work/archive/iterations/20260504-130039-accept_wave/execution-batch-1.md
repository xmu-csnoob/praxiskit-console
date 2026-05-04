# Execution Batch 1

## Source
- Task graph: `work/task-graph.md`
- Task graph fingerprint: 2026-05-02T00:00:00Z
- Generated: 2026-05-02

## Baseline
- Test command: `npx tsc --noEmit` -> pass
- Build command: `npm run build` -> pass (155ms)
- Status: pass
- Baseline repair: false

## Selected Tasks
| ID | Title | Acceptance Criteria | Write Scope | Dependencies | Status At Batch | Parallel Group |
|----|-------|---------------------|-------------|--------------|-----------------|----------------|
| T0.1 | Define ParsedWave type and archive constants | Given multi-wave data model design, When types are defined, Then `ParsedWave` interface exists with `id: string`, `name: string`, `parseResult: ParseResult`, `archivedAt?: string`, and `isActive: boolean` fields, and `WAVE_ARCHIVE_DIR = 'work/archive'` constant is exported | `src/parser/types.ts` | [] | [ ] | — |

## Parallel Groups
- None (single task)

## Sequential Tasks
- T0.1

## Execution Mode
- Mode: orchestrator-single-task
- Dispatch expectation: orchestrator implements directly; no subagents needed for single-task batch

## Validation
- `npx tsc --noEmit`: must pass after changes
- `npm run build`: must pass after changes

## Authorization
- Mode: execute
- Approved by user: yes
- Authorization source: phrase
- Approval timestamp: 2026-05-02
- Upgraded by batch-to-build: no

## Handoff
Next: `batch-to-build`. Execute with a narrow phrase: "execute this batch" or "implement this wave".
