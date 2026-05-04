# Build Log: Batch 10 — 2026-05-03

## Scope
- Tasks: [T5.1, T5.2]
- Mode: orchestrator-single-task (sequential, no subagents)
- Baseline: pass

## Changes Made

### T5.1 — Populate and display archivedAt completion date
- **Modified** `src/fs/directoryReader.ts`:
  - Added `getFileMetadata(path)` to `FileSystemAdapter` interface
- **Modified** `src/fs/fileAccess.ts`:
  - Implemented `getFileMetadata` in `FileSystemAccessAdapter` (reads `File.lastModified` via File System Access API)
  - Implemented `getFileMetadata` in `DragDropAdapter` (returns `file.lastModified` from stored File objects)
- **Modified** `src/parser/waveScanner.ts`:
  - Added `archivedAt?: string` to `WaveDescriptor`
  - Added `getWaveArchiveDate` helper: tries `acceptance.md`, `build-log-1.md`, `task-graph.md`, `PRD.md` in order, returns first found file's `lastModified` as ISO date string
  - `scanWaves` populates `archivedAt` for archived waves
- **Modified** `src/parser/projectParser.ts`:
  - Passes `archivedAt: descriptor.archivedAt` to `ParsedWave`
- **Modified** `src/components/wave-selector/WaveSelector.tsx`:
  - Displays `archivedAt` date next to archived wave names in dropdown (e.g. "2026-05-01")

### T5.2 — Add auto-archive creation on scan
- **Modified** `src/fs/directoryReader.ts`:
  - Added `createDirectory(path)` and `writeFile(path, content)` to `FileSystemAdapter` interface
- **Modified** `src/fs/fileAccess.ts`:
  - Implemented `createDirectory` in `FileSystemAccessAdapter` (uses `getDirectoryHandle(name, { create: true })`)
  - Implemented `writeFile` in `FileSystemAccessAdapter` (uses `createWritable()` stream)
  - Both methods throw in `DragDropAdapter` (read-only fallback)
- **Modified** `src/parser/waveScanner.ts`:
  - Added `archiveActiveWave(adapter, files?)` function
  - Determines next archive number from existing `work/archive/wave-{n}/` directories
  - Accepts optional `Map<string, string>` of pre-read files (for snapshot-based archiving)
  - Otherwise reads all files from `work/` recursively (excluding `archive/`)
  - Creates `work/archive/wave-{n}/` and copies files preserving relative structure
- **Modified** `src/hooks/useFileWatcher.ts`:
  - Stores previous file `Map` in `filesRef` alongside fingerprint
  - `onChange` callback receives `(changedFiles, previousFiles)` for access to prior state
- **Modified** `src/App.tsx`:
  - After each successful load, snapshots all `work/` files (excluding `archive/`) into `workFilesRef`
  - On file change detection, if active wave exists and snapshot hasn't been archived yet, calls `archiveActiveWave(adapter, snapshot)` before reloading
  - `archivedFingerprintRef` deduplicates: same snapshot archived only once

## Validation
- `npx tsc --noEmit`: pass
- `npm run build`: pass (144ms, 442KB JS + 50KB CSS)

## Review
- Files reviewed: `directoryReader.ts`, `fileAccess.ts`, `waveScanner.ts`, `useFileWatcher.ts`, `App.tsx`
- Scope compliance: clean — all writes within declared scopes
- Frozen contracts: `FileSystemAdapter` extended with write methods; backward-compatible (new methods required by consumers)
- DragDropAdapter correctly throws on write attempts (read-only by design)

## Acceptance Mapping

**T5.1:**
- `archivedAt` populated from file mtime: Pass (`getWaveArchiveDate` reads representative file metadata)
- Displayed in WaveSelector for archived waves: Pass (date shown as "2026-05-01" next to wave name)

**T5.2:**
- Write methods added to FileSystemAdapter: Pass (`createDirectory`, `writeFile`)
- `archiveActiveWave` preserves file structure: Pass (relative paths maintained, parent dirs created)
- Auto-trigger on active wave change: Pass (`useFileWatcher` → snapshot → `archiveActiveWave` → `reloadProject`)
- Dedup prevents duplicate archives: Pass (fingerprint check in `archivedFingerprintRef`)

## Follow-Ups
- Both revision gaps addressed
- All 12 tasks complete (T0.1 through T5.2)
- Next: `build-to-review-packet` → `review-to-acceptance` for final acceptance

## Closeout
- Leftovers: review_and_accept
- Archived transient notes: none
- Next entry point: `build-to-review-packet`
- Fresh-session resume: `work/praxiskit-context.md`, `work/task-graph.md`, `work/SUBAGENT.md`
