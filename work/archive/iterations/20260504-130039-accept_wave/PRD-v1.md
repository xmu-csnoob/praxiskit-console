# PRD: PraxisKit Visual Workbench

## Summary
一个 Web 界面的可视化工具，能够解析 PraxisKit 项目的标准文件结构（work/ 目录下的 markdown 文件），并以美观的交互式视图展示任务依赖图、执行进度和项目结构。工具本身通过完整的 PraxisKit 工作流构建，实现 dogfooding。 [inferred from problem + desired_future]

## Goals
- 能够解析并可视化任意标准 PraxisKit 项目的 task graph 和 execution batches [inferred from problem]
- 提供美观、直观的 Web UI 展示项目状态 [user via clarify-prd]
- 工具本身通过完整的 PraxisKit 工作流（idea → PRD → task-graph → execution-batch → build）构建 [user]

## Repo Baseline
| Item | Evidence | Notes |
|------|----------|-------|
| Platform / stack | New project | No existing codebase; target: modern React + shadcn/ui |
| Test command | `npm test` | To be established |
| Build command | `npm run build` | To be established |

## Non-Goals
- 不支持跨项目聚合视图（当前仅支持单个项目） [user via clarify-prd]
- 不支持交互式编辑任务依赖或状态（只读展示） [user via clarify-prd]
- 不修改、不写入任何 PraxisKit 工作流文件 [inferred from constraints]
- 不替代 PraxisKit CLI 或技能的功能，仅作为补充可视化层 [default]

## Users & Use Cases
| User | Need | Success Looks Like | Source |
|------|------|--------------------|--------|
| 使用 PraxisKit 的开发者 | 快速理解项目的任务依赖关系和执行顺序 | 打开 Web UI 后，3 秒内看到完整的任务 DAG 图 | [inferred from problem] |
| 项目管理者 | 掌握项目整体进度和阻塞点 | 通过颜色/状态标识一眼看出哪些任务已完成、哪些被阻塞 | [inferred from desired_future] |
| 新加入的团队成员 | 快速了解项目结构和范围 | 通过可视化视图理解 PRD 到任务的映射关系 | [inferred from desired_future] |

## Functional Requirements
| ID | Requirement | Priority | Validation | Acceptance Criteria | Source |
|----|-------------|----------|------------|---------------------|--------|
| FR1 | 解析 PraxisKit 标准文件结构 | Must | e2e | Given 一个包含标准 work/ 目录的 PraxisKit 项目，When 工具扫描该目录，Then 成功解析出 idea.md、PRD.md、task-graph.md、execution-batch 文件列表及其内容结构 | [inferred from problem] |
| FR2 | 渲染任务依赖图（DAG） | Must | e2e | Given 已解析的 task-graph.md，When 用户查看 DAG 视图，Then 每个任务以节点形式呈现，依赖关系以有向边连接，节点按拓扑层级排列 | [inferred from desired_future] |
| FR3 | 展示任务执行状态 | Must | e2e | Given 已解析的 execution-batch 和 task-graph 文件，When 用户查看视图，Then 每个任务节点显示其当前状态（pending / in-progress / completed / blocked），且状态与文件内容一致 | [inferred from desired_future] |
| FR4 | 展示 PRD 与任务的映射 | Should | e2e | Given 已解析的 PRD.md 和 task-graph.md，When 用户点击 PRD 视图，Then 可以看到 PRD 中的功能需求与对应任务的关联 | [inferred from desired_future] |
| FR5 | 提供美观的 Web UI | Must | manual | Given 用户访问可视化工具，When 页面加载完成，Then 界面使用 shadcn/ui 风格组件，布局清晰，配色协调，无视觉错位 | [user via clarify-prd] |
| FR6 | 支持项目文件浏览 | Should | e2e | Given 用户已加载一个项目，When 用户在侧边栏浏览文件树，Then 可以查看 work/ 目录下所有 markdown 文件的原始内容 | [inferred from desired_future] |
| FR7 | 响应式布局适配 | Should | manual | Given 用户在不同尺寸屏幕上访问，When 页面加载完成，Then 布局自适应，核心视图在桌面和 tablet 上均可正常浏览 | [default] |

