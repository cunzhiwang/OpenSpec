# CLI 变更规范

## 目的
定义 `openspec change` 命令行为，用于显示、列出和验证变更提案和增量。

## 需求
### 需求：变更命令

系统应当提供带有子命令的 `change` 命令，用于显示、列出和验证变更提案。

#### 场景：以 JSON 格式显示变更

- **当** 执行 `openspec change show update-error --json` 时
- **则** 解析 markdown 变更文件
- **并且** 提取变更结构和增量
- **并且** 将有效 JSON 输出到 stdout

#### 场景：列出所有变更

- **当** 执行 `openspec change list` 时
- **则** 扫描 openspec/changes 目录
- **并且** 返回所有待处理变更的列表
- **并且** 支持使用 `--json` 标志输出 JSON

#### 场景：仅显示需求变更

- **当** 执行 `openspec change show update-error --requirements-only` 时
- **则** 仅显示需求变更（添加/修改/删除/重命名）
- **并且** 排除 why 和 what changes 部分

#### 场景：验证变更结构

- **当** 执行 `openspec change validate update-error` 时
- **则** 解析变更文件
- **并且** 根据 Zod 模式验证
- **并且** 确保增量格式正确

### 需求：向后兼容性

系统应当保持与现有 `list` 命令的向后兼容性，同时显示弃用通知。

#### 场景：旧版 list 命令

- **当** 执行 `openspec list` 时
- **则** 显示当前变更列表（现有行为）
- **并且** 显示弃用通知："注意：'openspec list' 已弃用。请改用 'openspec change list'。"

#### 场景：带 --all 标志的旧版 list

- **当** 执行 `openspec list --all` 时
- **则** 显示所有变更（现有行为）
- **并且** 显示相同的弃用通知

### 需求：交互式 show 选择

当不提供变更名称时，change show 命令应当支持交互式选择。

#### 场景：show 的交互式变更选择

- **当** 执行 `openspec change show` 而不带参数时
- **则** 显示可用变更的交互式列表
- **并且** 允许用户选择要显示的变更
- **并且** 显示所选变更内容
- **并且** 保持所有现有 show 选项（--json、--deltas-only）

#### 场景：非交互式回退保持当前行为

- **前提** stdin 不是 TTY 或提供了 `--no-interactive` 或环境变量 `OPEN_SPEC_INTERACTIVE=0`
- **当** 执行 `openspec change show` 而不带变更名称时
- **则** 不进行交互式提示
- **并且** 打印现有提示，包括可用的变更 ID
- **并且** 设置 `process.exitCode = 1`

### 需求：交互式验证选择

当不提供变更名称时，change validate 命令应当支持交互式选择。

#### 场景：验证的交互式变更选择

- **当** 执行 `openspec change validate` 而不带参数时
- **则** 显示可用变更的交互式列表
- **并且** 允许用户选择要验证的变更
- **并且** 验证所选变更

#### 场景：非交互式回退保持当前行为

- **前提** stdin 不是 TTY 或提供了 `--no-interactive` 或环境变量 `OPEN_SPEC_INTERACTIVE=0`
- **当** 执行 `openspec change validate` 而不带变更名称时
- **则** 不进行交互式提示
- **并且** 打印现有提示，包括可用的变更 ID
- **并且** 设置 `process.exitCode = 1`
