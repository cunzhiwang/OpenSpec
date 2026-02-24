# CLI 产物工作流规范

## 目的
定义脚手架和活动变更的产物工作流 CLI 行为（`status`、`instructions`、`templates` 和设置流程）。

## 需求
### 需求：状态命令

系统应当为变更显示产物完成状态，包括脚手架（空）变更。

> **修复 bug**：之前通过 `getActiveChangeIds()` 要求存在 `proposal.md`。

#### 场景：显示所有状态

- **当** 用户运行 `openspec status --change <id>` 时
- **则** 系统为每个产物显示状态指示器：
  - `[x]` 表示已完成的产物
  - `[ ]` 表示就绪的产物
  - `[-]` 表示被阻塞的产物（列出缺失的依赖）

#### 场景：状态显示完成摘要

- **当** 用户运行 `openspec status --change <id>` 时
- **则** 输出包含完成百分比和计数（例如 "2/4 个产物完成"）

#### 场景：状态 JSON 输出

- **当** 用户运行 `openspec status --change <id> --json` 时
- **则** 系统输出包含 changeName、schemaName、isComplete 和 artifacts 数组的 JSON

#### 场景：状态 JSON 包含应用需求

- **当** 用户运行 `openspec status --change <id> --json` 时
- **则** 系统输出 JSON，包含：
  - `changeName`、`schemaName`、`isComplete`、`artifacts` 数组
  - `applyRequires`：应用阶段所需的产物 ID 数组

#### 场景：脚手架变更的状态

- **当** 用户在没有产物的变更上运行 `openspec status --change <id>` 时
- **则** 系统显示所有产物及其状态
- **并且** 根产物（无依赖）显示为就绪 `[ ]`
- **并且** 依赖产物显示为阻塞 `[-]`

#### 场景：缺少变更参数

- **当** 用户运行 `openspec status` 而不带 `--change` 时
- **则** 系统显示错误，列出可用变更
- **并且** 包括脚手架变更（没有 proposal.md 的目录）

#### 场景：未知变更

- **当** 用户运行 `openspec status --change unknown-id` 时
- **并且** 目录 `openspec/changes/unknown-id/` 不存在时
- **则** 系统显示错误，列出所有可用的变更目录

### 需求：下一个产物发现

工作流应当使用 `openspec status` 输出来确定接下来可以创建什么，而不是单独的 next 命令界面。

#### 场景：从状态输出发现下一个产物

- **当** 用户需要知道接下来创建哪个产物时
- **则** `openspec status --change <id>` 用 `[ ]` 标识就绪产物
- **并且** 不需要专门的"next 命令"来继续工作流

### 需求：指令命令

系统应当输出用于创建产物的丰富指令，包括脚手架变更。

#### 场景：显示丰富指令

- **当** 用户运行 `openspec instructions <artifact> --change <id>` 时
- **则** 系统输出：
  - 产物元数据（ID、输出路径、描述）
  - 模板内容
  - 依赖状态（已完成/缺失）
  - 解锁的产物（完成后可用的产物）

#### 场景：指令 JSON 输出

- **当** 用户运行 `openspec instructions <artifact> --change <id> --json` 时
- **则** 系统输出匹配 ArtifactInstructions 接口的 JSON

#### 场景：未知产物

- **当** 用户运行 `openspec instructions unknown-artifact --change <id>` 时
- **则** 系统显示错误，列出模式的有效产物 ID

#### 场景：有未满足依赖的产物

- **当** 用户请求被阻塞产物的指令时
- **则** 系统显示指令并警告缺失依赖

#### 场景：脚手架变更的指令

- **当** 用户在脚手架变更上运行 `openspec instructions proposal --change <id>` 时
- **则** 系统输出创建提案的模板和元数据
- **并且** 不要求已存在任何产物

### 需求：模板命令
系统应当显示模式中所有产物的已解析模板路径。

#### 场景：使用默认模式列出模板路径
- **当** 用户运行 `openspec templates` 时
- **则** 系统使用默认模式显示每个产物的已解析模板路径

#### 场景：使用自定义模式列出模板路径
- **当** 用户运行 `openspec templates --schema tdd` 时
- **则** 系统显示指定模式的模板路径

#### 场景：模板 JSON 输出
- **当** 用户运行 `openspec templates --json` 时
- **则** 系统输出将产物 ID 映射到模板路径的 JSON

#### 场景：模板解析来源
- **当** 显示模板路径时
- **则** 系统指示每个模板是来自用户覆盖还是包内置

### 需求：新变更命令
系统应当创建带有验证的新变更目录。

#### 场景：创建有效变更
- **当** 用户运行 `openspec new change add-feature` 时
- **则** 系统创建 `openspec/changes/add-feature/` 目录

#### 场景：无效变更名称
- **当** 用户使用无效名称运行 `openspec new change "Add Feature"` 时
- **则** 系统显示验证错误和指导

#### 场景：重复变更名称
- **当** 用户为现有变更运行 `openspec new change existing-change` 时
- **则** 系统显示错误，表明变更已存在

#### 场景：带描述创建
- **当** 用户运行 `openspec new change add-feature --description "Add new feature"` 时
- **则** 系统创建变更目录，在 README.md 中包含描述

