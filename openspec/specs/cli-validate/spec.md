# CLI 验证规范

## 目的
定义 `openspec validate` 命令行为，用于验证变更和规范，提供可操作的修复指导和结构化输出。

## 需求
### 需求：验证应当提供可操作的修复步骤
验证输出应当包含修复每个错误的具体指导，包括预期结构、示例标题和建议的验证命令。

#### 场景：变更中未找到增量
- **当** 验证解析到零个增量的变更时
- **则** 显示错误"未找到增量"并提供指导：
  - 说明变更规范必须包含 `## ADDED Requirements`、`## MODIFIED Requirements`、`## REMOVED Requirements` 或 `## RENAMED Requirements`
  - 提醒作者文件必须位于 `openspec/changes/{id}/specs/<capability>/spec.md` 下
  - 包含明确注释："规范增量文件不能在操作标题之前以标题开始"
  - 建议运行 `openspec change show {id} --json --deltas-only` 进行调试

#### 场景：缺失必需部分
- **当** 缺少必需部分时
- **则** 包含预期标题名称和最小框架：
  - 对于规范：`## Purpose`、`## Requirements`
  - 对于变更：`## Why`、`## What Changes`
  - 提供缺失部分的示例代码片段，包含占位符文本，可直接复制
  - 提及 `openspec/AGENTS.md` 中的快速参考部分作为权威模板

#### 场景：缺失需求描述文本
- **当** 需求标题在场景之前缺少描述文本时
- **则** 发出错误，说明 `### Requirement:` 行后必须有叙述文本，然后才能有 `#### Scenario:` 标题
  - 显示合规示例："### Requirement: Foo" 后跟 "系统应当..."
  - 建议在列出场景之前添加 1-2 句描述规范行为的句子
  - 参考 `openspec/AGENTS.md` 中的验证前检查清单

### 需求：验证器应当检测可能格式错误的场景并警告提供修复
验证器应当识别看起来像场景的项目符号行（例如以 WHEN/THEN/AND 开头的行）并发出针对性警告，提供转换为 `#### Scenario:` 的示例。

#### 场景：需求下的项目符号 WHEN/THEN
- **当** 在没有 `#### Scenario:` 标题的需求下找到以 WHEN/THEN/AND 开头的项目符号时
- **则** 发出警告："场景必须使用 '#### Scenario:' 标题"，并显示转换模板：
```
#### 场景：简短名称
- **当** ...
- **则** ...
- **并且** ...
```

### 需求：所有问题应当包含文件路径和结构化位置
错误、警告和信息消息应当包含：
- 源文件路径（`openspec/changes/{id}/proposal.md`、`.../specs/{cap}/spec.md`）
- 结构化路径（例如 `deltas[0].requirements[0].scenarios`）

#### 场景：Zod 验证错误
- **当** 模式验证失败时
- **则** 消息应当包含 `file`、`path`，以及适用的修复提示

### 需求：无效结果在人类可读输出中应当包含下一步页脚
当项目无效且不使用 `--json` 时，CLI 应当附加下一步页脚，包括：
- 带计数的摘要行
- 前 3 条指导要点（根据最频繁或阻塞性错误上下文化）
- 建议使用 `--json` 和/或调试命令重新运行

#### 场景：变更无效摘要
- **当** 变更验证失败时
- **则** 打印"下一步"，包含 2-3 条针对性要点，并建议 `openspec change show <id> --json --deltas-only`

### 需求：顶层 validate 命令

CLI 应当提供顶层 `validate` 命令，用于灵活选择选项验证变更和规范。

#### 场景：交互式验证选择

- **当** 执行 `openspec validate` 而不带参数时
- **则** 提示用户选择要验证的内容（全部、变更、规范或特定项目）
- **并且** 根据选择执行验证
- **并且** 以适当的格式显示结果

#### 场景：非交互环境不提示

- **前提** stdin 不是 TTY 或提供了 `--no-interactive` 或环境变量 `OPEN_SPEC_INTERACTIVE=0`
- **当** 执行 `openspec validate` 而不带参数时
- **则** 不进行交互式提示
- **并且** 打印有用的提示，列出可用命令/标志，以退出码 1 退出

#### 场景：直接项目验证

- **当** 执行 `openspec validate <item-name>` 时
- **则** 自动检测项目是变更还是规范
- **并且** 验证指定项目
- **并且** 显示验证结果

### 需求：批量和过滤验证

validate 命令应当支持批量验证（--all）和按类型过滤验证（--changes、--specs）的标志。

#### 场景：验证所有

- **当** 执行 `openspec validate --all` 时
- **则** 验证 openspec/changes/ 中的所有变更（排除 archive）
- **并且** 验证 openspec/specs/ 中的所有规范
- **并且** 显示通过/失败项目的摘要
- **并且** 如果任何验证失败则以退出码 1 退出

#### 场景：批量验证范围

