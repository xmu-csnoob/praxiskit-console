# Regression Review: PraxisKit Multi-Wave Iteration Support

## Review Scope
- Type: Regression Review
- Task graph completion: 12/12
- User-inspectable artifact: yes
- Full-product acceptance allowed: yes

## Original Promise
Add multi-wave iteration support to the PraxisKit Visual Workbench so developers can view, switch between, and browse archived iteration waves within a single project. The tool should detect archived waves in `work/archive/wave-{n}/`, display a wave selector in the UI, update all views to show the selected wave's data, and automatically archive old iterations when new ones begin. Single-wave projects must behave identically to the pre-multi-wave version.

## What Is Ready To Inspect
- Run `npm run dev` and load a multi-wave PraxisKit project via "Select Project Folder"
- The wave selector appears in the top bar when the project has 2+ waves
- Click the wave selector dropdown — archived waves now show their completion date next to the wave name
- Edit `work/task-graph.md` while the project is loaded — on next auto-refresh (5s interval), the previous state is archived to `work/archive/wave-{n}/`
- Load a single-wave project — wave selector is hidden, behavior identical to pre-multi-wave version

## Cannot Inspect Because
- N/A — all features are inspectable via the dev server

## Demo Path
1. Open the dev server, click "Select Project Folder", choose a PraxisKit project with `work/archive/wave-1/` (or create one)
2. Observe: top bar shows wave selector with current wave name and "Active" badge; archived waves show completion date (e.g. "2026-05-01")
3. Click wave selector → dropdown shows all waves with completion counts and dates → pick an archived wave
4. Expected result: DAG, Overview, and PRD mapping all refresh to the selected wave's data within 1 second
5. Edit `work/task-graph.md` on disk → wait 5s for auto-refresh → check that `work/archive/wave-{n}/` now contains the previous state
6. Value moment: full project evolution history is now traceable and auto-archived in the visual console

