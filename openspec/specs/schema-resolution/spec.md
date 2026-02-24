# schema-resolution 规范

## 目的
定义项目本地模式解析行为，包括优先级顺序（项目本地，然后用户覆盖，然后包内置）以及在未提供 `projectRoot` 时的向后兼容回退。

## 需求
### 需求：项目本地模式解析

当提供 `projectRoot` 时，系统应当以最高优先级从项目本地目录（`./openspec/schemas/<name>/`）解析模式。

#### 场景：项目本地模式优先于用户覆盖
- **当** 名为 "my-workflow" 的模式存在于 `./openspec/schemas/my-workflow/schema.yaml` 时
- **且** 名为 "my-workflow" 的模式存在于 `~/.local/share/openspec/schemas/my-workflow/schema.yaml` 时
- **且** 调用 `getSchemaDir("my-workflow", projectRoot)`
- **则** 系统应当返回项目本地路径

#### 场景：项目本地模式优先于包内置
- **当** 名为 "spec-driven" 的模式存在于 `./openspec/schemas/spec-driven/schema.yaml` 时
- **且** "spec-driven" 是包内置模式
- **且** 调用 `getSchemaDir("spec-driven", projectRoot)`
- **则** 系统应当返回项目本地路径

#### 场景：无项目本地模式时回退到用户覆盖
- **当** `./openspec/schemas/my-workflow/` 不存在名为 "my-workflow" 的模式时
- **且** 名为 "my-workflow" 的模式存在于 `~/.local/share/openspec/schemas/my-workflow/schema.yaml` 时
- **且** 调用 `getSchemaDir("my-workflow", projectRoot)`
- **则** 系统应当返回用户覆盖路径

#### 场景：无项目本地或用户模式时回退到包内置
- **当** `./openspec/schemas/spec-driven/` 不存在名为 "spec-driven" 的模式时
- **且** `~/.local/share/openspec/schemas/spec-driven/` 不存在名为 "spec-driven" 的模式时
- **且** "spec-driven" 是包内置模式
- **且** 调用 `getSchemaDir("spec-driven", projectRoot)`
- **则** 系统应当返回包内置路径

#### 场景：未提供 projectRoot 时的向后兼容性
- **当** 不带 `projectRoot` 参数调用 `getSchemaDir("my-workflow")` 时
- **则** 系统应当仅检查用户覆盖和包内置位置
- **且** 系统不应当检查项目本地位置

### 需求：项目模式目录辅助函数

系统应当提供 `getProjectSchemasDir(projectRoot)` 函数，返回项目本地模式目录路径。

#### 场景：返回正确路径
- **当** 调用 `getProjectSchemasDir("/path/to/project")` 时
- **则** 系统应当返回 `/path/to/project/openspec/schemas`

### 需求：列出模式包含项目本地

如果提供了 `projectRoot`，系统应当在列出可用模式时包含项目本地模式。

#### 场景：项目本地模式出现在列表中
- **当** 名为 "team-flow" 的模式存在于 `./openspec/schemas/team-flow/schema.yaml` 时
- **且** 调用 `listSchemas(projectRoot)`
- **则** 返回的列表应当包含 "team-flow"

#### 场景：项目本地模式在列表中遮蔽同名用户模式
- **当** 名为 "custom" 的模式同时存在于项目本地和用户覆盖位置时
- **且** 调用 `listSchemas(projectRoot)`
- **则** 返回的列表应当恰好包含一次 "custom"

#### 场景：listSchemas 的向后兼容性
- **当** 不带 `projectRoot` 参数调用 `listSchemas()` 时
- **则** 系统应当仅包含用户覆盖和包内置模式

### 需求：模式信息包含项目来源

系统应当在 `listSchemasWithInfo()` 结果中为项目本地模式指示 `source: 'project'`。

#### 场景：项目本地模式显示项目来源
- **当** 名为 "team-flow" 的模式存在于 `./openspec/schemas/team-flow/schema.yaml` 时
- **且** 调用 `listSchemasWithInfo(projectRoot)`
- **则** "team-flow" 的模式信息应当有 `source: 'project'`

#### 场景：用户覆盖模式显示用户来源
- **当** 名为 "my-custom" 的模式仅存在于 `~/.local/share/openspec/schemas/my-custom/` 时
- **且** 调用 `listSchemasWithInfo(projectRoot)`
- **则** "my-custom" 的模式信息应当有 `source: 'user'`

