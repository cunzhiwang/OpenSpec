# cli-config 规范

## 目的
提供用户友好的 CLI 界面，用于查看和修改全局 OpenSpec 配置设置，无需手动编辑 JSON 文件。

## 需求
### 需求：命令结构

config 命令应当为所有配置操作提供子命令。

#### 场景：可用子命令

- **当** 用户执行 `openspec config --help` 时
- **则** 显示可用子命令：
  - `path` - 显示配置文件位置
  - `list` - 显示所有当前设置
  - `get <key>` - 获取特定值
  - `set <key> <value>` - 设置值
  - `unset <key>` - 移除键（恢复为默认值）
  - `reset` - 将配置重置为默认值
  - `edit` - 在编辑器中打开配置

### 需求：配置路径

config 命令应当显示配置文件位置。

#### 场景：显示配置路径

- **当** 用户执行 `openspec config path` 时
- **则** 打印配置文件的绝对路径
- **且** 以代码 0 退出

### 需求：配置列表

config 命令应当显示所有当前配置值。

#### 场景：以人类可读格式列出配置

- **当** 用户执行 `openspec config list` 时
- **则** 以类 YAML 格式显示所有配置值
- **且** 使用缩进显示嵌套对象

#### 场景：以 JSON 格式列出配置

- **当** 用户执行 `openspec config list --json` 时
- **则** 将完整配置输出为有效 JSON
- **且** 仅输出 JSON（无额外文本）

### 需求：配置获取

config 命令应当检索特定的配置值。

#### 场景：获取顶级键

- **当** 用户执行 `openspec config get <key>` 并指定有效的顶级键时
- **则** 仅打印原始值（无标签或格式化）
- **且** 以代码 0 退出

#### 场景：使用点号表示法获取嵌套键

- **当** 用户执行 `openspec config get featureFlags.someFlag` 时
- **则** 使用点号表示法遍历嵌套结构
- **且** 打印该路径处的值

#### 场景：获取不存在的键

- **当** 用户执行 `openspec config get <key>` 并指定不存在的键时
- **则** 不打印任何内容（空输出）
- **且** 以代码 1 退出

#### 场景：获取对象值

- **当** 用户执行 `openspec config get <key>` 且值为对象时
- **则** 将对象打印为 JSON

### 需求：配置设置

config 命令应当设置配置值，并自动进行类型转换。

#### 场景：设置字符串值

- **当** 用户执行 `openspec config set <key> <value>` 时
- **且** 值不匹配布尔值或数字模式
- **则** 将值存储为字符串
- **且** 显示确认消息

#### 场景：设置布尔值

- **当** 用户执行 `openspec config set <key> true` 或 `openspec config set <key> false` 时
- **则** 将值存储为布尔值（而非字符串）
- **且** 显示确认消息

#### 场景：设置数字值

- **当** 用户执行 `openspec config set <key> <value>` 时
- **且** 值是有效数字（整数或浮点数）
- **则** 将值存储为数字（而非字符串）

#### 场景：使用 --string 标志强制为字符串

- **当** 用户执行 `openspec config set <key> <value> --string` 时
- **则** 无论内容如何都将值存储为字符串
- **且** 这允许将字面量 "true" 或 "123" 存储为字符串

#### 场景：设置嵌套键

- **当** 用户执行 `openspec config set featureFlags.newFlag true` 时
- **则** 如果中间对象不存在则创建它们
- **且** 在嵌套路径处设置值

### 需求：配置取消设置

config 命令应当移除配置覆盖。

#### 场景：取消设置现有键

- **当** 用户执行 `openspec config unset <key>` 时
- **且** 键在配置中存在
- **则** 从配置文件中移除该键
- **且** 值恢复为默认值
- **且** 显示确认消息

#### 场景：取消设置不存在的键

- **当** 用户执行 `openspec config unset <key>` 时
- **且** 键在配置中不存在
- **则** 显示消息指示键未设置
- **且** 以代码 0 退出

### 需求：配置重置

config 命令应当将配置重置为默认值。

#### 场景：带确认的全部重置

- **当** 用户执行 `openspec config reset --all` 时
- **则** 在继续之前提示确认
- **且** 如果确认，删除配置文件或重置为默认值
- **且** 显示确认消息

#### 场景：使用 -y 标志的全部重置

- **当** 用户执行 `openspec config reset --all -y` 时
- **则** 无需提示确认即重置

