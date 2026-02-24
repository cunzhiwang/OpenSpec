# AI 工具路径规范

## 目的
定义用于在工具特定目录中生成 OpenSpec 技能和命令的 AI 工具路径元数据。

## 需求
### 需求：AIToolOption skillsDir 字段

`AIToolOption` 接口应当包含一个可选的 `skillsDir` 字段，用于技能生成路径配置。

#### 场景：接口包含 skillsDir 字段

- **当** 在 `AI_TOOLS` 中定义支持技能生成的工具条目时
- **则** 应当包含 `skillsDir` 字段，指定项目本地基目录（例如 `.claude`）

#### 场景：技能路径遵循 Agent Skills 规范

- **当** 为配置了 `skillsDir: '.claude'` 的工具生成技能时
- **则** 技能应当写入 `<projectRoot>/<skillsDir>/skills/`
- **并且** 按照 Agent Skills 规范附加 `/skills` 后缀

### 需求：支持工具的路径配置

`AI_TOOLS` 数组应当为支持 Agent Skills 规范的工具包含 `skillsDir`。

#### 场景：Claude Code 路径定义

- **当** 查找 `claude` 工具时
- **则** `skillsDir` 应当为 `.claude`

#### 场景：Cursor 路径定义

- **当** 查找 `cursor` 工具时
- **则** `skillsDir` 应当为 `.cursor`

#### 场景：Windsurf 路径定义

- **当** 查找 `windsurf` 工具时
- **则** `skillsDir` 应当为 `.windsurf`

#### 场景：没有 skillsDir 的工具

- **当** 工具没有定义 `skillsDir` 时
- **则** 技能生成应当报错，提示该工具不受支持

### 需求：跨平台路径处理

系统应当在不同操作系统上正确处理路径。

#### 场景：Windows 上的路径构建

- **当** 在 Windows 上构建技能路径时
- **则** 系统应当使用 `path.join()` 进行所有路径构建
- **并且** 不应当硬编码正斜杠

#### 场景：Unix 上的路径构建

- **当** 在 macOS 或 Linux 上构建技能路径时
- **则** 系统应当使用 `path.join()` 以保持一致性
