# CLI Spec 规范

## 目的
定义 `openspec spec` 命令行为，用于列出、显示和验证权威规范。

## 需求
### 需求：交互式规范 show

当不提供 spec-id 时，spec show 命令应当支持交互式选择。

#### 场景：show 的交互式规范选择

- **当** 执行 `openspec spec show` 而不带参数时
- **则** 显示可用规范的交互式列表
- **并且** 允许用户选择要显示的规范
- **并且** 显示所选规范内容
- **并且** 保持所有现有 show 选项（--json、--requirements、--no-scenarios、-r）

#### 场景：非交互式回退保持当前行为

- **前提** stdin 不是 TTY 或提供了 `--no-interactive` 或环境变量 `OPEN_SPEC_INTERACTIVE=0`
- **当** 执行 `openspec spec show` 而不带 spec-id 时
- **则** 不进行交互式提示
- **并且** 打印缺少 spec-id 的现有错误消息
- **并且** 设置非零退出码

### 需求：Spec 命令

系统应当提供带有子命令的 `spec` 命令，用于显示、列出和验证规范。

#### 场景：以 JSON 格式显示规范

- **当** 执行 `openspec spec show init --json` 时
- **则** 解析 markdown 规范文件
- **并且** 层次化提取标题和内容
- **并且** 将有效 JSON 输出到 stdout

#### 场景：列出所有规范

- **当** 执行 `openspec spec list` 时
- **则** 扫描 openspec/specs 目录
- **并且** 返回所有可用能力的列表
- **并且** 支持使用 `--json` 标志输出 JSON

#### 场景：过滤规范内容

- **当** 执行 `openspec spec show init --requirements` 时
- **则** 仅显示需求名称和 SHALL 陈述
- **并且** 排除场景内容

#### 场景：验证规范结构

- **当** 执行 `openspec spec validate init` 时
- **则** 解析规范文件
- **并且** 根据 Zod 模式验证
- **并且** 报告任何结构问题

### 需求：JSON 模式定义

系统应当定义准确表示规范结构的 Zod 模式，用于运行时验证。

#### 场景：模式验证

- **当** 将规范解析为 JSON 时
- **则** 使用 Zod 模式验证结构
- **并且** 确保所有必需字段存在
- **并且** 为验证失败提供清晰的错误消息

### 需求：交互式规范验证

当不提供 spec-id 时，spec validate 命令应当支持交互式选择。

#### 场景：验证的交互式规范选择

- **当** 执行 `openspec spec validate` 而不带参数时
- **则** 显示可用规范的交互式列表
- **并且** 允许用户选择要验证的规范
- **并且** 验证所选规范
- **并且** 保持所有现有验证选项（--strict、--json）

#### 场景：非交互式回退保持当前行为

- **前提** stdin 不是 TTY 或提供了 `--no-interactive` 或环境变量 `OPEN_SPEC_INTERACTIVE=0`
- **当** 执行 `openspec spec validate` 而不带 spec-id 时
- **则** 不进行交互式提示
- **并且** 打印缺少 spec-id 的现有错误消息
- **并且** 设置非零退出码
