# cli-completion 规范

## 目的
为 OpenSpec CLI 提供 Shell 补全脚本，支持命令、标志和动态值（变更 ID、规范 ID）的 Tab 键补全。支持 Zsh、Bash、Fish 和 PowerShell。

## 需求
### 需求：原生 Shell 行为集成

补全系统应当尊重并集成每个支持的 Shell 的原生补全模式和用户交互模型。

#### 场景：Zsh 原生补全

- **当** 生成 Zsh 补全脚本时
- **则** 使用 Zsh 补全系统的 `_arguments`、`_describe` 和 `compadd`
- **且** 补全应当在单次 TAB 按键时触发（标准 Zsh 行为）
- **且** 显示为用户可用 TAB/方向键导航的交互式菜单
- **且** 自动支持 Oh My Zsh 的增强菜单样式

#### 场景：Bash 原生补全

- **当** 生成 Bash 补全脚本时
- **则** 使用 Bash 补全的 `complete` 内置命令和 `COMPREPLY` 数组
- **且** 补全应当在双击 TAB 时触发（标准 Bash 行为）
- **且** 显示为空格分隔的列表或列格式
- **且** 支持 bash-completion v1 和 v2 模式

#### 场景：Fish 原生补全

- **当** 生成 Fish 补全脚本时
- **则** 使用 Fish 的 `complete` 命令配合条件
- **且** 补全应当在单次 TAB 按键时触发，带有自动建议预览
- **且** 使用 Fish 原生的着色和描述对齐显示
- **且** 自动利用 Fish 的内置缓存

#### 场景：PowerShell 原生补全

- **当** 生成 PowerShell 补全脚本时
- **则** 使用 `Register-ArgumentCompleter` 配合脚本块
- **且** 补全应当在 TAB 按键时触发，带有循环行为
- **且** 使用 PowerShell 原生补全 UI 显示
- **且** 支持 Windows PowerShell 5.1 和 PowerShell Core 7+

#### 场景：不使用自定义 UX 模式

- **当** 为任何 Shell 实现补全时
- **则** 不要尝试自定义补全触发行为
- **且** 不要覆盖 Shell 特定的导航模式
- **且** 确保补全对该 Shell 的熟练用户感觉原生

### 需求：命令结构

补全命令应当遵循子命令模式来生成和管理补全脚本。

#### 场景：可用子命令

- **当** 用户执行 `openspec completion --help` 时
- **则** 显示可用子命令：
  - `generate [shell]` - 为指定 Shell 生成补全脚本（输出到 stdout）
  - `install [shell]` - 为 Zsh 安装补全（自动检测或需要显式指定 Shell）
  - `uninstall [shell]` - 移除 Zsh 的补全（自动检测或需要显式指定 Shell）

### 需求：Shell 检测

补全系统应当自动检测用户当前的 Shell 环境。

#### 场景：从环境检测 Zsh

- **当** 未显式指定 Shell 时
- **则** 读取 `$SHELL` 环境变量
- **且** 从路径提取 Shell 名称（例如 `/bin/zsh` → `zsh`）
- **且** 验证 Shell 是以下之一：`zsh`、`bash`、`fish`、`powershell`
- **且** 如果 Shell 不支持则抛出错误

#### 场景：从环境检测 Bash

- **当** `$SHELL` 路径中包含 `bash` 时
- **则** 检测 Shell 为 `bash`
- **且** 继续执行 bash 特定的补全逻辑

#### 场景：从环境检测 Fish

- **当** `$SHELL` 路径中包含 `fish` 时
- **则** 检测 Shell 为 `fish`
- **且** 继续执行 fish 特定的补全逻辑

#### 场景：从环境检测 PowerShell

- **当** 存在 `$PSModulePath` 环境变量时
- **则** 检测 Shell 为 `powershell`
- **且** 继续执行 PowerShell 特定的补全逻辑

#### 场景：不支持的 Shell 检测

