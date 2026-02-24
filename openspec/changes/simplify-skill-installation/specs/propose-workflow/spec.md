## 目的

propose 工作流应将变更创建和产物生成合并为单个命令，减少新用户的摩擦，同时通过嵌入式指导教他们 OpenSpec 工作流。

## 新增需求

### 需求：Propose 工作流创建
系统应提供 `propose` 工作流，在一步中创建变更并生成所有产物。

#### 场景：基本 propose 调用
- **当** 用户调用 `/opsx:propose "添加用户认证"`
- **则** 系统应创建带 kebab-case 名称的变更目录
- **则** 系统应在变更目录中创建 `.openspec.yaml`（通过 `openspec new change`）
- **则** 系统应生成实现所需的所有产物：proposal.md、design.md、specs/、tasks.md

#### 场景：Propose 带现有变更名称
- **当** 用户调用 `/opsx:propose` 带已存在的名称
- **则** 系统应询问用户是否要继续现有变更或创建新变更
- **则** 如果"继续"：系统应从最后完成状态恢复产物生成
- **则** 如果"创建新"：系统应提示输入新名称
- **则** 在非交互模式下：系统应以错误失败，建议使用不同的名称

### 需求：Propose 工作流入门用户体验
`propose` 工作流应包含解释性输出以帮助新用户理解过程。

#### 场景：首次用户指导
- **当** 用户调用 `/opsx:propose`
- **则** 系统应解释将创建哪些产物（proposal.md、design.md、specs/、tasks.md）
- **则** 系统应指示下一步（`/opsx:apply` 以实施）

#### 场景：产物创建进度
- **当** 系统创建每个产物时
- **则** 系统应显示进度（如 "✓ 已创建 proposal.md"）

### 需求：Propose 工作流组合 new 和 ff
`propose` 工作流应执行与运行 `new` 后跟 `ff` 相同的操作。

#### 场景：等效于 new + ff
- **当** 用户调用 `/opsx:propose "功能名称"`
- **则** 结果应在功能上等效于调用 `/opsx:new "feature-name"` 后跟 `/opsx:ff feature-name`
- **则** 应创建相同的目录结构和产物
- **则** 控制台输出可能不同（propose 包含入门解释）