#### 场景：不带 --all 标志的重置

- **当** 用户执行 `openspec config reset` 而不带 `--all` 时
- **则** 显示错误指示需要 `--all`
- **且** 以代码 1 退出

### 需求：配置编辑

config 命令应当在用户的编辑器中打开配置文件。

#### 场景：成功打开编辑器

- **当** 用户执行 `openspec config edit` 时
- **且** 设置了 `$EDITOR` 或 `$VISUAL` 环境变量
- **则** 在该编辑器中打开配置文件
- **且** 如果配置文件不存在则使用默认值创建
- **且** 等待编辑器关闭后再返回

#### 场景：未配置编辑器

- **当** 用户执行 `openspec config edit` 时
- **且** 既未设置 `$EDITOR` 也未设置 `$VISUAL`
- **则** 显示错误消息建议设置 `$EDITOR`
- **且** 以代码 1 退出

### 需求：配置文件配置流程

`openspec config profile` 命令应当提供一个操作优先的交互式流程，允许用户独立修改交付和工作流设置。

#### 场景：首先显示当前配置文件摘要

- **当** 用户在交互式终端中运行 `openspec config profile` 时
- **则** 显示当前状态头部，包含：
  - 当前交付值
  - 带有配置文件标签（core 或 custom）的工作流数量

#### 场景：操作优先菜单提供可跳过的路径

- **当** 用户交互式运行 `openspec config profile` 时
- **则** 第一个提示应当提供：
  - `Change delivery + workflows`
  - `Change delivery only`
  - `Change workflows only`
  - `Keep current settings (exit)`

#### 场景：交付提示标记当前选择

- **当** 在 `openspec config profile` 中显示交付选择时
- **则** 当前配置的交付选项应当在其标签中包含 `[current]`
- **且** 该值应当默认预选

#### 场景：无操作退出时不保存或提示应用

- **当** 用户选择 `Keep current settings (exit)` 或做出不改变有效配置值的选择时
- **则** 命令应当打印 `No config changes.`
- **且** 不应当写入配置更改
- **且** 不应当询问是否将更新应用到当前项目

#### 场景：无操作时警告当前项目不同步

- **当** `openspec config profile` 在 OpenSpec 项目内以 `No config changes.` 退出时
- **且** 项目文件与当前全局配置文件/交付不同步
- **则** 显示非阻塞警告，指示全局配置尚未应用到此项目
- **且** 包含运行 `openspec update` 以同步项目文件的指导

#### 场景：应用提示受实际更改控制

- **当** 配置值已更改并保存时
- **且** 当前目录是 OpenSpec 项目
- **则** 提示 `Apply changes to this project now?`
- **且** 如果确认，为当前项目运行 `openspec update`

### 需求：键命名约定

config 命令应当使用与 JSON 结构匹配的驼峰命名键。

#### 场景：键匹配 JSON 结构

- **当** 通过 CLI 访问配置键时
- **则** 使用与实际 JSON 属性名匹配的驼峰命名
- **且** 支持嵌套访问的点号表示法（例如 `featureFlags.someFlag`）

### 需求：模式验证

config 命令应当使用 zod 根据配置模式验证配置写入，同时拒绝 `config set` 的未知键，除非显式覆盖。

#### 场景：默认拒绝未知键

- **当** 用户执行 `openspec config set someFutureKey 123` 时
- **则** 显示描述性错误消息指示键无效
- **且** 不修改配置文件
- **且** 以代码 1 退出

#### 场景：使用覆盖接受未知键

- **当** 用户执行 `openspec config set someFutureKey 123 --allow-unknown` 时
- **则** 值成功保存
- **且** 以代码 0 退出

#### 场景：拒绝无效的功能标志值

- **当** 用户执行 `openspec config set featureFlags.someFlag notABoolean` 时
- **则** 显示描述性错误消息
- **且** 不修改配置文件
- **且** 以代码 1 退出

### 需求：保留的作用域标志

config 命令应当为未来扩展性保留 `--scope` 标志。

#### 场景：作用域标志默认为全局

- **当** 用户执行任何 config 命令而不带 `--scope` 时
- **则** 操作全局配置（默认行为）

#### 场景：项目作用域尚未实现

- **当** 用户执行 `openspec config --scope project <subcommand>` 时
- **则** 显示错误消息："Project-local config is not yet implemented"
- **且** 以代码 1 退出