- **当** Shell 路径指示不支持的 Shell 时
- **则** 抛出错误："Shell '<name>' is not supported. Supported shells: zsh, bash, fish, powershell"

### 需求：补全生成

补全命令应当按需为所有支持的 Shell 生成补全脚本。

#### 场景：生成 Zsh 补全

- **当** 用户执行 `openspec completion generate zsh` 时
- **则** 向 stdout 输出完整的 Zsh 补全脚本
- **且** 包含所有命令的补全：init、list、show、validate、archive、view、update、change、spec、completion
- **且** 包含所有命令特定的标志和选项
- **且** 使用 Zsh 的 `_arguments` 和 `_describe` 内置函数
- **且** 支持变更和规范 ID 的动态补全

#### 场景：生成 Bash 补全

- **当** 用户执行 `openspec completion generate bash` 时
- **则** 向 stdout 输出完整的 Bash 补全脚本
- **且** 包含所有命令和子命令的补全
- **且** 使用 `complete -F` 配合自定义补全函数
- **且** 用适当的建议填充 `COMPREPLY`
- **且** 通过 `openspec __complete` 支持变更和规范 ID 的动态补全

#### 场景：生成 Fish 补全

- **当** 用户执行 `openspec completion generate fish` 时
- **则** 向 stdout 输出完整的 Fish 补全脚本
- **且** 使用 `complete -c openspec` 配合条件
- **且** 包含带有 `--condition` 谓词的命令特定补全
- **且** 通过 `openspec __complete` 支持变更和规范 ID 的动态补全
- **且** 为每个补全选项包含描述

#### 场景：生成 PowerShell 补全

- **当** 用户执行 `openspec completion generate powershell` 时
- **则** 向 stdout 输出完整的 PowerShell 补全脚本
- **且** 使用 `Register-ArgumentCompleter -CommandName openspec`
- **且** 实现处理命令上下文的脚本块
- **且** 通过 `openspec __complete` 支持变更和规范 ID 的动态补全
- **且** 返回 `[System.Management.Automation.CompletionResult]` 对象

### 需求：动态补全

补全系统应当为项目特定值提供上下文感知的动态补全。

#### 场景：补全变更 ID

- **当** 为接受变更名称的命令（show、validate、archive）补全参数时
- **则** 从 `openspec/changes/` 目录发现活跃变更
- **且** 排除 `openspec/changes/archive/` 中的已归档变更
- **且** 返回变更 ID 作为补全建议
- **且** 仅在 OpenSpec 启用的项目内部提供建议

#### 场景：补全规范 ID

- **当** 为接受规范名称的命令（show、validate）补全参数时
- **则** 从 `openspec/specs/` 目录发现规范
- **且** 返回规范 ID 作为补全建议
- **且** 仅在 OpenSpec 启用的项目内部提供建议

#### 场景：补全缓存

- **当** 请求动态补全时
- **则** 缓存发现的变更和规范 ID 2 秒
- **且** 在缓存窗口内为后续请求重用缓存值
- **且** 过期后自动刷新缓存

#### 场景：项目检测

- **当** 用户在 OpenSpec 项目外部请求补全时
- **则** 跳过动态变更/规范 ID 补全
- **且** 仅建议静态命令和标志

### 需求：安装自动化

补全命令应当自动将补全脚本安装到所有支持的 Shell 的配置文件中。

#### 场景：为 Oh My Zsh 安装

- **当** 用户执行 `openspec completion install zsh` 时
- **则** 通过检查 `$ZSH` 环境变量或 `~/.oh-my-zsh/` 目录来检测是否安装了 Oh My Zsh
- **且** 如果不存在则在 `~/.oh-my-zsh/custom/completions/` 创建自定义补全目录
- **且** 将补全脚本写入 `~/.oh-my-zsh/custom/completions/_openspec`
- **且** 如果需要则通过更新 `~/.zshrc` 确保 `~/.oh-my-zsh/custom/completions` 在 `$fpath` 中
- **且** 显示成功消息，指示运行 `exec zsh` 或重启终端

