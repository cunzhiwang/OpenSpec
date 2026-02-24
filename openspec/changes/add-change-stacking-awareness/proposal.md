## 为什么

并行变更经常触及相同的能力和 `cli-init`/`cli-update` 行为，但目前没有机器可读的方式来表达排序、依赖或预期的合并顺序。

这造成了三个反复出现的问题：

- 团队无法判断哪个变更应该首先落地
- 大型变更很难拆分为安全的可合并切片
- 并行工作可能会意外重新引入已被另一个变更移除的假设

我们需要轻量级的规划元数据和 CLI 指导，以便贡献者可以安全地将计划堆叠在彼此之上。

## 变更内容

### 1. 为变更添加轻量级堆叠元数据

扩展变更元数据以支持排序和分解上下文，例如：

- `dependsOn`：必须首先落地的变更
- `provides`：此变更暴露的能力标记
- `requires`：此变更需要的能力标记
- `touches`：可能受影响的能力/规范区域（仅供建议；警告信号，不是硬性依赖）
- `parent`：用于拆分工作的可选父变更

元数据是可选的，对现有变更向后兼容。

排序语义：

- `dependsOn` 是执行/归档排序的事实来源
- `provides`/`requires` 是用于验证和规划可见性的能力契约
- `provides`/`requires` 不创建隐式依赖边；作者仍必须通过 `dependsOn` 声明所需的排序

### 2. 添加堆叠感知验证

增强变更验证以尽早检测规划问题：

- 缺失的依赖
- 依赖循环
- 归档排序违规（例如，尝试在所有 `dependsOn` 前驱被归档之前归档变更）
- 不匹配的能力标记（例如，`requires` 标记在活跃历史中没有提供者时发出非阻塞警告）
- 当活跃变更触及相同能力时的重叠警告

验证应仅对确定性阻塞器失败（例如循环或缺失的必需依赖），并将重叠检查保持为可操作的警告。

### 3. 添加排序可见性命令

添加轻量级 CLI 支持以检查和执行计划顺序：

- `openspec change graph` 显示依赖 DAG/顺序
- `openspec change graph` 首先验证循环；当存在循环时，它会以与堆叠感知验证相同的确定性循环错误失败
- `openspec change next` 建议准备实施/归档的未阻塞变更

### 4. 为大型变更添加拆分脚手架

添加辅助工作流以将大型提案分解为可堆叠的切片：

- `openspec change split <change-id>` 使用 `parent` + `dependsOn` 搭建子变更
- 为每个子切片生成最小的提案/任务存根
- 将源变更转换为父规划容器（没有重复的子实现任务）
- 对已拆分的源变更重新运行 split 会返回确定性可操作错误，除非传递了 `--overwrite`（别名 `--force`）
- `--overwrite` / `--force` 完全重新生成托管子脚手架存根和拆分的元数据链接，替换之前的脚手架内容

### 5. 文档化堆叠优先工作流

更新文档以描述：

- 如何建模依赖和父/子切片
- 何时拆分大型变更
- 如何在并行开发期间使用 graph/next 验证信号
- `openspec/changes/IMPLEMENTATION_ORDER.md` 的迁移指导：
  - 机器可读的变更元数据成为规范的依赖源
  - `IMPLEMENTATION_ORDER.md` 在过渡期间保持为可选的叙述上下文

## 能力

### 新能力

- `change-stacking-workflow`：用于变更规划的依赖感知排序和拆分脚手架

### 修改的能力

- `cli-change`：添加 graph/next/split 规划命令和堆叠感知验证消息
- `change-creation`：在创建或拆分变更时支持父/依赖元数据
- `openspec-conventions`：为变更提案定义可选的堆叠元数据约定

## 影响

- `src/core/project-config.ts` 和相关的解析/验证工具用于变更元数据加载
- `src/core/config-schema.ts`（或专用变更模式）用于堆叠元数据验证
- `src/commands/change.ts` 和/或 `src/core/list.ts` 用于 graph/next/split 命令行为
- `src/core/validation/*` 用于依赖循环和重叠检查
- `docs/cli.md`、`docs/concepts.md` 和贡献者指南用于堆叠感知工作流
- 元数据解析、图排序、下一项建议和拆分脚手架的测试
