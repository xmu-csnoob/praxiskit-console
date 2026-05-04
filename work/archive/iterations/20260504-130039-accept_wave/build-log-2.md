# Build Log: Batch 2 — 2026-05-02

## Scope
- Tasks: [T1.1, T1.2]
- Mode: subagent-driven (parallel Group A)
- Baseline: pass

## Assignments
| Task | Agent | Write Scope | Parallel Group | Result |
|------|-------|-------------|----------------|--------|
| T1.1 | subagent | `src/parser/waveScanner.ts`, `src/parser/index.ts` | A | done |
| T1.2 | subagent | `src/parser/waveParser.ts`, `src/parser/projectParser.ts`, `src/parser/index.ts` | A | done |

## Changes Made
- **Created** `src/parser/waveScanner.ts`:
  - `WaveDescriptor` interface: `id`, `name`, `path`, `isActive`
  - `scanWaves(adapter)` detects active wave (`work/task-graph.md` marker) and archived waves (`work/archive/wave-{n}/`)
  - Returns sorted array: active first, then archived by number ascending
  - Graceful handling: missing archive dir → empty archived list
- **Created** `src/parser/waveParser.ts`:
  - `parseWave(adapter, wavePath)` extracts single-wave parsing from old `parseProject`
  - Parses `task-graph.md`, `execution-batch-*.md`, `idea.md`, `PRD.md` scoped to `wavePath`
  - Active wave (`wavePath = ''`) includes all files for backward compatibility
- **Refactored** `src/parser/projectParser.ts`:
  - `parseProject(adapter)` now delegates to `parseWave(adapter, '')`
  - Signature unchanged — backward compatible
- **Updated** `src/parser/index.ts`:
  - Exports `scanWaves`, `parseWave`, `WaveDescriptor`

## Reconcile Notes
- T1.2 subagent introduced a backward-compatibility bug in `isInWave` filter (`!file.path.includes('/')` skipped `work/task-graph.md`)
- **Fixed by orchestrator**: changed to `wavePath === '' ? true : file.path.startsWith(prefix)`
- No other scope violations

## Validation
- `npx tsc --noEmit`: pass
- `npm run build`: pass (138ms)

## Review
- Files reviewed: `waveScanner.ts`, `waveParser.ts`, `projectParser.ts`, `index.ts`
- Scope compliance: 1 minor bug fixed by orchestrator during reconcile
- Frozen contracts: none touched
- Actual parallelism: 2 agents

## Follow-Ups
- Batch 3: T1.3 (depends on T1.1 + T1.2, now unblocked)

## Closeout
- Leftovers: next_batch (T1.3)
- Archived transient notes: none
- Next entry point: `task-graph-to-batch`
- Fresh-session resume: `work/praxiskit-context.md`, `work/task-graph.md`, `work/SUBAGENT.md`
