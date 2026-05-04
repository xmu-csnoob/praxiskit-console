# PRD: PraxisKit Multi-Wave Iteration Support

## Summary
在现有 PraxisKit Visual Workbench 基础上增加多轮迭代支持，解决当前工具只能展示单轮迭代数据的问题。新功能允许开发者在 console 中查看、切换和管理多个迭代轮次的历史数据，并自动归档旧迭代信息，使完整的项目演进过程可追溯。 [inferred from problem + desired_future]

## Goals
- 可在 console 中查看历史迭代数据（任意轮次的任务、批次、审查记录） [user via gate]
- 迭代切换直观快速（不超过两次点击即可切换到目标迭代） [user via gate]
- 归档自动发生（启动新迭代时旧数据自动保留，无需手动操作） [user via gate]
- 向后兼容：单轮迭代项目的行为与当前版本完全一致 [inferred from constraints]

## Repo Baseline
| Item | Evidence | Notes |
|------|----------|-------|
| Platform / stack | `package.json`, `vite.config.ts` | React 18 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui |
| Test command | `npx tsc --noEmit` | TypeScript type check |
| Build command | `npm run build` | Vite production build |
| Existing features | `src/` (37 files) | Parser, DAG, UI layout, file browser, auto-refresh all implemented |

## Non-Goals
- 不支持编辑历史迭代数据（历史轮次只读） [user via gate]
- 不支持跨项目迭代视图（仅当前项目内的多轮迭代） [user via gate]
- 不替代 PraxisKit CLI 或技能的功能，仅作为补充可视化层 [default]
- 不修改 PraxisKit 工作流文件格式（只读展示） [inferred from constraints]

## Users & Use Cases
| User | Need | Success Looks Like | Source |
|------|------|--------------------|--------|
| 使用 PraxisKit 的开发者 | 查看之前每一轮迭代的任务完成情况和审查结果 | 在 console 中选择一个历史迭代轮次，立即看到该轮次的完整任务图和审查记录 | [inferred from user story] |
| 项目管理者 | 对比不同版本之间的变化 | 可以轻松切换到任意历史迭代，查看该版本的 PRD、task graph 和 acceptance 决策 | [inferred from user story] |

## Functional Requirements
| ID | Requirement | Priority | Validation | Acceptance Criteria | Source |
|----|-------------|----------|------------|---------------------|--------|
| FR1 | 多轮迭代目录结构扫描与识别 | Must | e2e | Given 一个包含多轮迭代数据的 PraxisKit 项目（work/ 目录下存在 wave-1/、wave-2/ 等子目录或类似结构），When 工具扫描该项目，Then 成功识别所有迭代轮次并解析每轮的结构化数据（task-graph、execution-batch、build-log、review、acceptance） | [inferred from core_loop] |
| FR2 | 迭代历史自动归档 | Must | e2e | Given 用户在 work/ 目录中启动新一轮迭代（创建新的 task-graph 或 execution-batch 文件），When 工具检测到变化并重新扫描，Then 上一轮迭代的完整数据被自动归档，旧迭代的 task-graph、execution-batch、build-log、review、acceptance 等文件均可从历史视图中访问 | [inferred from core_loop] |
| FR3 | 迭代轮次切换 UI | Must | manual | Given 用户已加载一个多轮迭代项目，When 用户点击迭代选择器并选择另一个轮次，Then 所有视图（概览、DAG、文件浏览器）在 1 秒内同步刷新显示目标迭代的数据，且整个切换操作不超过两次点击 | [inferred from user story] |
| FR4 | 历史迭代数据概览展示 | Must | e2e | Given 用户选择一个历史迭代，When 查看概览面板，Then 显示该迭代的任务总数、完成数、进行中数、阻塞数，以及执行批次列表和审查状态，与当前迭代的展示方式一致 | [inferred from desired_future] |
| FR5 | 当前迭代高亮与标识 | Should | manual | Given 项目存在多轮迭代，When 用户在迭代选择器中查看列表，Then 当前活跃迭代被明显标记（如高亮边框或标签），历史迭代显示其完成日期或批次数量 | [inferred from desired_future] |