#### 场景：为标准 Zsh 安装

- **当** 用户执行 `openspec completion install zsh` 且未检测到 Oh My Zsh 时
- **则** 如果不存在则在 `~/.zsh/completions/` 创建补全目录
- **且** 将补全脚本写入 `~/.zsh/completions/_openspec`
- **且** 如果尚未存在则向 `~/.zshrc` 添加 `fpath=(~/.zsh/completions $fpath)`
- **且** 如果尚未存在则向 `~/.zshrc` 添加 `autoload -Uz compinit && compinit`
- **且** 显示成功消息，指示运行 `exec zsh` 或重启终端

#### 场景：为带有 bash-completion 的 Bash 安装

- **当** 用户执行 `openspec completion install bash` 时
- **则** 通过检查 `/usr/share/bash-completion` 或 `/etc/bash_completion.d` 来检测是否安装了 bash-completion
- **且** 如果 bash-completion 可用，写入 `/etc/bash_completion.d/openspec`（使用 sudo）或 `~/.local/share/bash-completion/completions/openspec`
- **且** 如果 bash-completion 不可用，写入 `~/.bash_completion.d/openspec` 并从 `~/.bashrc` 加载它
- **且** 如果需要则使用基于标记的更新向 `~/.bashrc` 添加加载行
- **且** 显示成功消息，指示运行 `exec bash` 或重启终端

#### 场景：为 Fish 安装

- **当** 用户执行 `openspec completion install fish` 时
- **则** 如果不存在则在 `~/.config/fish/completions/` 创建 Fish 补全目录
- **且** 将补全脚本写入 `~/.config/fish/completions/openspec.fish`
- **且** Fish 自动从此目录加载补全（无需修改配置文件）
- **且** 显示成功消息，指示补全立即可用

#### 场景：为 PowerShell 安装

- **当** 用户执行 `openspec completion install powershell` 时
- **则** 通过 `$PROFILE` 环境变量或默认路径检测 PowerShell 配置文件位置
- **且** 如果不存在则创建配置文件目录
- **且** 使用基于标记的更新向配置文件添加补全脚本导入
- **且** 将补全脚本写入 PowerShell 模块目录或配置文件旁边
- **且** 显示成功消息，指示重启 PowerShell 或运行 `. $PROFILE`

#### 场景：自动检测安装的 Shell

- **当** 用户执行 `openspec completion install` 而未指定 Shell 时
- **则** 使用 Shell 检测逻辑检测当前 Shell
- **且** 为检测到的 Shell（zsh、bash、fish 或 powershell）安装补全
- **且** 显示检测到的 Shell

#### 场景：已安装

- **当** 目标 Shell 的补全已安装时
- **则** 显示消息指示补全已安装
- **且** 提供通过覆盖现有文件来重新安装/更新的选项
- **且** 以代码 0 退出

### 需求：卸载

补全命令应当移除所有支持的 Shell 的已安装补全脚本和配置。

#### 场景：卸载 Zsh 补全

- **当** 用户执行 `openspec completion uninstall zsh` 时
- **则** 在继续之前提示确认（除非提供了 `--yes` 标志）
- **且** 如果用户拒绝，取消卸载并显示 "Uninstall cancelled."
- **且** 如果用户确认，移除 `~/.oh-my-zsh/custom/completions/_openspec`（如果检测到 Oh My Zsh）
- **且** 移除 `~/.zsh/completions/_openspec`（如果检测到标准 Zsh 设置）
- **且** 使用基于标记的移除从 `~/.zshrc` 移除 fpath 修改
- **且** 显示成功消息

#### 场景：卸载 Bash 补全

- **当** 用户执行 `openspec completion uninstall bash` 时
- **则** 提示确认（除非提供了 `--yes` 标志）
- **且** 如果用户确认，从 bash-completion 目录或 `~/.bash_completion.d/` 移除补全文件
- **且** 使用基于标记的移除从 `~/.bashrc` 移除加载行
- **且** 显示成功消息

