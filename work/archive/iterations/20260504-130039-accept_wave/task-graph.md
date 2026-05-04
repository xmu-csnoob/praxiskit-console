# Task Graph: PraxisKit Multi-Wave Iteration Support

## Waves

### Wave 0: Schema & Contracts

| ID | Title | Status | Acceptance Criteria | Write Scope | Dependencies |
|----|-------|--------|---------------------|-------------|--------------|
| T0.1 | Define ParsedWave type and archive constants | [x] | Given multi-wave data model design, When types are defined, Then `ParsedWave` interface exists with `id: string`, `name: string`, `parseResult: ParseResult`, `archivedAt?: string`, and `isActive: boolean` fields, and `WAVE_ARCHIVE_DIR = 'work/archive'` constant is exported | `src/parser/types.ts` | [] |

### Wave 1: Parser Engine

| ID | Title | Status | Acceptance Criteria | Write Scope | Dependencies |
|----|-------|--------|---------------------|-------------|--------------|
| T1.1 | Implement wave directory scanner | [x] | Given a PraxisKit project directory, When scanner runs, Then it detects `work/archive/wave-{n}/` directories and the current active wave from `work/` root, returning sorted wave descriptors with id, path, and isActive flag | `src/parser/waveScanner.ts`, `src/parser/index.ts` | [T0.1] |
| T1.2 | Extract reusable single-wave parser | [x] | Given existing parseProject logic, When refactored, Then `parseWave(adapter, wavePath)` function parses task-graph, execution-batches, PRD, and idea for a single wave, and existing `parseProject` uses this function for backward compatibility | `src/parser/waveParser.ts`, `src/parser/projectParser.ts` | [T0.1] |
| T1.3 | Implement multi-wave project assembly | [x] | Given wave scanner and single-wave parser, When parseProject runs, Then it returns `ParseResult` with `waves: ParsedWave[]` populated; single-wave projects have 1 wave, multi-wave projects have N waves sorted by wave number | `src/parser/projectParser.ts`, `src/parser/index.ts` | [T1.1, T1.2] |

### Wave 2: Store

| ID | Title | Status | Acceptance Criteria | Write Scope | Dependencies |
|----|-------|--------|---------------------|-------------|--------------|
| T2.1 | Add wave state to project store | [x] | Given the existing project store, When updated, Then it holds `waves: ParsedWave[]`, `currentWaveIndex: number`, and `setCurrentWave(index: number)` action; `parseResult` is derived from current wave for backward compatibility; single-wave projects auto-select wave 0 | `src/store/projectStore.tsx` | [T1.3] |

### Wave 3: UI Components

| ID | Title | Status | Acceptance Criteria | Write Scope | Dependencies |
|----|-------|--------|---------------------|-------------|--------------|
| T3.1 | Create WaveSelector component | [x] | Given wave state from store, When rendered, Then it displays a dropdown with all waves, current wave is highlighted with badge/label, historical waves show completion info, and keyboard navigation (Tab/Enter) works | `src/components/wave-selector/WaveSelector.tsx`, `src/components/wave-selector/index.ts` | [T2.1] |
| T3.2 | Integrate WaveSelector into layout | [x] | Given WaveSelector component, When integrated, Then it appears in TopBar only when project has multiple waves, is hidden for single-wave projects, and AppShell passes wave selection state and handlers | `src/components/layout/TopBar.tsx`, `src/components/layout/AppShell.tsx` | [T3.1] |
| T3.3 | Update view components for wave data | [x] | Given current wave data, When views render, Then OverviewPanel shows wave-specific stats and batch list with wave name, DAG renders wave's task graph, and PRD mapping shows wave's requirements | `src/components/overview/OverviewPanel.tsx` | [T3.2] |

### Wave 4: Integration & Polish

| ID | Title | Status | Acceptance Criteria | Write Scope | Dependencies |
|----|-------|--------|---------------------|-------------|--------------|
| T4.1 | Wire wave switching through App | [x] | Given wave switching UI, When user selects a different wave, Then all views (Overview, DAG, PRD) update to show selected wave's data within 1 second | `src/App.tsx`, `src/hooks/useProject.ts` | [T3.3] |
| T4.2 | Edge case handling and backward compatibility | [x] | Given edge cases, When encountered, Then single-wave projects behave identically to pre-multi-wave version; missing files show empty states; corrupted/missing archive dir shows warning not crash | `src/App.tsx`, `src/store/projectStore.tsx` | [T4.1] |
| T4.3 | Performance optimization and debouncing | [x] | Given performance requirements, When implemented, Then rapid wave switching cancels previous load; 6-wave parse completes in under 3 seconds; auto-refresh detects new waves appearing in archive | `src/store/projectStore.tsx`, `src/hooks/useFileWatcher.ts` | [T4.1] |

### Wave 5: Revision (acceptance follow-ups)

| ID | Title | Status | Acceptance Criteria | Write Scope | Dependencies |
|----|-------|--------|---------------------|-------------|--------------|
| T5.1 | Populate and display archivedAt completion date | [x] | Given a historical wave in the archive, When the wave is parsed, Then the `archivedAt` field is populated from directory mtime or archive metadata, and displayed in the WaveSelector dropdown for archived waves (e.g. "Wave 1 — completed 2026-05-01") | `src/parser/waveScanner.ts`, `src/parser/types.ts`, `src/components/wave-selector/WaveSelector.tsx` | [T4.3] |
| T5.2 | Add auto-archive creation on scan | [x] | Given a new active wave detected in work/, When the scanner detects the active wave has changed (new task-graph.md with different content or structure), Then the previous wave's data is automatically moved to `work/archive/wave-{n}/` preserving file structure, and the new wave becomes the active wave | `src/parser/waveScanner.ts`, `src/hooks/useFileWatcher.ts`, `src/fs/directoryReader.ts` | [T4.3] |

## Parallel Groups

| Wave | Group | Tasks | Rationale |
|------|-------|-------|-----------|
| W1 | A | T1.1, T1.2 | Disjoint files; scanner and parser are independent |

## Critical Path

T0.1 → T1.1/T1.2 (parallel) → T1.3 → T2.1 → T3.1 → T3.2 → T3.3 → T4.1 → T4.2 → T4.3 → T5.1 → T5.2
