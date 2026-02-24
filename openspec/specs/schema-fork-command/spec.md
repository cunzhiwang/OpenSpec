# schema-fork-command 规范

## 目的
定义 `openspec schema fork` 行为，用于将现有模式克隆到项目本地模式中，并提供安全的覆盖控制。

## 需求
### 需求：Schema fork 复制现有模式
CLI 应当提供 `openspec schema fork <source> [name]` 命令，将现有模式复制到项目的 `openspec/schemas/` 目录。

#### 场景：使用显式名称 Fork
- **当** 用户运行 `openspec schema fork spec-driven my-custom` 时
- **则** 系统使用解析顺序（项目 → 用户 → 包）定位 `spec-driven` 模式
- **且** 将所有文件复制到 `openspec/schemas/my-custom/`
- **且** 将 `schema.yaml` 中的 `name` 字段更新为 `my-custom`
- **且** 显示成功消息及源路径和目标路径

#### 场景：使用默认名称 Fork
- **当** 用户运行 `openspec schema fork spec-driven` 而未指定名称时
- **则** 系统复制到 `openspec/schemas/spec-driven-custom/`
- **且** 将 `schema.yaml` 中的 `name` 字段更新为 `spec-driven-custom`

#### 场景：源模式未找到
- **当** 用户运行 `openspec schema fork nonexistent` 时
- **则** 系统显示模式未找到的错误
- **且** 列出可用模式
- **且** 以非零代码退出

### 需求：Schema fork 防止意外覆盖
CLI 应当在目标模式已存在时要求确认或 `--force` 标志。

#### 场景：目标存在但无 force
- **当** 用户运行 `openspec schema fork spec-driven my-custom` 且 `openspec/schemas/my-custom/` 存在时
- **则** 系统显示目标已存在的错误
- **且** 建议使用 `--force` 覆盖
- **且** 以非零代码退出

#### 场景：目标存在且有 force 标志
- **当** 用户运行 `openspec schema fork spec-driven my-custom --force` 且目标存在时
- **则** 系统移除现有目标目录
- **且** 将源模式复制到目标
- **且** 显示成功消息

#### 场景：覆盖的交互式确认
- **当** 用户在交互模式下运行 `openspec schema fork spec-driven my-custom` 且目标存在时
- **则** 系统提示确认覆盖
- **且** 根据用户响应继续

### 需求：Schema fork 保留所有模式文件
CLI 应当复制完整的模式目录，包括模板、配置和任何附加文件。

#### 场景：复制包含模板文件
- **当** 用户 fork 一个带有模板文件的模式时（例如 `proposal.md`、`design.md`）
- **则** 所有模板文件都复制到目标
- **且** 模板文件内容不变

#### 场景：复制包含嵌套目录
- **当** 用户 fork 一个带有嵌套目录的模式时（例如 `templates/specs/`）
- **则** 保留嵌套目录结构
- **且** 复制所有嵌套文件

### 需求：Schema fork 输出 JSON 格式
CLI 应当支持 `--json` 标志以提供机器可读输出。

#### 场景：成功时的 JSON 输出
- **当** 用户运行 `openspec schema fork spec-driven my-custom --json` 时
- **则** 系统输出带有 `forked: true`、`source`、`destination` 和 `sourcePath` 字段的 JSON

#### 场景：JSON 输出显示源位置
- **当** 用户运行 `openspec schema fork spec-driven --json` 时
- **则** JSON 输出包含指示 "project"、"user" 或 "package" 的 `sourceLocation` 字段
