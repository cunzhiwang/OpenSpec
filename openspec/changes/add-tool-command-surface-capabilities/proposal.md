## 为什么

OpenSpec 目前假设命令交付直接映射到命令适配器。这个假设并非对所有工具都成立。

Trae 是一个具体的例子：它通过技能条目（例如 `/openspec-new-change`）调用 OpenSpec 工作流，而不是适配器生成的命令文件。在这种模型中，技能是命令表面。

今天，这造成了行为差距：

- `delivery=commands` 可能会移除技能
- 没有适配器的工具会跳过命令生成
- 结果：像 Trae 这样的选定工具最终可能没有可调用的工作流产物

这不仅仅是提示用户体验问题，因为非交互式和 CI 流程会绕过交互式指导。我们需要在核心生成逻辑中建立能力感知模型。

## 变更内容

### 1. 添加显式命令表面能力元数据

在工具元数据中添加一个可选字段来描述工具如何暴露命令：

- `adapter`：通过命令适配器生成命令文件
- `skills-invocable`：技能可直接作为命令调用
- `none`：没有 OpenSpec 命令表面

字段应该是可选的。默认行为从适配器注册表存在推断：有注册适配器的工具解析为 `adapter`；没有适配器注册且没有显式注释的工具解析为 `none`。
能力值使用 kebab-case 字符串令牌以与序列化元数据约定保持一致。

初始显式覆盖：

- Trae -> `skills-invocable`

### 2. 使交付行为能力感知

更新 `init` 和 `update` 以从以下内容计算每个工具的有效产物操作：

- 全局交付（`both | skills | commands`）
- 工具命令表面能力

行为矩阵：

- `both`：
  - 为所有具有 `skillsDir` 的工具生成技能（包括 `skills-invocable`）
  - 仅为 `adapter` 工具生成命令文件
  - `none`：无产物操作；可能发出兼容性警告
- `skills`：
  - 为所有具有 `skillsDir` 的工具生成技能（包括 `skills-invocable`）
  - 移除适配器生成的命令文件
  - `none`：无产物操作；可能发出兼容性警告
- `commands`：
  - `adapter`：生成命令，移除技能
  - `skills-invocable`：生成（或如果最新则保留）技能作为命令表面；不移除它们
  - `none`：以清晰错误快速失败

### 3. 添加预检验证和更清晰的输出

在写入/移除产物之前，根据交付模式验证选定/配置的工具：

- 交互流程：在确认前显示清晰的兼容性说明
- 非交互流程：以确定性错误失败，列出不兼容的工具和支持的替代方案

更新摘要以显示每个工具的有效交付结果（例如，当命令模式仍然为 skills-invocable 工具安装技能时）。

### 4. 更新文档和测试

- 文档化能力模型和 Trae 在交付模式下的行为
- 确保 CLI 文档和支持的工具文档反映有效行为
- 添加测试覆盖：
  - 使用 `delivery=commands` 的 `init --tools trae`
  - 在 `delivery=commands` 下配置 Trae 的 `update`
  - 所有交付模式下的混合选择（`claude + trae`）
  - `delivery=commands` 下没有命令表面的工具的显式错误路径

### 5. 与安装范围行为协调

当与 `add-global-install-scope` 结合时，init/update 规划必须组合：

- 安装范围（`global | project`）
- 交付模式（`both | skills | commands`）
- 命令表面能力（`adapter | skills-invocable | none`）

实现测试应覆盖混合工具矩阵，以确保两个变更都激活时的确定性行为。

## 能力

### 新能力

- `tool-command-surface`：将工具分类为 `adapter`、`skills-invocable` 或 `none` 以驱动交付行为的能力模型

### 修改的能力

- `cli-init`：交付处理变为工具能力感知，带预检兼容性验证
- `cli-update`：交付同步变为工具能力感知，带一致的兼容性验证和消息
- `supported-tools-docs`：文档化非适配器工具的命令表面语义

## 影响

- `src/core/config.ts` - 添加可选的命令表面元数据和 Trae 覆盖
- `src/core/command-generation/registry.ts`（或共享助手）- 从适配器存在推断能力
- `src/core/init.ts` - 能力感知生成/移除规划 + 兼容性验证 + 摘要消息
- `src/core/update.ts` - 能力感知同步/移除规划 + 兼容性验证 + 摘要消息
- `src/core/shared/tool-detection.ts` - 包含能力感知检测，使 `skills-invocable` 工具在 `delivery=commands` 下保持可检测，`none` 工具被排除在命令表面产物检测之外
- `docs/supported-tools.md` 和 `docs/cli.md` - 文档化交付行为和兼容性说明
- `test/core/init.test.ts` 和 `test/core/update.test.ts` - 添加 skills-invocable 行为和混合工具交付场景的覆盖

## 排序说明

- 此变更旨在与 `simplify-skill-installation` 安全堆叠，通过为 init/update 引入增量的、能力特定的需求。
- 如果 `simplify-skill-installation` 先合并，此变更应变基并保持能力感知规则作为 `skills-invocable` 工具上 `delivery=commands` 行为的事实来源。
- 如果此变更先合并，`simplify-skill-installation` 分支应变基以避免重新引入"所有工具的 commands-only 意味着没有技能"的全局假设。
- 如果 `add-global-install-scope` 先合并，此变更应变基以在该变更的范围解析路径决策之上组合能力感知行为。
- 如果此变更先合并，`add-global-install-scope` 应变基以保留第 5 节组合规则（`安装范围` + `交付模式` + `命令表面能力`），而不覆盖能力感知命令表面结果。
