# schema-validate-command 规范

## 目的
定义 `openspec schema validate` 行为，用于验证模式语法、结构、模板和依赖图。

## 需求
### 需求：Schema validate 检查模式结构
CLI 应当提供 `openspec schema validate [name]` 命令，验证模式配置并报告错误。

#### 场景：验证特定模式
- **当** 用户运行 `openspec schema validate my-workflow` 时
- **则** 系统使用解析顺序定位模式
- **且** 根据模式 Zod 类型验证 `schema.yaml`
- **且** 显示验证结果（有效或错误列表）

#### 场景：验证所有项目模式
- **当** 用户运行 `openspec schema validate` 而不带名称时
- **则** 系统验证 `openspec/schemas/` 中的所有模式
- **且** 显示每个模式的结果
- **且** 如果任何模式无效则以非零代码退出

#### 场景：模式未找到
- **当** 用户运行 `openspec schema validate nonexistent` 时
- **则** 系统显示模式未找到的错误
- **且** 以非零代码退出

### 需求：Schema validate 检查 YAML 语法
CLI 应当在可能时报告带行号的 YAML 解析错误。

#### 场景：无效 YAML 语法
- **当** 用户运行 `openspec schema validate my-workflow` 且 `schema.yaml` 有语法错误时
- **则** 系统显示带行号的 YAML 解析错误
- **且** 以非零代码退出

#### 场景：有效 YAML 但缺少必需字段
- **当** `schema.yaml` 是有效 YAML 但缺少 `name` 字段时
- **则** 系统显示缺少必需字段的 Zod 验证错误
- **且** 识别具体缺少的字段

### 需求：Schema validate 检查模板存在
CLI 应当验证产物引用的所有模板文件都存在。

#### 场景：缺少模板文件
- **当** 产物引用 `template: proposal.md` 但文件不存在于模式目录中时
- **则** 系统报告错误："Template file 'proposal.md' not found for artifact 'proposal'"
- **且** 以非零代码退出

#### 场景：所有模板都存在
- **当** 所有产物模板都存在时
- **则** 系统报告模板有效
- **且** 模板存在性包含在验证摘要中

### 需求：Schema validate 检查依赖图
CLI 应当验证产物依赖形成有效的有向无环图。

#### 场景：有效依赖图
- **当** 产物依赖形成有效的 DAG（例如 tasks → specs → proposal）时
- **则** 系统报告依赖图有效

#### 场景：检测到循环依赖
- **当** 产物 A 需要 B 且产物 B 需要 A 时
- **则** 系统报告循环依赖错误
- **且** 识别参与循环的产物
- **且** 以非零代码退出

#### 场景：未知依赖引用
- **当** 产物需要 `nonexistent-artifact` 时
- **则** 系统报告错误："Artifact 'x' requires unknown artifact 'nonexistent-artifact'"
- **且** 以非零代码退出

### 需求：Schema validate 输出 JSON 格式
CLI 应当支持 `--json` 标志以提供机器可读的验证结果。

#### 场景：有效模式的 JSON 输出
- **当** 用户运行 `openspec schema validate my-workflow --json` 且模式有效时
- **则** 系统输出带有 `valid: true`、`name` 和 `path` 字段的 JSON

#### 场景：无效模式的 JSON 输出
- **当** 用户运行 `openspec schema validate my-workflow --json` 且模式有错误时
- **则** 系统输出带有 `valid: false` 和 `issues` 数组的 JSON
- **且** 每个问题包含 `level`、`path` 和 `message` 字段
- **且** 格式匹配现有 `openspec validate` 输出结构

### 需求：Schema validate 支持详细模式
CLI 应当支持 `--verbose` 标志以获取详细验证信息。

#### 场景：详细输出显示所有检查
- **当** 用户运行 `openspec schema validate my-workflow --verbose` 时
- **则** 系统显示每个验证检查的执行过程
- **且** 显示通过/失败状态：YAML 解析、Zod 验证、模板存在、依赖图
