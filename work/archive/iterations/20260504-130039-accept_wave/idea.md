# Idea Brief: PraxisKit Multi-Wave Iteration Support [inferred from seed]

## Seed Evidence
- From seed: "目前的版本可以展示一轮迭代，但是没有给多轮迭代提供支持。" [user]
- From seed: "需要支持多轮迭代，并且旧的迭代轮次的信息要归档，并且在console可以访问。" [user]

## One-Liner
让 PraxisKit Visual Workbench 支持多轮迭代的展示、切换与历史归档，使开发者能在同一个 console 中管理完整的项目演进过程。 [inferred from problem + desired_future]

## Target User
- 使用 PraxisKit 工作流管理项目的开发者或项目经理 [user via gate]

## Problem
目前 PraxisKit Visual Workbench 只能展示单轮迭代的数据。当一个项目需要多轮迭代（例如从 idea → PRD → task-graph → 多轮 build → review → revise → 最终 acceptance）时，旧的迭代轮次信息无法保留和查看，开发者只能看到当前一轮的状态，无法回溯历史。 [user]

## Desired Future
支持多轮迭代：每一轮迭代（wave/batch 组）的信息被归档保存，开发者可以在 console 中随时切换查看任意历史迭代轮次的完整数据（任务状态、执行批次、构建日志、审查结果等）。 [user]

## Core Loop
1. 用户完成一轮迭代并启动下一轮（或切换到历史迭代） [inferred from problem]
2. 系统自动归档当前迭代数据，并加载目标迭代的完整信息 [inferred]
3. 用户在 console 中查看、对比和分析任意迭代轮次的数据 [inferred]

## Early User Stories
- As a PraxisKit 用户，我想要在 console 中查看之前每一轮迭代的任务完成情况和审查结果，so that 我可以追溯项目演进历史。 [inferred from desired_future]
- As a PraxisKit 用户，我想要在多轮 revise 之后仍然能访问第一次 acceptance review 的记录，so that 我可以对比不同版本之间的变化。 [inferred from desired_future]

## Constraints
- 保持现有技术栈不变：React + Vite + TypeScript + Tailwind CSS + shadcn/ui [user via gate]

## Open Questions
| Question | Type | Resolution Path |
|---|---|---|
| "归档"的具体实现方式是什么？（文件系统移动、目录重命名、元数据标记？） | blocking | 在 PRD 阶段定义归档策略 |
| 多轮迭代的数据模型如何与现有单轮结构共存？是否需要引入 wave/round 标识？ | blocking | 在 PRD 阶段设计数据模型 |

## Success Signals
- 可在 console 中查看历史迭代数据（任意轮次的任务、批次、审查记录） [user via gate]
- 迭代切换直观快速（不超过两次点击即可切换到目标迭代） [user via gate]
- 归档自动发生（启动新迭代时旧数据自动保留，无需手动操作） [user via gate]

## PRD Handoff
Recommended next step: invoke the `idea-to-prd` skill.
