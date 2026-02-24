# command-generation 规范

## 目的
定义工具无关的命令内容和适配器契约，用于生成工具特定的 OpenSpec 命令文件。

## 需求
### 需求：CommandContent 接口

系统应当为命令数据定义工具无关的 `CommandContent` 接口。

#### 场景：CommandContent 结构

- **当** 定义要生成的命令时
- **则** `CommandContent` 应当包含：
  - `id`：字符串标识符（例如 'explore'、'apply'）
  - `name`：人类可读名称（例如 'OpenSpec Explore'）
  - `description`：命令目的的简要描述
  - `category`：分组类别（例如 'OpenSpec'）
  - `tags`：标签字符串数组
  - `body`：命令指令内容

### 需求：ToolCommandAdapter 接口

系统应当为每个工具的格式化定义 `ToolCommandAdapter` 接口。

#### 场景：适配器接口结构

- **当** 实现工具适配器时
- **则** `ToolCommandAdapter` 应当要求：
  - `toolId`：匹配 `AIToolOption.value` 的字符串标识符
  - `getFilePath(commandId: string)`：返回命令的文件路径（从项目根目录的相对路径，或对于 Codex 等全局作用域工具的绝对路径）
  - `formatFile(content: CommandContent)`：返回带 frontmatter 的完整文件内容

#### 场景：Claude 适配器格式化

- **当** 为 Claude Code 格式化命令时
- **则** 适配器应当输出带有 `name`、`description`、`category`、`tags` 字段的 YAML frontmatter
- **且** 文件路径应当遵循模式 `.claude/commands/opsx/<id>.md`

#### 场景：Cursor 适配器格式化

- **当** 为 Cursor 格式化命令时
- **则** 适配器应当输出带有 `name` 为 `/opsx-<id>`、`id`、`category`、`description` 字段的 YAML frontmatter
- **且** 文件路径应当遵循模式 `.cursor/commands/opsx-<id>.md`

#### 场景：Windsurf 适配器格式化

- **当** 为 Windsurf 格式化命令时
- **则** 适配器应当输出带有 `name`、`description`、`category`、`tags` 字段的 YAML frontmatter
- **且** 文件路径应当遵循模式 `.windsurf/workflows/opsx-<id>.md`

### 需求：命令生成器函数

系统应当提供将内容与适配器结合的 `generateCommand` 函数。

#### 场景：生成命令文件

- **当** 调用 `generateCommand(content, adapter)` 时
- **则** 它应当返回包含以下内容的对象：
  - `path`：来自 `adapter.getFilePath(content.id)` 的文件路径
  - `fileContent`：来自 `adapter.formatFile(content)` 的格式化内容

#### 场景：生成多个命令

- **当** 为某个工具生成所有 opsx 命令时
- **则** 系统应当遍历命令内容并使用该工具的适配器生成每个命令

### 需求：CommandAdapterRegistry

系统应当提供用于查找工具适配器的注册表。

#### 场景：通过工具 ID 获取适配器

- **当** 调用 `CommandAdapterRegistry.get('cursor')` 时
- **则** 它应当返回 Cursor 适配器，如果未注册则返回 undefined

#### 场景：获取所有适配器

- **当** 调用 `CommandAdapterRegistry.getAll()` 时
- **则** 它应当返回所有已注册适配器的数组

#### 场景：未找到适配器

- **当** 为未注册的工具查找适配器时
- **则** `CommandAdapterRegistry.get()` 应当返回 undefined
- **且** 调用者应当适当处理缺失的适配器

### 需求：共享命令正文内容

命令的正文内容应当在所有工具间共享。

#### 场景：跨工具相同的指令

- **当** 为 Claude 和 Cursor 生成 'explore' 命令时
- **则** 两者应当使用相同的 `body` 内容
- **且** 仅 frontmatter 和文件路径应当不同