## Non-Functional Requirements
- **性能**: 切换迭代应在 1 秒内完成；解析包含 6 轮迭代以内的项目应在 3 秒内完成 [inferred from success_signals]
- **可靠性**: 归档操作不删除、不修改任何原始 PraxisKit 工作流文件 [inferred from constraints]
- **兼容性**: 向后兼容单轮迭代项目；当项目只有单轮迭代时，行为与当前版本完全一致，不显示多余 UI [inferred from goals]
- **可访问性**: 迭代选择器应支持键盘导航（Tab/Enter） [default]

## UX / Workflow
1. 用户通过浏览器访问可视化工具并加载 PraxisKit 项目 [inferred from core_loop]
2. 工具扫描 work/ 目录，识别当前活跃迭代和所有历史归档迭代 [inferred]
3. 若存在多轮迭代，顶部导航栏显示迭代轮次选择器（下拉菜单或标签页） [inferred]
4. 用户选择一个迭代轮次，所有视图同步更新为该迭代的数据 [inferred]
5. 用户可在概览面板查看该迭代的统计信息、任务状态、执行批次 [inferred]
6. 用户可切换至 DAG 视图查看该迭代的任务依赖图 [inferred]
7. 用户可在文件浏览器查看该迭代的原始 markdown 文件 [inferred]

## Edge Cases
| Case | Expected Behavior | Source |
|------|-------------------|--------|
| 项目只有单轮迭代 | 行为与当前版本完全一致；迭代选择器可显示"第 1 轮"或隐藏 | [default] |
| 归档目录缺失或损坏 | 显示警告提示，仍尝试加载可用数据，不崩溃 | [default] |
| 迭代之间文件命名冲突 | 使用迭代标识符（如 wave-1/、wave-2/）作为命名空间前缀区分 | [default] |
| 某轮迭代缺少部分标准文件 | 该轮次仍显示在列表中，缺失的文件对应视图显示空状态 | [default] |
| 用户快速连续切换迭代 | 取消前一次加载，只渲染最后一次选择的迭代数据（防抖） | [default] |

## Milestones
| ID | Title | Outcome | Source |
|----|-------|---------|--------|
| M1 | 多轮迭代数据模型与目录结构设计 | 确定迭代轮次的目录结构、命名约定、归档策略；更新 parser 类型定义 | [inferred from core_loop] |
| M2 | 多轮迭代扫描与解析引擎 | parser 能够识别并解析多轮迭代数据；store 支持按迭代管理状态 | [inferred from FR1+FR2] |
| M3 | 迭代切换 UI 组件 | 实现迭代选择器组件，集成到现有导航栏；切换时同步更新所有视图 | [inferred from FR3] |
| M4 | 历史数据展示与集成验证 | 概览面板和 DAG 视图支持展示历史迭代数据；单轮项目向后兼容 | [inferred from FR4+FR5] |

## Design Decisions
| Decision | Rationale | Source |
|----------|-----------|--------|
| 归档策略：统一目录 | 每轮迭代的文件移动到统一的归档目录（如 `work/archive/wave-{n}/`），保持原始文件结构完整 | [user via gate] |
| 数据模型：单轮抽象 + 线性表 | 保持现有 `ParsedProject` 等单轮数据结构不变，多轮通过 `ParsedWave[]` 线性列表表示，每个元素包含一个单轮解析结果 | [user via gate] |

## Open Questions
| Question | Owner | Blocks | Type | Source |
|----------|-------|--------|------|--------|
| — | — | — | — | All blocking questions resolved |

## Task Graph Handoff
Recommended next step: invoke the `prd-to-task-graph` skill.
