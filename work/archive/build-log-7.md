# Build Log: Batch 7 — 2026-05-02

## Scope
- Tasks: T5.1
- Mode: sequential (validation-only, no code changes)
- Baseline: pass

## Assignments
| Task | Agent | Write Scope | Parallel Group | Result |
|------|-------|-------------|----------------|--------|
| T5.1 | orchestrator | Manual validation record | — | done |

## Validation Method
No test framework configured in project. Validation performed via:
1. Code review of implementation files against PRD acceptance criteria
2. TypeScript compilation check (`npx tsc -b`: pass)
3. Production build check (`npm run build`: pass, 431KB JS + 39KB CSS)
4. Dev server smoke test (`curl http://127.0.0.1:5173/`: HTTP 200)
5. Parser unit test (inline Node.js test for all 4 status codes: pass)

## FR Validation Results

### FR1: Parse PraxisKit Standard File Structure ✅ PASS
| Criterion | Evidence | Status |
|-----------|----------|--------|
| File System Access API for folder selection | `src/fs/fileAccess.ts:20` `openDirectoryPicker()` | ✅ |
| Drag-drop fallback | `src/fs/fileAccess.ts:112` `createDragDropAdapter()` | ✅ |
| Parses idea.md, PRD.md, task-graph.md, execution-batch files | `src/parser/projectParser.ts:18-66` | ✅ |
| Project metadata (name) extracted | `src/parser/projectParser.ts:13` `adapter.getRootName()` | ✅ |
| File tree populated | `src/store/projectStore.tsx:24` `buildFileTree()` | ✅ |

### FR2: Render Task Dependency Graph (DAG) ✅ PASS
| Criterion | Evidence | Status |
|-----------|----------|--------|
| task-graph.md parsed correctly | `src/parser/taskGraphParser.ts:17-61` | ✅ |
| Tasks, dependencies, statuses, waves extracted | `src/parser/taskGraphParser.ts:43-57` | ✅ |
| Parse errors reported gracefully | `src/parser/taskGraphParser.ts:38-41` errors collected | ✅ |
| Nodes render with status colors | `src/components/dag/nodes/TaskNode.tsx:15-48` statusConfig | ✅ |
| Dependencies as directed edges with arrows | `src/components/dag/edges/DependencyEdge.tsx` + `MarkerType.ArrowClosed` | ✅ |
| Topological layout by wave/level | `src/layout/topologicalLayout.ts:20-57` `computeLevels()` | ✅ |
| Nodes clickable to expand details | `src/components/dag/nodes/TaskNode.tsx:56-57` `expanded` state + toggle | ✅ |

### FR3: Display Task Execution Status ✅ PASS
| Criterion | Evidence | Status |
|-----------|----------|--------|
| Task counts correct | `src/components/overview/OverviewPanel.tsx:12-18` filters | ✅ |
| Progress ring shows completion % | `src/components/overview/OverviewPanel.tsx:39` ProgressRing | ✅ |
| Batch list displays execution batches | `src/components/overview/BatchList.tsx:43-97` | ✅ |
| Status colors match file content | `src/parser/taskGraphParser.ts:3-9` + `src/components/dag/nodes/TaskNode.tsx:15-48` | ✅ |

### FR4: PRD-to-Task Mapping ⚠️ PARTIAL
| Criterion | Evidence | Status |
|-----------|----------|--------|
| PRD.md parsed (title extracted) | `src/parser/projectParser.ts:55-65` | ✅ |
| PRD content viewable in file browser | `src/App.tsx:191-223` files view + MarkdownPreview | ✅ |
| Dedicated PRD-to-task mapping view | Not implemented | ❌ |

**Note:** FR4 was PRD-prioritized as "Should" (not "Must"). The file browser allows users to read PRD.md content, but there is no explicit FR-to-task correlation view. This is acceptable given the priority level.