- **当** 使用 `--all` 或 `--changes` 验证时
- **则** 包含 `openspec/changes/` 下的所有变更提案
- **并且** 排除 `openspec/changes/archive/` 目录

- **当** 使用 `--specs` 验证时
- **则** 包含所有在 `openspec/specs/<id>/spec.md` 下有 `spec.md` 的规范

#### 场景：验证所有变更

- **当** 执行 `openspec validate --changes` 时
- **则** 验证 openspec/changes/ 中的所有变更（排除 archive）
- **并且** 显示每个变更的结果
- **并且** 显示摘要统计

#### 场景：验证所有规范

- **当** 执行 `openspec validate --specs` 时
- **则** 验证 openspec/specs/ 中的所有规范
- **并且** 显示每个规范的结果
- **并且** 显示摘要统计

### 需求：验证选项和进度指示

validate 命令应当支持标准验证选项（--strict、--json）并在批量操作期间显示进度。

#### 场景：严格验证

- **当** 执行 `openspec validate --all --strict` 时
- **则** 对所有项目应用严格验证
- **并且** 将警告视为错误
- **并且** 如果任何项目有警告或错误则失败

#### 场景：JSON 输出

- **当** 执行 `openspec validate --all --json` 时
- **则** 以 JSON 格式输出验证结果
- **并且** 包含每个项目的详细问题
- **并且** 包含摘要统计

#### 场景：批量验证的 JSON 输出模式

- **当** 执行 `openspec validate --all --json`（或 `--changes` / `--specs`）时
- **则** 输出具有以下结构的 JSON 对象：
  - `items`：对象数组，字段为 `{ id: string, type: "change"|"spec", valid: boolean, issues: Issue[], durationMs: number }`
  - `summary`：对象 `{ totals: { items: number, passed: number, failed: number }, byType: { change?: { items: number, passed: number, failed: number }, spec?: { items: number, passed: number, failed: number } } }`
  - `version`：模式的字符串标识符（例如 `"1.0"`）
- **并且** 如果任何 `items[].valid === false` 则以退出码 1 退出

其中 `Issue` 遵循现有的每项验证报告结构 `{ level: "ERROR"|"WARNING"|"INFO", path: string, message: string }`。

#### 场景：显示验证进度

- **当** 验证多个项目（--all、--changes 或 --specs）时
- **则** 显示进度指示器或状态更新
- **并且** 指示当前正在验证的项目
- **并且** 显示通过/失败项目的运行计数

#### 场景：性能并发限制

- **当** 验证多个项目时
- **则** 以有限并发运行验证（例如 4-8 个并行）
- **并且** 确保进度指示器保持响应

### 需求：项目类型检测和歧义处理

validate 命令应当处理歧义名称和显式类型覆盖，以确保清晰、确定性的行为。

#### 场景：带自动类型检测的直接项目验证

- **当** 执行 `openspec validate <item-name>` 时
- **则** 如果 `<item-name>` 唯一匹配变更或规范，验证该项目

#### 场景：变更和规范名称歧义

- **前提** `<item-name>` 同时作为变更和规范存在
- **当** 执行 `openspec validate <item-name>` 时
- **则** 打印歧义错误，说明两个匹配
- **并且** 建议传递 `--type change` 或 `--type spec`，或使用 `openspec change validate` / `openspec spec validate`
- **并且** 以退出码 1 退出，不执行验证

#### 场景：未知项目名称

- **当** `<item-name>` 既不匹配变更也不匹配规范时
- **则** 打印未找到错误
- **并且** 可用时显示最近匹配建议
- **并且** 以退出码 1 退出

#### 场景：显式类型覆盖

- **当** 执行 `openspec validate --type change <item>` 时
- **则** 将 `<item>` 视为变更 ID 并验证（跳过自动检测）

- **当** 执行 `openspec validate --type spec <item>` 时
- **则** 将 `<item>` 视为规范 ID 并验证（跳过自动检测）

### 需求：交互性控制

- CLI 应当尊重 `--no-interactive` 以禁用提示。
- CLI 应当尊重 `OPEN_SPEC_INTERACTIVE=0` 以全局禁用提示。
- 交互式提示应当仅在 stdin 是 TTY 且未禁用交互性时显示。

#### 场景：通过标志或环境禁用提示

- **当** 使用 `--no-interactive` 或环境 `OPEN_SPEC_INTERACTIVE=0` 执行 `openspec validate` 时
- **则** CLI 不应当显示交互式提示
- **并且** 应当按需打印非交互式提示或选定输出

### 需求：解析器应当处理跨平台行结束符
Markdown 解析器应当正确识别部分，无论行结束符格式如何（LF、CRLF、CR）。

#### 场景：使用 CRLF 行结束符解析必需部分
- **前提** 使用 CRLF 行结束符保存的变更提案 Markdown
- **并且** 文档包含 `## Why` 和 `## What Changes`
- **当** 运行 `openspec validate <change-id>` 时
- **则** 验证应当识别部分，不应当引发解析错误
