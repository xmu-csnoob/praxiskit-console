# Execution Batch 10

## Source
- Task graph: `work/task-graph.md`
- Task graph fingerprint: `2026-05-03-rev1`
- Generated: 2026-05-03

## Baseline
- Test command: `npx tsc --noEmit` -> pass (no errors)
- Build command: `npm run build` -> pass (139ms, 439KB JS + 50KB CSS)
- Status: pass
- Baseline repair: false

## Selected Tasks
| ID | Title | Acceptance Criteria | Write Scope | Dependencies | Status At Batch | Parallel Group |
|----|-------|---------------------|-------------|--------------|-----------------|----------------|
| T5.1 | Populate and display archivedAt completion date | Given a historical wave in the archive, When the wave is parsed, Then the `archivedAt` field is populated from directory mtime or archive metadata, and displayed in the WaveSelector dropdown for archived waves (e.g. "Wave 1 — completed 2026-05-01") | `src/parser/waveScanner.ts`, `src/parser/types.ts`, `src/components/wave-selector/WaveSelector.tsx` | [T4.3] | [ ] | — |
| T5.2 | Add auto-archive creation on scan | Given a new active wave detected in work/, When the scanner detects the active wave has changed (new task-graph.md with different content or structure), Then the previous wave's data is automatically moved to `work/archive/wave-{n}/` preserving file structure, and the new wave becomes the active wave | `src/parser/waveScanner.ts`, `src/hooks/useFileWatcher.ts`, `src/fs/directoryReader.ts` | [T4.3] | [ ] | — |

## Parallel Groups
- Sequential: [T5.1, T5.2] — both touch `src/parser/waveScanner.ts`; must run sequentially

## Execution Mode
- Mode: orchestrator-single-task
- Dispatch expectation: orchestrator implements both tasks sequentially; no subagents needed

## Authorization
- Mode: execute
- Approved by user: yes
- Authorization source: chat-confirmation
- Approval timestamp: 2026-05-03
- Upgraded by batch-to-build: no

## Handoff
Next: `batch-to-build`. It executes only when `Mode: execute`, or when the user explicitly authorizes upgrading this dry-run batch and freshness checks pass.