#### 场景：卸载 Fish 补全

- **当** 用户执行 `openspec completion uninstall fish` 时
- **则** 提示确认（除非提供了 `--yes` 标志）
- **且** 如果用户确认，移除 `~/.config/fish/completions/openspec.fish`
- **且** 显示成功消息（无需修改配置文件）

#### 场景：卸载 PowerShell 补全

- **当** 用户执行 `openspec completion uninstall powershell` 时
- **则** 提示确认（除非提供了 `--yes` 标志）
- **且** 如果用户确认，使用基于标记的移除从 PowerShell 配置文件移除补全导入
- **且** 移除补全脚本文件
- **且** 显示成功消息

#### 场景：自动检测卸载的 Shell

- **当** 用户执行 `openspec completion uninstall` 而未指定 Shell 时
- **则** 检测当前 Shell 并为该 Shell 卸载补全

#### 场景：未安装

- **当** 尝试卸载未安装的补全时
- **则** 显示错误消息指示补全未安装
- **且** 以代码 1 退出

### 需求：架构模式

补全实现应当遵循清洁架构原则和 TypeScript 最佳实践，通过基于插件的模式支持多个 Shell。

#### 场景：Shell 特定生成器

- **当** 实现补全生成器时
- **则** 为每个 Shell 创建生成器类：`ZshGenerator`、`BashGenerator`、`FishGenerator`、`PowerShellGenerator`
- **且** 实现通用的 `CompletionGenerator` 接口，包含方法：
  - `generate(commands: CommandDefinition[]): string` - 返回完整的 Shell 脚本
- **且** 每个生成器处理 Shell 特定的语法、转义和模式
- **且** 所有生成器从命令注册表消费相同的 `CommandDefinition[]`

#### 场景：Shell 特定安装器

- **当** 实现补全安装器时
- **则** 为每个 Shell 创建安装器类：`ZshInstaller`、`BashInstaller`、`FishInstaller`、`PowerShellInstaller`
- **且** 实现通用的 `CompletionInstaller` 接口，包含方法：
  - `install(script: string): Promise<InstallationResult>` - 安装补全脚本
  - `uninstall(): Promise<{ success: boolean; message: string }>` - 移除补全
- **且** 每个安装器处理 Shell 特定的路径、配置文件和安装模式

#### 场景：Shell 选择的工厂模式

- **当** 选择 Shell 特定实现时
- **则** 使用 `CompletionFactory` 类的静态方法：
  - `createGenerator(shell: SupportedShell): CompletionGenerator`
  - `createInstaller(shell: SupportedShell): CompletionInstaller`
- **且** 工厂使用带有 TypeScript 穷尽性检查的 switch 语句
- **且** 添加新 Shell 需要更新 `SupportedShell` 类型和工厂 case

#### 场景：动态补全提供者

- **当** 实现动态补全时
- **则** 创建封装项目发现逻辑的 `CompletionProvider` 类
- **且** 实现方法：
  - `getChangeIds(): Promise<string[]>` - 发现活跃变更 ID
  - `getSpecIds(): Promise<string[]>` - 发现规范 ID
  - `isOpenSpecProject(): boolean` - 检查当前目录是否启用了 OpenSpec
- **且** 使用类属性实现 2 秒 TTL 的缓存

#### 场景：命令注册表

- **当** 定义可补全的命令时
- **则** 创建集中的 `CommandDefinition` 类型，包含属性：
  - `name: string` - 命令名称
  - `description: string` - 帮助文本
  - `flags: FlagDefinition[]` - 可用标志
  - `acceptsPositional: boolean` - 命令是否接受位置参数
  - `positionalType: string` - 位置参数类型（change-id、spec-id、path、shell）
  - `subcommands?: CommandDefinition[]` - 嵌套子命令