#### 场景：包内置模式显示包来源
- **当** "spec-driven" 仅作为包内置存在时
- **且** 调用 `listSchemasWithInfo(projectRoot)`
- **则** "spec-driven" 的模式信息应当有 `source: 'package'`

### 需求：Schemas 命令显示来源

`openspec schemas` 命令应当显示每个模式的来源。

#### 场景：显示格式包含来源
- **当** 用户运行 `openspec schemas` 时
- **则** 输出应当显示每个模式及其来源标签（project、user 或 package）

### 需求：使用配置模式作为新变更的默认值

系统应当在创建新变更时使用 `openspec/config.yaml` 中的 schema 字段作为默认值（如果没有显式 `--schema` 标志）。

#### 场景：创建变更时无 --schema 标志且配置存在
- **当** 用户运行 `openspec new change foo` 且配置包含 `schema: "tdd"` 时
- **则** 系统使用模式 "tdd" 创建变更

#### 场景：创建变更时无 --schema 标志且无配置
- **当** 用户运行 `openspec new change foo` 且不存在配置文件时
- **则** 系统使用默认模式 "spec-driven" 创建变更

#### 场景：创建变更时有显式 --schema 标志
- **当** 用户运行 `openspec new change foo --schema custom` 且配置包含 `schema: "tdd"` 时
- **则** 系统使用模式 "custom" 创建变更（CLI 标志覆盖配置）

### 需求：使用更新的优先级顺序解析模式

系统应当使用以下优先级顺序解析变更的模式：CLI 标志、变更元数据、项目配置、硬编码默认值。

#### 场景：提供了 CLI 标志
- **当** 用户运行命令时带有 `--schema custom`
- **则** 系统使用 "custom"，无论变更元数据或配置如何

#### 场景：变更元数据指定模式
- **当** 变更有 `.openspec.yaml` 且包含 `schema: bound`，配置有 `schema: tdd` 时
- **则** 系统使用来自变更元数据的 "bound"

#### 场景：仅项目配置指定模式
- **当** 没有 CLI 标志或变更元数据，但配置有 `schema: tdd` 时
- **则** 系统使用来自项目配置的 "tdd"

#### 场景：任何地方都未指定模式
- **当** 没有 CLI 标志、变更元数据或项目配置时
- **则** 系统使用硬编码默认值 "spec-driven"

### 需求：配置中支持项目本地模式名称

系统应当允许配置 schema 字段引用定义在 `openspec/schemas/` 中的项目本地模式。

#### 场景：配置引用项目本地模式
- **当** 配置包含 `schema: "my-workflow"` 且 `openspec/schemas/my-workflow/` 存在时
- **则** 系统解析到项目本地模式

#### 场景：配置引用不存在的模式
- **当** 配置包含 `schema: "nonexistent"` 且该模式不存在时
- **则** 系统在尝试加载模式时显示错误，带有模糊匹配建议和所有有效模式列表

### 需求：为无效模式提供有用的错误消息

系统应当显示模式错误，包含模糊匹配建议、可用模式列表和修复指示。

#### 场景：模式名称有拼写错误（接近匹配）
- **当** 配置包含 `schema: "spce-driven"`（拼写错误）时
- **则** 错误消息包含 "Did you mean: spec-driven (built-in)" 作为建议

#### 场景：模式名称无接近匹配
- **当** 配置包含 `schema: "completely-wrong"` 时
- **则** 错误消息显示所有可用的内置和项目本地模式列表

#### 场景：错误消息包含修复指示
- **当** 配置引用无效模式时
- **则** 错误消息包含 "Fix: Edit openspec/config.yaml and change 'schema: X' to a valid schema name"

#### 场景：错误区分内置与项目本地模式
- **当** 错误列出可用模式时
- **则** 输出清楚地标记每个为 "built-in" 或 "project-local"

### 需求：保持现有变更的向后兼容性

系统应当继续与没有项目配置的现有变更一起工作。

#### 场景：无配置的现有变更
- **当** 变更在配置功能之前创建且不存在配置文件时
- **则** 系统使用现有逻辑解析模式（变更元数据或硬编码默认值）

#### 场景：后来添加配置的现有变更
- **当** 配置文件被添加到带有现有变更的项目时
- **则** 现有变更继续使用其 `.openspec.yaml` 中绑定的模式