## Non-Functional Requirements
- **性能**: 解析包含 50 个任务以内的 PraxisKit 项目应在 2 秒内完成；DAG 渲染应在 1 秒内完成 [default]
- **可靠性**: 工具为只读模式，不应修改、删除或创建任何 PraxisKit 工作流文件 [inferred from constraints]
- **兼容性**: 应能处理缺少部分标准文件的项目（如没有 review.md 或 acceptance.md），不因文件缺失而崩溃 [default]
- **可访问性**: 颜色状态标识应配合图标或文字，确保色盲用户可辨识 [default]

## UX / Workflow
1. 用户通过命令行或浏览器访问可视化工具 [inferred from core_loop]
2. 用户指定 PraxisKit 项目路径（或选择示例项目） [inferred]
3. 工具解析 work/ 目录下的所有标准文件 [inferred]
4. 渲染项目概览视图，展示任务统计、进度摘要 [inferred]
5. 用户切换至 DAG 视图查看任务依赖关系 [inferred]
6. 用户可点击任务节点查看详细信息（描述、状态、所属批次等） [inferred]
7. 用户可在侧边栏浏览原始 markdown 文件内容 [inferred]

## Edge Cases
| Case | Expected Behavior | Source |
|------|-------------------|--------|
| 项目缺少 task-graph.md | 显示友好提示"未找到任务图"，但仍展示其他可用信息（如 idea.md、PRD.md 内容） | [default] |
| task-graph.md 格式不规范或解析失败 | 显示解析错误信息，并展示原始文件内容供用户检查 | [default] |
| 项目没有任何任务 | 显示空状态提示，DAG 视图为空 | [default] |
| 循环依赖存在于 task-graph 中 | 检测并标记循环依赖，以虚线或警告色高亮显示 | [default] |
| execution-batch 文件与 task-graph 中的任务不匹配 | 仅显示匹配的任务，不匹配的任务标记为"未分配批次" | [default] |
| 项目路径不存在或不可读 | 显示错误提示，提供重新选择路径的入口 | [default] |

## Milestones
| ID | Title | Outcome | Source |
|----|-------|---------|--------|
| M1 | 项目解析引擎 | 能够可靠解析 PraxisKit 标准文件结构并提取结构化数据 | [inferred from FR1] |
| M2 | DAG 可视化 | 实现任务依赖图的可视化渲染，支持状态着色 | [inferred from FR2+FR3] |
| M3 | Web UI 框架 | 搭建基于 shadcn/ui 的 Web 界面，包含导航、布局、主题 | [inferred from FR5] |
| M4 | 集成与 Polish | 整合解析引擎和 UI，完成响应式适配和边界情况处理 | [inferred from NFR] |
| M5 | Dogfooding 完成 | 工具本身的开发过程完整遵循 PraxisKit 工作流，产出所有标准文件 | [user] |

## Open Questions
| Question | Owner | Blocks | Type | Source |
|----------|-------|--------|------|--------|
| 数据获取方式：直接读取本地文件系统（Node.js 后端），还是纯前端通过 File System Access API / 文件上传？ | User | M1 architecture | blocking | 先试下前端直接处理，观察下性能 |
| 部署/运行方式：本地开发服务器（Vite dev server）、静态构建产物、还是可部署的 Web 服务？ | User | M3 architecture | blocking | 本地服务器即可，类似于一个临时的报告，或者静态的html感觉也不是不行。。 |
| 是否需要在文件变更时自动刷新视图（文件监视）？ | User | M4 scope | non-blocking | 动态更新肯定是要的                                           |
| DAG 可视化库的选择：D3.js、React Flow、Cytoscape.js，还是自定义 Canvas/SVG 实现？ | User | M2 implementation | non-blocking | 这个我不懂，从agent开发角度来思考吧 |

## Task Graph Handoff
Recommended next step: invoke the `prd-to-task-graph` skill.
