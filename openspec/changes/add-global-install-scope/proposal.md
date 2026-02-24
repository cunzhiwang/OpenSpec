## 为什么

OpenSpec 安装路径目前不一致：

- 大多数技能和命令被写入项目本地目录。
- Codex 命令已经是全局的（`$CODEX_HOME/prompts` 或 `~/.codex/prompts`）。
- 用户无法跨工具选择一致的安装范围策略。

这给那些更喜欢用户级设置并期望工具产物默认全局管理的用户带来了摩擦。

## 变更内容

### 1. 添加带遗留安全默认值的安装范围偏好

引入一个具有两种模式的全局安装范围设置：

- `global`（新创建配置的默认值）
- `project`

该设置存储在全局配置中，可以按命令运行覆盖。
对于 `installScope` 缺失的模式演进遗留配置，有效默认值保持为 `project`，直到用户选择全局范围。

### 2. 为技能和命令添加范围感知路径解析

重构路径解析，使 `init` 和 `update` 从以下内容计算安装目标：

- 选定的范围偏好（`global` 或 `project`）
- 工具能力元数据（每个工具/表面支持哪些范围）
- 运行时上下文（项目根目录、主目录、环境覆盖）

### 3. 为范围支持添加每工具能力元数据

扩展工具元数据以明确声明每个表面的范围支持：

- 技能范围支持
- 命令范围支持

当某个工具/表面不支持首选范围时，系统使用确定性回退规则并在输出中报告有效范围。

### 4. 使命令生成上下文感知

扩展命令适配器路径解析，使适配器接收安装上下文（范围 + 环境上下文），而不仅仅是命令 ID。这消除了特殊情况处理，并允许跨工具的一致范围行为。

### 5. 更新 init/update 用户体验和行为

- `openspec init`：
  - 接受范围覆盖标志
  - 使用配置的范围或迁移感知默认值（新配置默认全局；遗留配置保留项目直到迁移）
  - 应用范围感知生成和清理规划
- `openspec update`：
  - 应用当前范围偏好
  - 按每个工具/表面的有效范围同步产物
  - 为每个工具/表面跟踪最后成功的有效范围以进行确定性范围漂移检测
  - 清楚地报告有效范围决策

### 6. 扩展配置用户体验和文档

- 在 `openspec config profile` 交互流程中添加安装范围控制。
- 扩展 `openspec config list` 输出以显示安装范围来源（`explicit`、`new-default`、`legacy-default`）。
- 添加显式迁移指导和提示路径，以便遗留用户可以选择进入 `global` 范围。
- 更新支持的工具和 CLI 文档以解释范围行为和回退规则。

### 7. 与命令表面能力交付规则协调

`cli-init` 和 `cli-update` 规划应组合：

- 安装范围（`global | project`）
- 交付模式（`both | skills | commands`）
- 命令表面能力（`adapter | skills-invocable | none`）

此提案仍专注于范围解析，但实现和测试覆盖应包括混合工具案例，以避免与 `add-tool-command-surface-capabilities` 结合时的回归。

## 能力

### 新能力

- `installation-scope`：工具产物安装的范围偏好模型和有效范围解析。

### 修改的能力

- `global-config`：使用模式演进默认值持久化安装范围偏好。
- `cli-config`：配置和检查安装范围偏好。
- `ai-tool-paths`：添加工具级范围支持元数据和路径策略。
- `command-generation`：通过安装上下文进行范围感知适配器路径解析。
- `cli-init`：范围感知初始化规划和输出。
- `cli-update`：范围感知更新同步、漂移检测和输出。
- `migration`：具有安装范围感知工作流查找的范围感知迁移扫描。

## 影响

- `src/core/global-config.ts` - 新的安装范围字段和默认值
- `src/core/config-schema.ts` - 安装范围配置键的验证支持
- `src/commands/config.ts` - 安装范围的交互式配置文件/配置用户体验添加
- `src/core/config.ts` - 工具范围能力元数据
- `src/core/available-tools.ts` 和 `src/core/shared/tool-detection.ts` - 范围感知配置检测
- `src/core/command-generation/types.ts` 和适配器实现 - 上下文感知文件路径解析
- `src/core/init.ts` - 范围感知生成/移除规划
- `src/core/update.ts` - 范围感知同步/移除/漂移规划
- `src/core/migration.ts` - 范围感知工作流扫描支持
- `docs/supported-tools.md` 和 `docs/cli.md` - 安装范围行为文档
- `test/core/init.test.ts`、`test/core/update.test.ts`、适配器测试、配置测试 - 范围覆盖