### 需求：模式选择
系统应当支持工作流命令的自定义模式选择。

#### 场景：默认模式
- **当** 用户运行不带 `--schema` 的工作流命令时
- **则** 系统使用 "spec-driven" 模式

#### 场景：自定义模式
- **当** 用户运行 `openspec status --change <id> --schema tdd` 时
- **则** 系统使用指定的模式作为产物图

#### 场景：未知模式
- **当** 用户指定未知模式时
- **则** 系统显示错误，列出可用模式

### 需求：输出格式化
系统应当提供一致的输出格式化。

#### 场景：彩色输出
- **当** 终端支持颜色时
- **则** 状态指示器使用颜色：绿色（完成）、黄色（就绪）、红色（阻塞）

#### 场景：无颜色输出
- **当** 使用 `--no-color` 标志或设置了 NO_COLOR 环境变量时
- **则** 输出使用纯文本指示器，不使用 ANSI 颜色

#### 场景：进度指示
- **当** 加载变更状态需要时间时
- **则** 系统在加载期间显示加载动画

### 需求：实验性隔离
系统应当在隔离中实现产物工作流命令，以便于移除。

#### 场景：单文件实现
- **当** 实现产物工作流功能时
- **则** 所有命令都在 `src/commands/artifact-workflow.ts` 中

#### 场景：帮助文本标记
- **当** 用户在任何产物工作流命令上运行 `--help` 时
- **则** 帮助文本表明该命令是实验性的

### 需求：模式 Apply 块

系统应当支持模式定义中的 `apply` 块，控制何时以及如何开始实现。

#### 场景：带 apply 块的模式

- **当** 模式定义了 `apply` 块时
- **则** 系统使用 `apply.requires` 来确定应用前必须存在哪些产物
- **并且** 使用 `apply.tracks` 来识别用于进度跟踪的文件（或如果没有则为 null）
- **并且** 使用 `apply.instruction` 显示给代理的指导

#### 场景：没有 apply 块的模式

- **当** 模式没有 `apply` 块时
- **则** 系统要求所有产物存在后才能应用
- **并且** 使用默认指令："所有产物已完成。继续实现。"

### 需求：Apply 指令命令

系统应当通过 `openspec instructions apply` 生成模式感知的应用指令。

#### 场景：生成 apply 指令

- **当** 用户运行 `openspec instructions apply --change <id>` 时
- **并且** 所有必需产物（按模式的 `apply.requires`）存在时
- **则** 系统输出：
  - 所有现有产物的上下文文件
  - 模式特定的指令文本
  - 进度跟踪文件路径（如果设置了 `apply.tracks`）

#### 场景：Apply 被缺失产物阻塞

- **当** 用户运行 `openspec instructions apply --change <id>` 时
- **并且** 缺少必需产物时
- **则** 系统指示 apply 被阻塞
- **并且** 列出必须先创建的产物

#### 场景：Apply 指令 JSON 输出

- **当** 用户运行 `openspec instructions apply --change <id> --json` 时
- **则** 系统输出 JSON，包含：
  - `contextFiles`：现有产物路径数组
  - `instruction`：apply 指令文本
  - `tracks`：进度文件路径或 null
  - `applyRequires`：必需产物 ID 列表

### 需求：工具选择标志

`artifact-experimental-setup` 命令应当接受 `--tool <tool-id>` 标志来指定目标 AI 工具。

#### 场景：通过标志指定工具

- **当** 用户运行 `openspec artifact-experimental-setup --tool cursor` 时
- **则** 技能文件生成在 `.cursor/skills/`
- **并且** 命令文件使用 Cursor 的 frontmatter 格式生成

#### 场景：缺少工具标志

- **当** 用户运行 `openspec artifact-experimental-setup` 而不带 `--tool` 时
- **则** 系统显示错误，要求 `--tool` 标志
- **并且** 在错误消息中列出有效的工具 ID

#### 场景：未知工具 ID

- **当** 用户运行 `openspec artifact-experimental-setup --tool unknown-tool` 时
- **并且** 工具 ID 不在 `AI_TOOLS` 中时
- **则** 系统显示错误，列出有效的工具 ID

#### 场景：没有 skillsDir 的工具

- **当** 用户指定没有配置 `skillsDir` 的工具时
- **则** 系统显示错误，表明该工具不支持技能生成

#### 场景：没有命令适配器的工具

- **当** 用户指定有 `skillsDir` 但没有注册命令适配器的工具时
- **则** 技能文件成功生成
- **并且** 命令生成被跳过，显示信息消息

### 需求：输出消息

设置命令应当显示关于生成内容的清晰输出。

#### 场景：在输出中显示目标工具

- **当** 设置命令成功运行时
- **则** 输出包含目标工具名称（例如 "正在为 Cursor 设置..."）

#### 场景：显示生成的路径

- **当** 设置命令完成时
- **则** 输出列出所有生成的技能文件路径
- **并且** 列出所有生成的命令文件路径（如果适用）

#### 场景：显示跳过命令消息

- **当** 因缺少适配器而跳过命令生成时
- **则** 输出包含消息："命令生成已跳过 - <tool> 没有适配器"