- **且** 导出包含所有命令定义的 `COMMAND_REGISTRY` 常量
- **且** 所有生成器消费此注册表以确保跨 Shell 的一致性

#### 场景：类型安全的 Shell 检测

- **当** 实现 Shell 检测时
- **则** 定义 `SupportedShell` 类型为字面量类型：`'zsh' | 'bash' | 'fish' | 'powershell'`
- **且** 在 `src/utils/shell-detection.ts` 中实现 `detectShell()` 函数
- **且** 返回检测到的 Shell 或抛出包含支持的 Shell 列表的错误

### 需求：错误处理

补全命令应当为常见失败场景提供清晰的错误消息。

#### 场景：不支持的 Shell

- **当** 用户请求不支持的 Shell（例如 ksh、csh、tcsh）的补全时
- **则** 显示错误消息："Shell '<name>' is not supported yet. Currently supported: zsh, bash, fish, powershell"
- **且** 以代码 1 退出

#### 场景：安装期间的权限错误

- **当** 安装因文件权限问题失败时
- **则** 显示清晰的错误消息指示权限问题
- **且** 建议使用适当的权限或替代安装方法
- **且** 以代码 1 退出

#### 场景：缺少 Shell 配置目录

- **当** 预期的 Shell 配置目录不存在时
- **则** 自动创建目录（通知用户）
- **且** 继续安装

#### 场景：未检测到 Shell

- **当** `openspec completion install` 无法检测当前 Shell 时
- **则** 显示错误："Could not auto-detect shell. Please specify shell explicitly."
- **且** 显示使用提示："Usage: openspec completion <operation> [shell]"
- **且** 以代码 1 退出

### 需求：输出格式

补全命令应当提供机器可解析和人类可读的输出。

#### 场景：脚本生成输出

- **当** 向 stdout 生成补全脚本时
- **则** 仅输出补全脚本内容（无额外消息）
- **且** 允许重定向到文件：`openspec completion generate zsh > /path/to/_openspec`

#### 场景：安装成功输出

- **当** 安装成功完成时
- **则** 显示格式化的成功消息，包含：
  - 勾选标记指示器
  - 安装位置
  - 后续步骤（Shell 重新加载指示）
- **且** 当终端支持时使用颜色（除非设置了 `--no-color`）

#### 场景：详细安装输出

- **当** 用户在安装期间提供 `--verbose` 标志时
- **则** 显示详细步骤：
  - Shell 检测结果
  - 目标文件路径
  - 配置修改
  - 文件创建确认

### 需求：测试支持

补全实现应当可通过所有支持的 Shell 的单元测试和集成测试进行测试。

#### 场景：模拟 Shell 环境

- **当** 为 Shell 检测编写测试时
- **则** 允许覆盖 `$SHELL` 和 `$PSModulePath` 环境变量
- **且** 对文件系统操作使用依赖注入
- **且** 独立测试所有四个 Shell 的检测

#### 场景：生成器输出验证

- **当** 测试补全生成器时
- **则** 为每个 Shell 生成器（zsh、bash、fish、powershell）创建测试套件
- **且** 验证生成的脚本包含该 Shell 的预期模式
- **且** 测试命令注册表被正确消费
- **且** 确保存在动态补全占位符
- **且** 验证 Shell 特定的语法和转义

#### 场景：安装器模拟

- **当** 测试安装逻辑时
- **则** 为每个 Shell 安装器创建测试套件
- **且** 使用临时测试目录而不是实际主目录
- **且** 验证文件创建而不修改真实的 Shell 配置
- **且** 独立测试路径解析逻辑
- **且** 模拟文件系统操作以避免副作用

#### 场景：跨 Shell 一致性

- **当** 测试补全行为时
- **则** 验证所有 Shell 支持相同的命令和标志
- **且** 验证动态补全在跨 Shell 时一致工作
- **且** 确保错误消息在跨 Shell 时一致