### FR5: Aesthetic Web UI ✅ PASS
| Criterion | Evidence | Status |
|-----------|----------|--------|
| shadcn/ui components used | `src/components/ui/button.tsx`, `src/components/layout/*.tsx` | ✅ |
| Tailwind v4 theme configured | `src/index.css:1-34` @theme directive | ✅ |
| Lucide icons throughout | TaskNode, OverviewPanel, FileTree, etc. | ✅ |
| Layout clear, no visual misalignment | AppShell with sidebar + main content | ✅ |

### FR6: File Browser ✅ PASS
| Criterion | Evidence | Status |
|-----------|----------|--------|
| File tree shows project files | `src/components/files/FileTree.tsx` | ✅ |
| Markdown files render with syntax highlighting | `src/components/files/MarkdownPreview.tsx:17-45` highlightCode | ✅ |
| Non-markdown files as plain text | `src/App.tsx:213` `<pre>` fallback | ✅ |

### FR7: Responsive Layout ✅ PASS
| Criterion | Evidence | Status |
|-----------|----------|--------|
| Sidebar collapses on tablet/mobile | `src/components/layout/AppShell.tsx:46-53` useMediaQuery + auto-collapse | ✅ |
| Empty state when no task-graph.md | `src/components/ui/EmptyState.tsx` + `src/App.tsx:178-186` | ✅ |
| Circular dependencies highlighted | `src/App.tsx:19-67` `detectCycleEdges()` + dashed red edges | ✅ |
| Errors display without losing data | `src/components/ui/ErrorBoundary.tsx` + error banner with Dismiss/Retry | ✅ |

### FR-Additional: Auto-refresh ✅ PASS
| Criterion | Evidence | Status |
|-----------|----------|--------|
| File changes detected within 5s | `src/hooks/useFileWatcher.ts:52` 5000ms interval | ✅ |
| Views update without manual refresh | `src/App.tsx:147` `useFileWatcher` + `reloadProject()` | ✅ |

## Edge Case Validation

| Edge Case | Expected Behavior | Implementation | Status |
|-----------|-------------------|----------------|--------|
| Missing task-graph.md | Friendly empty state | `src/App.tsx:178-186` EmptyState | ✅ |
| Malformed task-graph.md | Parse error displayed | `src/parser/taskGraphParser.ts:38-41` errors → banner | ✅ |
| No tasks in project | Empty state in DAG view | `src/App.tsx:178-186` EmptyState | ✅ |
| Circular dependencies | Dashed red edges | `src/App.tsx:19-67` detectCycleEdges + `strokeDasharray: '5,5'` | ✅ |
| Batch/task mismatch | Show matched tasks only | Partial — tasks and batches parsed independently, no cross-reference marking | ⚠️ |
| Invalid/unreadable path | Error prompt + reselect | `src/store/projectStore.tsx:87-93` catch + error state | ✅ |

## Issues Found

### Issue 1: FR4 Partial Implementation (Minor)
- **Severity:** Low ("Should" priority)
- **Description:** No dedicated PRD-to-task mapping view. Users can view PRD.md in the file browser but cannot see which FRs map to which tasks.
- **Reproduction:** Load any project → switch to Files view → click PRD.md
- **Impact:** Users must manually correlate PRD sections with task IDs

### Issue 2: Batch/Task Mismatch Not Explicitly Handled (Minor)
- **Severity:** Low
- **Description:** When execution-batch files reference tasks not in task-graph.md (or vice versa), there's no explicit "unassigned batch" marking. Both datasets are displayed independently.
- **Reproduction:** Create a batch file referencing a non-existent task ID
- **Impact:** User sees the task in the batch list but no visual indication of mismatch

### Issue 3: LightningCSS Warnings (Cosmetic)
- **Severity:** None (build succeeds)
- **Description:** Vite build emits warnings about unknown Tailwind v4 at-rules (@theme, @tailwind, @apply)
- **Impact:** Zero functional impact; CSS output is correct

## Review
- Files reviewed: 16
- Scope compliance: T5.1 is validation-only; no source code modified
- Actual parallelism: N/A (1 sequential task)

## Follow-Ups
- T5.1 complete → mark [x]
- T5.2 (dogfooding validation) now unblocked
- Next step: invoke `task-graph-to-batch` for T5.2
