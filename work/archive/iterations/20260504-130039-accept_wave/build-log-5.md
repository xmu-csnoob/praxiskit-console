# Build Log: Batch 5 — 2026-05-02

## Scope
- Tasks: [T3.1]
- Mode: orchestrator-single-task (no subagents)
- Baseline: pass

## Changes Made
- **Created** `src/components/wave-selector/WaveSelector.tsx`:
  - Custom accessible dropdown with `role="listbox"`, `aria-expanded`, `aria-selected`
  - Trigger button shows current wave name with icon (Zap for active, Archive for historical)
  - Dropdown lists all waves with: name, completion count (`completed/total`), active badge, selection checkmark
  - Keyboard navigation: ArrowDown/ArrowUp to highlight, Enter/Space to select, Escape to close, Tab to close + move focus
  - Click outside to close
  - Auto-scrolls highlighted item into view
  - Returns `null` when `waves.length === 0` (no project loaded)
- **Created** `src/components/wave-selector/index.ts`:
  - Barrel export for `WaveSelector`

## Validation
- `npx tsc --noEmit`: pass
- `npm run build`: pass (141ms)

## Review
- Files reviewed: `WaveSelector.tsx`, `index.ts`
- Scope compliance: clean — only touched declared write scope
- Frozen contracts: none touched
- Accessibility: proper ARIA roles and keyboard handling

## Follow-Ups
- Batch 6: T3.2 (Integrate WaveSelector into layout) — depends on T3.1, now unblocked

## Closeout
- Leftovers: next_batch (T3.2)
- Archived transient notes: none
- Next entry point: `task-graph-to-batch`
- Fresh-session resume: `work/praxiskit-context.md`, `work/task-graph.md`, `work/SUBAGENT.md`
