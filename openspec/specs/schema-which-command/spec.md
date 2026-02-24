# schema-which-command 规范

## 目的
定义 `openspec schema which` 行为，用于报告已解析的模式来源、位置和回退详情。

## 需求
### 需求：Schema which 显示解析结果
CLI 应当提供 `openspec schema which <name>` 命令，显示模式从哪里解析。

#### 场景：模式从项目解析
- **当** 用户运行 `openspec schema which my-workflow` 且模式存在于 `openspec/schemas/my-workflow/` 时
- **则** 系统显示来源为 "project"
- **且** 显示模式目录的完整路径

#### 场景：模式从用户目录解析
- **当** 用户运行 `openspec schema which my-workflow` 且模式仅存在于用户数据目录时
- **则** 系统显示来源为 "user"
- **且** 显示包含 XDG 数据目录的完整路径

#### 场景：模式从包解析
- **当** 用户运行 `openspec schema which spec-driven` 且不存在覆盖时
- **则** 系统显示来源为 "package"
- **且** 显示包的 schemas 目录的完整路径

#### 场景：模式未找到
- **当** 用户运行 `openspec schema which nonexistent` 时
- **则** 系统显示模式未找到的错误
- **且** 列出可用模式
- **且** 以非零代码退出

### 需求：Schema which 显示遮蔽信息
CLI 应当指示当一个模式遮蔽了更低优先级级别的另一个模式时。

#### 场景：项目模式遮蔽包
- **当** 用户运行 `openspec schema which spec-driven` 且项目和包都有 `spec-driven` 时
- **则** 系统显示项目模式处于活跃状态
- **且** 指示它遮蔽了包版本
- **且** 显示被遮蔽的包模式的路径

#### 场景：无遮蔽
- **当** 模式仅存在于一个位置时
- **则** 系统不显示遮蔽信息

#### 场景：多重遮蔽
- **当** 项目模式同时遮蔽用户和包模式时
- **则** 系统按优先级顺序列出所有被遮蔽的位置

### 需求：Schema which 输出 JSON 格式
CLI 应当支持 `--json` 标志以提供机器可读输出。

#### 场景：基本 JSON 输出
- **当** 用户运行 `openspec schema which spec-driven --json` 时
- **则** 系统输出带有 `name`、`source` 和 `path` 字段的 JSON

#### 场景：带遮蔽的 JSON 输出
- **当** 用户运行 `openspec schema which spec-driven --json` 且模式有遮蔽时
- **则** JSON 包含 `shadows` 数组，每个被遮蔽的模式有 `source` 和 `path`

### 需求：Schema which 支持列表模式
CLI 应当支持列出所有模式及其解析来源。

#### 场景：列出所有模式
- **当** 用户运行 `openspec schema which --all` 时
- **则** 系统显示所有可用模式并按来源分组
- **且** 指示哪些模式遮蔽了其他模式

#### 场景：以 JSON 格式列出
- **当** 用户运行 `openspec schema which --all --json` 时
- **则** 系统输出带有每个模式解析信息的 JSON 数组