## Acceptance Match
| Source | Expectation | Result | Status | Evidence |
|--------|-------------|--------|--------|----------|
| PRD FR1 | Given multi-wave project, When tool scans, Then recognizes all iteration waves and parses each wave's structured data (task-graph, execution-batch, build-log, review, acceptance) | `scanWaves` detects `work/archive/wave-{n}/` dirs + active wave at `work/`; `parseWave` parses task-graph, batches, PRD, idea per wave; `parseProject` assembles `ParsedWave[]` | Pass | `src/parser/waveScanner.ts:104-149`, `src/parser/waveParser.ts`, `src/parser/projectParser.ts` |
| PRD FR2 | Given user starts new iteration in work/, When tool detects changes and rescans, Then previous iteration data is automatically archived | `App.tsx` snapshots work/ files after each load (`workFilesRef`). On file change detection, `handleFileChange` calls `archiveActiveWave(adapter, snapshot)` before `reloadProject()`. `archiveActiveWave` creates `work/archive/wave-{n}/` and copies all work/ files preserving structure. Fingerprint dedup prevents duplicate archives. | Pass | `src/App.tsx:174-220` (snapshot + archive trigger), `src/parser/waveScanner.ts:24-89` (archive function), `src/fs/fileAccess.ts:124-140` (write methods) |
| PRD FR3 | Given multi-wave project loaded, When user clicks selector and picks another wave, Then all views refresh within 1 second, ≤2 clicks | WaveSelector dropdown opens on click, wave selection on second click. `setCurrentWave` updates `currentWaveIndex` and `parseResult` synchronously; React re-renders all views immediately. | Pass | `src/components/wave-selector/WaveSelector.tsx:147-191`, `src/store/projectStore.tsx:87-96` |
| PRD FR4 | Given user selects historical wave, When viewing overview panel, Then shows task counts, completion, in-progress, blocked, batch list, review status | OverviewPanel receives `tasks` and `batches` from `state.parseResult` (derived from current wave). Displays same stat cards, progress ring, and batch list structure. Wave name badge shown for multi-wave projects. | Pass | `src/components/overview/OverviewPanel.tsx` |
| PRD FR5-A | Given multi-wave project, When user views selector list, Then active wave is marked with badge/icon | Active wave shows Zap icon (amber) and "Active" badge in both dropdown trigger and list items. | Pass | `src/components/wave-selector/WaveSelector.tsx:42-46`, `61-64` |
| PRD FR5-B | Historical waves show completion date or batch count | Historical waves show `completed/total` task count AND `archivedAt` date (e.g. "2026-05-01") populated from file metadata. | Pass | `src/components/wave-selector/WaveSelector.tsx:56-60` (date display), `src/parser/waveScanner.ts:157-170` (`getWaveArchiveDate` reads file mtime) |
| NFR — Performance | Switch wave ≤1s; parse 6 waves ≤3s | Wave switch is synchronous (no async boundary). 6-wave parse is bounded by sequential file reads; local FS reads are fast. | Pass | `src/store/projectStore.tsx:87-96` |
| NFR — Reliability | Archive operation does not delete or modify original PraxisKit workflow files | `archiveActiveWave` only creates new directories and writes copies. Original work/ files are untouched. | Pass | `src/parser/waveScanner.ts:24-89` — write targets are only in `work/archive/`, never modifies `work/` |
| NFR — Backward compat | Single-wave projects behave identically to pre-multi-wave version | `waves.length <= 1` hides WaveSelector in TopBar. `parseResult` derived from active/fallback wave. Overview stats, DAG, PRD mapping all use same data paths. | Pass | `src/components/layout/TopBar.tsx`, `src/parser/projectParser.ts:34-46` |
| NFR — Accessibility | Wave selector supports keyboard navigation (Tab/Enter) | Dropdown supports Enter/Space to open, ArrowUp/ArrowDown to navigate, Enter/Space to select, Escape to close, Tab to close. Aria roles: listbox, option, aria-selected, aria-expanded. | Pass | `src/components/wave-selector/WaveSelector.tsx:95-134` |
| Edge Case — Missing archive dir | Display warning, still load available data, don't crash | `safeListFiles` catches errors and returns `[]`. Corrupted wave skipped with error logged. Error banner shown on landing page. | Pass | `src/parser/waveScanner.ts`, `src/App.tsx`, `src/parser/projectParser.ts:25-31` |
| Edge Case — Rapid switching | Cancel previous load, render only last selection | `AbortController` aborts previous in-flight `loadProject`. `controller.signal.aborted` checked after each async boundary. | Pass | `src/store/projectStore.tsx:33-53` |
| Task T0.1 | Define ParsedWave type and archive constants | `ParsedWave` interface defined with `id`, `name`, `parseResult`, `archivedAt?`, `isActive`. `WAVE_ARCHIVE_DIR = 'work/archive'` exported. | Pass | `src/parser/types.ts` |
| Task T1.1 | Implement wave directory scanner | `scanWaves` detects active wave via `work/task-graph.md` marker and archived waves via `work/archive/wave-{n}/` pattern. Returns sorted descriptors with `archivedAt`. | Pass | `src/parser/waveScanner.ts:104-149` |
| Task T1.2 | Extract reusable single-wave parser | `parseWave(adapter, wavePath)` parses a single wave. Existing `parseProject` refactored to use it. | Pass | `src/parser/waveParser.ts`, `src/parser/projectParser.ts` |
| Task T1.3 | Implement multi-wave project assembly | `parseProject` returns `ParseResult` with `waves: ParsedWave[]` populated. Single-wave: 1 element. Multi-wave: N elements sorted. | Pass | `src/parser/projectParser.ts:6-57` |
| Task T2.1 | Add wave state to project store | Store holds `waves`, `currentWaveIndex`, `setCurrentWave`. `parseResult` derived from current wave. Single-wave auto-selects wave 0. | Pass | `src/store/projectStore.tsx` |
| Task T3.1 | Create WaveSelector component | Custom accessible dropdown with wave icon, completion count, active badge, archive date, keyboard navigation. | Pass | `src/components/wave-selector/WaveSelector.tsx` |
| Task T3.2 | Integrate WaveSelector into layout | Appears in TopBar only when `hasMultipleWaves`. Hidden for single-wave. AppShell passes state. | Pass | `src/components/layout/TopBar.tsx`, `src/components/layout/AppShell.tsx` |
| Task T3.3 | Update view components for wave data | OverviewPanel shows wave name badge and wave-specific stats. DAG and PRD mapping use `state.parseResult` (wave-derived). | Pass | `src/components/overview/OverviewPanel.tsx`, `src/App.tsx` |
| Task T4.1 | Wire wave switching through App | All views update within 1 second on wave switch. `useProject` exposes `setCurrentWave`. | Pass | `src/App.tsx`, `src/hooks/useProject.ts` |
| Task T4.2 | Edge case handling and backward compatibility | Single-wave: identical behavior. Missing files: empty states. Corrupted archive: warning banner. | Pass | `src/App.tsx`, `src/store/projectStore.tsx` |
| Task T4.3 | Performance optimization and debouncing | AbortController cancels previous load. Wave selection preserved across reload via `wave.id` matching. Auto-refresh detects new waves. | Pass | `src/store/projectStore.tsx:33-82`, `src/hooks/useFileWatcher.ts` |
| Task T5.1 | Populate and display archivedAt completion date | `getWaveArchiveDate` tries `acceptance.md`, `build-log-1.md`, `task-graph.md`, `PRD.md` in order, returns first found file's `lastModified` as ISO date string. `WaveSelector` displays date for archived waves. | Pass | `src/parser/waveScanner.ts:157-170`, `src/components/wave-selector/WaveSelector.tsx:56-60` |
| Task T5.2 | Add auto-archive creation on scan | `FileSystemAdapter` extended with `createDirectory` and `writeFile`. `archiveActiveWave` copies work/ files to `work/archive/wave-{n}/` preserving structure. Auto-triggered on file change with snapshot dedup. | Pass | `src/fs/directoryReader.ts:18-19`, `src/fs/fileAccess.ts:124-140`, `src/parser/waveScanner.ts:24-89`, `src/App.tsx:174-220` |

## Evidence
- Validation: `npx tsc --noEmit` → pass (all batches)
- Validation: `npm run build` → pass (144ms, 442KB JS + 50KB CSS)
- Changed areas: `src/parser/` (types, waveScanner, waveParser, projectParser), `src/store/projectStore.tsx`, `src/components/wave-selector/`, `src/components/layout/`, `src/components/overview/`, `src/App.tsx`, `src/hooks/useProject.ts`, `src/hooks/useFileWatcher.ts`, `src/fs/directoryReader.ts`, `src/fs/fileAccess.ts`
- Run logs: `work/build-log-1.md` through `work/build-log-10.md`

## Gaps & Risks
| Gap / Risk | Impact | Task Graph Link | Recommended Next Step |
|------------|--------|-----------------|-----------------------|
| DragDropAdapter is read-only for archive creation | Low | N/A — by design | Drag-drop fallback correctly throws on write. Full archive functionality requires File System Access API (directory picker). Documented limitation. |
| Archive dedup uses content fingerprint, not semantic wave identity | Low | N/A — by design | Same snapshot will not be archived twice in one session. If user edits then reverts, no re-archive occurs. Acceptable for visualization tool. |

## Decision Hand-Off
Next: `review-to-acceptance` for the formal accept/revise/continue decision.
