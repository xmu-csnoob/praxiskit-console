# Build Log: Batch 2 — 2026-05-02

## Scope
- Tasks: T0.2, T1.2, T2.1
- Mode: parallel
- Baseline: pass

## Assignments
| Task | Agent | Write Scope | Parallel Group | Result |
|------|-------|-------------|----------------|--------|
| T0.2 | orchestrator | `src/types/praxiskit.ts` | A | done |
| T1.2 | orchestrator | `src/fs/fileAccess.ts`, `src/fs/directoryReader.ts` | A | done |
| T2.1 | orchestrator | `src/components/dag/DagCanvas.tsx`, `src/components/dag/flowConfig.ts` | A | done |

## Validation
- `npx tsc -b`: pass
- `npm run build`: pass

## Review
- Files reviewed: `src/types/praxiskit.ts`, `src/fs/directoryReader.ts`, `src/fs/fileAccess.ts`, `src/components/dag/flowConfig.ts`, `src/components/dag/DagCanvas.tsx`
- Scope compliance: all changes within assigned write scopes
- Actual parallelism used: 1 (orchestrator, sequential editing)

## Changes Summary
- **T0.2**: Defined `TaskStatus`, `TaskPriority`, `Dependency`, `PraxisTask`, `ExecutionBatchTask`, `ExecutionBatch`, `ProjectFile`, `PraxisProject`, `ParsedTaskGraph`, `ParsedProject`, `ParseError`, `FileNode` types in `src/types/praxiskit.ts`
- **T1.2**: Implemented `FileSystemAdapter` interface, `FileSystemAccessAdapter` (using File System Access API), `DragDropAdapter` (fallback), `openDirectoryPicker()`, `createFileSystemAdapter()`, `createDragDropAdapter()` in `src/fs/fileAccess.ts`; updated `DirectoryEntry` to use `kind: 'file' | 'directory'` in `src/fs/directoryReader.ts`
- **T2.1**: Created `DagCanvas.tsx` with React Flow canvas (zoom, pan, fitView, Background, Controls, MiniMap) and `flowConfig.ts` with `DagNodeData`, `DagNode`, `DagEdge`, `defaultFlowProps`, `nodeColors`, `statusLabels`

## Issues Resolved During Build
1. TS1294 (`erasableSyntaxOnly`): Parameter properties in `FileSystemAccessAdapter` constructor — fixed by converting to regular private properties
2. TS2339 (`showDirectoryPicker` not on Window): Added `declare global` augmentation in `fileAccess.ts`
3. TS2305 (`FileSystemAdapter` not exported): Added interface to `directoryReader.ts` and re-exported
4. TS2353/TS2339 (`kind` vs `isDirectory`): Changed `DirectoryEntry.kind` from `isDirectory: boolean` to `kind: 'file' | 'directory'` to align with File System Access API
5. TS2344 (`DagNodeData` index signature): Added `[key: string]: unknown` to `DagNodeData` to satisfy React Flow's `Node<T>` constraint
6. TS6133/TS2322 (`DagCanvas.tsx` types): Removed unused `Edge` import, prefixed unused `setNodes` with `_`, updated `useNodesState<Node>`, fixed `onNodeClick` handler type

## Follow-Ups
- Next batch: T1.1 (file parser), T2.2 (task node components), T3.1 (main layout) — all now unblocked with disjoint write scopes
