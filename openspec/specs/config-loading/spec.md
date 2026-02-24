# config-loading 规范

## 目的
定义如何发现、解析、验证 `openspec/config.yaml` 并安全地向调用者公开配置。

## 需求
### 需求：从 openspec/config.yaml 加载项目配置

系统应当读取和解析位于项目根目录 `openspec/config.yaml` 的项目配置文件。

#### 场景：有效配置文件存在
- **当** `openspec/config.yaml` 存在且包含有效的 YAML 内容时
- **则** 系统解析文件并返回 ProjectConfig 对象

#### 场景：配置文件不存在
- **当** `openspec/config.yaml` 不存在时
- **则** 系统返回 null 而不报错

#### 场景：配置文件 YAML 语法无效
- **当** `openspec/config.yaml` 包含格式错误的 YAML 时
- **则** 系统记录警告消息并返回 null

#### 场景：配置文件 YAML 有效但模式无效
- **当** `openspec/config.yaml` 包含有效 YAML 但未通过 Zod 模式验证时
- **则** 系统记录带有验证详情的警告消息并返回 null

### 需求：支持 .yml 文件扩展名别名

系统应当同时接受 `.yaml` 和 `.yml` 文件扩展名作为配置文件。

#### 场景：配置文件使用 .yml 扩展名
- **当** `openspec/config.yml` 存在且 `openspec/config.yaml` 不存在时
- **则** 系统从 `openspec/config.yml` 读取

#### 场景：.yaml 和 .yml 都存在
- **当** `openspec/config.yaml` 和 `openspec/config.yml` 都存在时
- **则** 系统优先使用 `openspec/config.yaml`

### 需求：使用弹性逐字段解析

系统应当独立解析每个配置字段，收集有效字段并警告无效字段，而不拒绝整个配置。

#### 场景：Schema 字段有效
- **当** 配置包含 `schema: "spec-driven"` 时
- **则** schema 字段包含在返回的配置中

#### 场景：Schema 字段缺失
- **当** 配置缺少 `schema` 字段时
- **则** 不记录警告（字段在解析级别是可选的）

#### 场景：Schema 字段为空字符串
- **当** 配置包含 `schema: ""` 时
- **则** 记录警告且 schema 字段不包含在返回的配置中

#### 场景：Schema 字段类型无效
- **当** 配置包含 `schema: 123`（数字而非字符串）时
- **则** 记录警告且 schema 字段不包含在返回的配置中

#### 场景：Context 字段有效
- **当** 配置包含 `context: "Tech stack: TypeScript"` 时
- **则** context 字段包含在返回的配置中

#### 场景：Context 字段类型无效
- **当** 配置包含 `context: 123`（数字而非字符串）时
- **则** 记录警告且 context 字段不包含在返回的配置中

#### 场景：Rules 字段结构有效
- **当** 配置包含 `rules: { proposal: ["Rule 1"], specs: ["Rule 2"] }` 时
- **则** rules 字段包含在返回的配置中，带有有效规则

#### 场景：Rules 字段的产物值不是数组
- **当** 配置包含 `rules: { proposal: "not an array", specs: ["Valid"] }` 时
- **则** 为 proposal 记录警告，但 specs 规则仍包含在返回的配置中

#### 场景：Rules 数组包含非字符串元素
- **当** 配置包含 `rules: { proposal: ["Valid rule", 123, ""] }` 时
- **则** 只包含 "Valid rule"，记录关于无效元素的警告

#### 场景：有效和无效字段的混合
- **当** 配置包含有效的 schema、无效的 context 类型、有效的 rules 时
- **则** 返回带有 schema 和 rules 字段的配置，记录关于 context 的警告

### 需求：强制执行 context 大小限制

系统应当拒绝超过 50KB 的 context 字段并记录警告。

#### 场景：Context 在大小限制内
- **当** 配置包含 1KB 的 context 时
- **则** context 包含在返回的配置中

#### 场景：Context 达到大小限制
- **当** 配置包含正好 50KB 的 context 时
- **则** context 包含在返回的配置中

#### 场景：Context 超过大小限制
- **当** 配置包含 51KB 的 context 时
- **则** 记录带有大小和限制的警告，context 字段不包含在返回的配置中

### 需求：延迟产物 ID 验证到指令加载时

系统不应当在配置加载时验证 rules 中的产物 ID。验证在知道 schema 时的指令加载期间进行。

#### 场景：加载带有 rules 的配置
- **当** 配置包含 `rules: { unknownartifact: [...] }` 时
- **则** 配置成功加载而不报验证错误

#### 场景：验证在指令加载时进行
- **当** 为任何产物加载指令且配置中的 rules 有未知产物 ID 时
- **则** 发出关于未知产物 ID 的警告（详见 rules-injection 规范）

### 需求：优雅处理配置错误而不中断

系统应当在配置加载或解析失败时使用默认值继续操作。

#### 场景：命令执行期间配置解析失败
- **当** 配置文件有语法错误且用户运行 `openspec new change` 时
- **则** 命令使用默认 schema "spec-driven" 执行

#### 场景：警告对用户可见
- **当** 配置加载失败时
- **则** 系统向 stderr 输出警告消息，包含失败详情
