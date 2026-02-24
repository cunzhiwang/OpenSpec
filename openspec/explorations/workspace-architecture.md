# 工作区探索

## 背景

在简化技能安装的过程中，我们发现了关于配置文件、配置和工作区应该如何协同工作的更深层问题。本文档记录了我们已决定的内容、开放的问题和需要研究的内容。

**更新：** 初步探索揭示，"工作区"主要不是关于配置分层的问题——而是关于一个更根本的问题：**当工作跨越多个模块或仓库时，规范和变更应该存放在哪里？**

---

## 第1部分：配置文件和配置（原始范围）

### 我们已决定的内容

#### 配置文件 UX（简化）

**之前（原始提案）：**
```
openspec profile set core|extended
openspec profile install <workflow>
openspec profile uninstall <workflow>
openspec profile list
openspec profile show
openspec config set delivery skills|commands|both
openspec config get delivery
openspec config list
```
8 个子命令，两个概念（profile + config）

**之后（简化）：**
```
openspec config profile          # 交互式选择器（delivery + workflows）
openspec config profile core     # 预设快捷方式
openspec config profile extended # 预设快捷方式
```
1 个命令带预设，一个概念

#### 交互式选择器

```
$ openspec config profile

Delivery: [skills] [commands] [both]
                              ^^^^^^

Workflows: (空格切换, 回车保存)
[x] propose
[x] explore
[x] apply
[x] archive
[ ] new
[ ] ff
[ ] continue
[ ] verify
[ ] sync
[ ] bulk-archive
[ ] onboard
```

一个地方配置交付方式和工作流选择。

#### 为什么是"Profile"（不是"Workflows"）

配置文件作为抽象允许未来的扩展性：
- 方法论包（spec-driven, test-driven）
- 用户创建的配置文件
- 可共享的配置文件
- 不同方法的不同技能/命令集

### 配置分层研究

我们研究了类似工具如何处理配置分层：

| 工具 | 模型 | 关键模式 |
|------|------|----------|
| **VSCode** | 用户 → 工作区 → 文件夹 | 对象合并，原始值覆盖。工作区 = 仓库中提交的 `.vscode/` |
| **ESLint（flat）** | 单一根配置 | *故意取消了级联* - "复杂性呈指数级增长" |
| **Turborepo** | 根 + 包扩展 | 每个包的 `turbo.json` 带 `extends: ["//"]` 用于覆盖 |
| **Nx** | 集成 vs 基于包 | 两种模式 - 共享根或每包。难以从集成迁移。 |
| **pnpm** | 工作区根定义范围 | 根目录的 `pnpm-workspace.yaml`。依赖可以共享或每包 |
| **Claude Code** | 全局 + 项目 | `~/.claude/` 用于全局，`.claude/` 每项目。无工作区跟踪。 |
| **Kiro** | 每根分布式 | 每个文件夹有 `.kiro/`。聚合显示，无继承。 |

**ESLint 的关键洞察：** ESLint 团队在 flat config 中明确移除了级联，因为级联是一个复杂性噩梦。他们的新模型：根目录一个配置，使用 glob 模式来定位子目录。

**配置文件/配置的建议：** 两层就够了。
- **全局** = 用户的默认值（`~/.config/openspec/`）
- **项目** = 仓库级配置（`.openspec/` 或提交到仓库）

不需要配置的"工作区"层。这与 Claude Code 的模型匹配。

### 配置决定（对于此变更）

保持简单：
1. 全局配置文件作为 `openspec init` 的默认值
2. `openspec init` 将当前配置文件应用到项目
3. 暂无工作区跟踪
4. 不自动同步现有项目

这是显式的，不阻止未来功能。

---

## 第2部分：更深层的问题（规范和变更组织）

### 真正的问题

工作区问题不是关于配置的——而是关于**当以下情况时，规范和变更应该存放在哪里**：

1. **Monorepos**：规范或变更可能跨越多个包/应用
2. **多仓库**：变更可能完全跨越多个仓库
3. **跨职能工作**：功能影响多个团队（后端、Web、iOS、Android）

### 当前 OpenSpec 架构

OpenSpec 当前假设：
- 每个仓库一个 `openspec/`，始终在根目录
- CLI 不会向上遍历目录——期望你在根目录
- 变更可以触及任何规范（无范围限制）
- 单一配置适用于所有内容
- 项目内无"范围"或"边界"概念

```
openspec/
├── specs/
│   ├── auth/spec.md           # 按领域组织的规范
│   ├── payments/spec.md
│   └── checkout/spec.md
├── changes/
│   └── add-oauth/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/             # 增量规范（可以触及多个）
│           ├── auth/spec.md
│           └── checkout/spec.md
└── config.yaml
```

**这对单项目仓库工作得很好。** 但对于以下情况呢：
- 有 50+ 个包的大型 monorepo？
- 多仓库微服务？
- 跨多个团队的跨职能功能？

### 结账/支付示例

想象一个支付系统：
- **后端账单团队**：拥有支付处理
- **Web 团队**：拥有 Web 结账 UX
- **iOS 团队**：拥有 iOS 结账 UX
- **Android 团队**：拥有 Android 结账 UX
- **跨领域**：所有客户端必须遵循的支付*契约*

**问题：**
- 共享的支付契约规范存放在哪里？
- 平台特定的结账规范存放在哪里？
- 如果 iOS 规范"扩展"共享契约，如何表达？
- 当契约变更时，下游规范如何更新？
- 谁拥有什么？

### 核心张力

```
                    范围
                      │
         狭窄         │       广泛
    （团队/模块）      │    （跨领域）
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    │  "我们团队的     │   "共享         │
    │   结账           │    结账         │
    │   行为"          │    契约"        │
    │                 │                 │
────┼─────────────────┼─────────────────┼──── 所有权
    │                 │                 │
    │  简单:           │   困难:         │
    │  一个团队,       │   多个          │
    │  一个规范        │   利益相关者     │
    │                 │                 │
    └─────────────────┴─────────────────┘
```

---

## 第3部分：其他领域如何解决这个问题

### 研究中的模式

| 领域 | 共享内容 | 特定内容 | 如何连接 |
|------|---------|---------|----------|
| **Protobuf** | 根目录的 `common/` | 每个服务的 `domain/service/` | 从 common 导入 |
| **设计系统** | 设计令牌、组件名称、API | 平台实现 | "相同属性，不同渲染" |
| **DDD** | 共享内核 | 限界上下文 | 上下文映射定义关系 |
| **RFC** | 跨领域 RFC | 团队范围 RFC | 不同的审查流程 |
| **OpenAPI** | 基础模式 | 每个服务的规范 | `$ref` 到共享定义 |

### Protobuf Monorepo 模式

```
proto/
├── common/              # 共享的、低变动的类型
│   └── money.proto
│   └── address.proto
├── billing/             # 领域特定
│   └── service.proto
└── checkout/
    └── service.proto    # 从 common/ 导入
```

**关键洞察：** "大多数工程组织应该将他们的 proto 文件保存在一个仓库中。心智开销保持恒定，而不是随组织规模扩展。"

### 设计系统模式（Booking.com, Uber）

> "组件在 iOS 和 Android 之间可能看起来非常不同，因为它们使用原生应用设计标准，但仍然**在代码中共享完全相同的属性**。这就是属性如此强大的原因——它是每个组件的**唯一真相来源**。"

**关键洞察：** 共享规范定义*契约*（属性、行为）。平台规范定义*实现细节*（在该平台上的外观/工作方式）。

### DDD 限界上下文

> "一个上下文，一个团队。清晰的所有权避免误沟通。"

**关键洞察：** 规范应该有清晰的所有权。跨领域关注点使用"共享内核"模式——显式共享的代码/规范，需要协调才能更改。

---

## 第4部分：OpenSpec 的三种模型

### 模型 A：扁平根（当前）

```
openspec/
├── specs/
│   ├── checkout-contract/    # 共享契约
│   ├── checkout-web/         # Web 特定
│   ├── checkout-ios/         # iOS 特定
│   ├── checkout-android/     # Android 特定
│   ├── billing/              # 后端
│   └── ... (根级别 50+ 规范)
└── changes/
```

**优点：**
- 简单的心智模型
- 所有规范在一个地方
- 无嵌套复杂性

**缺点：**
- 大规模时变得难以管理（50+ 目录）
- 无明确的所有权信号
- 难以看出哪些规范相关
- 命名约定变得关键（`checkout-*`）

### 模型 B：嵌套规范（领域 → 平台）

```
openspec/
├── specs/
│   ├── checkout/
│   │   ├── spec.md              # 共享契约（"接口"）
│   │   ├── web/spec.md          # Web 实现规范
│   │   ├── ios/spec.md          # iOS 实现规范
│   │   └── android/spec.md      # Android 实现规范
│   └── billing/
│       └── spec.md
└── changes/
```

**优点：**
- 清晰的层次结构（共享在顶部，特定嵌套）
- 相关规范共同定位
- 视觉上更好扩展
- 所有权可以遵循结构

**缺点：**
- 更复杂的规范引用（`checkout/web` vs `checkout`）
- 需要定义继承/扩展语义
- iOS 规范是"扩展"基础规范，还是只是引用它？

**开放问题：** "extends" 是什么意思？
```yaml
# checkout/ios/spec.md
extends: ../spec.md   # 继承所有需求？
requirements:
  - System SHALL support Apple Pay  # 添加到基础？
```

### 模型 C：分布式规范（靠近代码）

```
monorepo/
├── services/
│   └── billing/
│       └── openspec/specs/billing/spec.md
├── clients/
│   ├── web/
│   │   └── openspec/specs/checkout/spec.md
│   ├── ios/
│   │   └── openspec/specs/checkout/spec.md
│   └── android/
│       └── openspec/specs/checkout/spec.md
└── openspec/           # 根级别用于跨领域
    ├── specs/
    │   └── checkout-contract/spec.md   # 共享契约
    └── changes/        # 跨领域变更存放在哪里？
```

**优点：**
- 规范靠近它们描述的代码
- 团队自然拥有他们的规范
- 也适用于多仓库（每个仓库有自己的 `openspec/`）

**缺点：**
- 跨领域规范很尴尬（放在哪里？）
- 跨越多个 `openspec/` 目录的变更 = ???
- 需要"工作区"概念来聚合
- 多个 `openspec/` 根需要管理

### 模型 D：混合（每个项目内的模型 B + 跨项目的模型 C）

每个项目使用一个 `openspec/` 根，但允许在该根内使用嵌套规范以实现清晰的所有权和共享契约。
对于多仓库工作，使用工作区清单来协调多个项目而不复制规范的规范源。

**Monorepo 形状（单项目，嵌套规范）：**
```
repo/
└── openspec/
    ├── specs/
    │   ├── contracts/
    │   │   └── checkout/spec.md
    │   ├── billing/
    │   │   └── spec.md
    │   └── checkout/
    │       ├── web/spec.md
    │       ├── ios/spec.md
    │       └── android/spec.md
    └── changes/
        └── add-3ds/
            ├── proposal.md
            ├── design.md
            ├── tasks.md
            └── specs/
                ├── contracts/checkout/spec.md
                ├── billing/spec.md
                ├── checkout/web/spec.md
                ├── checkout/ios/spec.md
                └── checkout/android/spec.md
```

**多仓库形状（多项目 + 工作区协调）：**
```
~/work/
├── contracts/
│   └── openspec/
│       ├── specs/checkout/spec.md
│       └── changes/add-3ds-contract/
├── billing-service/
│   └── openspec/
│       ├── specs/billing/spec.md
│       └── changes/add-3ds-billing/
├── web-client/
│   └── openspec/
│       ├── specs/checkout/spec.md
│       └── changes/add-3ds-web/
├── ios-client/
│   └── openspec/
│       ├── specs/checkout/spec.md
│       └── changes/add-3ds-ios/
└── payments-workspace/
    └── .openspec-workspace/
        ├── workspace.yaml
        └── initiatives/add-3ds/links.yaml
```

`workspace.yaml` 列出项目/根。`links.yaml` 将一个跨领域倡议映射到每个项目的变更。
规范的规范源保留在拥有仓库中；工作区数据仅是协调元数据。

**优点：**
- 清晰的所有权边界（一个项目拥有其规范和变更）
- 共享契约可以有专用的拥有仓库（无重复作为真相来源）
- 用一个心智模型同时适用于 monorepo 和多仓库
- 避免继承复杂性（关系可以从显式引用开始）
- 从当前模型的增量迁移路径

**缺点：**
- 需要新的工作区 UX 用于跨仓库协调
- 跨仓库功能工作创建多个变更 ID 需要管理
- 需要契约所有权和倡议链接的约定
- 一些用户可能期望一个全局"巨型变更"而不是链接的每项目变更
- 工具必须支持主规范和变更增量中的嵌套规范路径

---

## 第5部分：多仓库考虑

对于多仓库设置，模型 C（或模型 D 的协调部分）几乎是强制的：

```
~/work/
├── billing-service/
│   └── openspec/specs/billing/
├── web-client/
│   └── openspec/specs/checkout/
├── ios-client/
│   └── openspec/specs/checkout/
└── contracts/                    # 用于共享规范的专用仓库？
    └── openspec/specs/
        └── checkout-contract/
```

### 多仓库的问题

1. **共享规范存放在哪里？**
   - 专用的"contracts"仓库？
   - 在每个仓库中复制（漂移风险）？
   - 一个仓库是"真相来源"，其他引用它？

2. **跨仓库变更存放在哪里？**
   - 在其中一个仓库中？（感觉不对——有偏向的所有权）
   - 在单独的"工作区"仓库中？
   - 在 `~/.config/openspec/workspaces/my-platform/changes/` 中？

3. **变更如何传播？**
   - 对 `checkout-contract` 的变更影响所有客户端仓库
   - 我们需要显式的依赖跟踪吗？
   - 还是这是"带外"的（团队手动协调）？

### 多仓库的"工作区"可能意味着什么

如果我们添加工作区支持，它可能是：

> **工作区是可以一起操作的 OpenSpec 根的集合。**

```yaml
# ~/.config/openspec/workspaces.yaml（或类似）
workspaces:
  my-platform:
    roots:
      - ~/work/billing-service
      - ~/work/web-client
      - ~/work/ios-client
      - ~/work/contracts
    shared_context: |
      所有服务使用 TypeScript。
      API 契约遵循 OpenAPI 3.1。
```

这将启用：
1. **跨仓库变更**：创建跟踪跨多个根的增量的变更
2. **聚合规范视图**：查看工作区中的所有规范
3. **共享上下文**：适用于所有根的上下文/规则

---

## 第6部分：关键设计问题

### 1. 规范应该是层次化的（带继承）吗？

**选项 A：无继承，只是组织**
- 嵌套目录纯粹是组织性的
- 每个规范是独立的
- 关系是隐式的（命名）或手动记录的

**选项 B：显式继承**
```yaml
# checkout/ios/spec.md
extends: ../spec.md
requirements:
  - System SHALL support Apple Pay  # 添加到基础
```
- 子规范继承父需求
- 可以添加、覆盖或扩展
- 更强大但更复杂

**选项 C：无继承的引用**
```yaml
# checkout/ios/spec.md
references:
  - ../spec.md  # "另见"但无继承
requirements:
  - System SHALL implement checkout per checkout-contract
  - System SHALL support Apple Pay
```
- 用于文档的显式引用
- 无自动继承
- 更简单的语义

### 2. "共享内核"存放在哪里？

**选项 A：根级别（模型 B）**
- `openspec/specs/checkout/spec.md` 是共享内核
- 平台规范嵌套在其下

**选项 B：专用区域**
- `openspec/specs/_shared/checkout-contract/spec.md`
- 或 `openspec/specs/_contracts/checkout/spec.md`
- 显式的"共享"命名空间

**选项 C：单独的仓库（多仓库的模型 C）**
- 专用的 `contracts` 或 `specs` 仓库
- 其他仓库引用它

### 3. "工作区"与"项目"是什么？

如果我们引入工作区：

| 概念 | 定义 |
|------|------|
| **项目** | 单个 OpenSpec 根（一个 `openspec/` 目录） |
| **工作区** | 可以一起操作的项目集合 |

工作区将启用：
- 跨项目的聚合规范查看
- 跨项目变更
- 跨项目的共享上下文

**问题：** 我们需要显式的工作区跟踪，还是只是临时的多根（如 Claude Code 的 `/add-dir`）？

### 4. OpenSpec 需要理解依赖吗？

如果 `checkout-web` 依赖 `checkout-contract`：
- OpenSpec 应该知道这种关系吗？
- 对 `checkout-contract` 的变更应该警告下游规范吗？
- 还是依赖跟踪"超出范围"？

**权衡：**
- 有依赖跟踪：更强大，自动传播警告
- 无依赖跟踪：更简单，团队自己管理依赖

### 5. 变更应该如何用于跨领域工作？

**对于 monorepos（模型 B）：**
- 一个变更，`specs/` 中有多个增量规范
- 今天已经可以工作

**对于多仓库（模型 C）：**
- 选项 A：一个"工作区变更"引用多个仓库变更
- 选项 B：每个仓库中的单独变更相互引用
- 选项 C：变更始终存放在一个仓库中，引用其他仓库中的规范

---

## 第7部分："惊艳"会是什么样子？

基于研究，团队喜欢：

1. **一个地方查看**（Protobuf："心智开销保持恒定"）
2. **清晰的所有权**（DDD："一个上下文，一个团队"）
3. **带本地扩展的共享契约**（设计系统："相同属性，不同渲染"）
4. **自动一致性**（设计系统："设计令牌作为基础"）
5. **低认知负荷**（不应该过多考虑组织）

### 可能的北极星

**雄心勃勃的：**
> OpenSpec 自动理解你的仓库结构，检测跨领域规范，并帮助你创建流向正确地方的变更。

**更简单的：**
> 你按自己的方式组织规范。OpenSpec 就能工作。

**实用的：**
> 嵌套规范用于组织。显式依赖用于跨领域。无魔法。

---

## 第8部分：可能的前进路径

### 对于此变更（simplify-skill-installation）

现在不解决规范组织问题。保持范围在：
1. 配置文件 UX 简化
2. `openspec init` 改进
3. 暂无工作区跟踪

### 未来：规范组织变更

单独的变更来探索和实现：

1. **决定模型 A、B、C 或 D（混合）**
2. **决定继承语义**（或无）
3. **更新规范解析**以处理嵌套
4. **更新变更增量**以处理嵌套规范

### 未来：多仓库/工作区变更

如果需要，单独的变更用于：

1. **定义工作区概念**
2. **实现工作区跟踪**（或临时多根）
3. **跨仓库变更**
4. **跨仓库的共享上下文**

---

## 第9部分：规范哲学（行为优先、轻量级、代理对齐）

### 在 OpenSpec 中规范是什么？

对于 OpenSpec，规范应该被视为**边界处的可验证行为契约**：
- 用户、集成者或运营者可以观察和依赖的内容
- 可以通过测试、检查或显式审查验证的内容
- 即使内部实现变更也应保持稳定的内容

### 规范中应该和不应该包含什么

**包含：**
- 可观察的行为和结果
- 接口/数据契约（输入、输出、错误条件）
- 外部重要的非功能约束（隐私、安全、可靠性）
- 下游消费者依赖的兼容性保证

**避免：**
- 内部实现细节（类名、库选择、控制流）
- 可以在不影响行为的情况下更改的工具机制
- 逐步执行计划（属于任务/设计）

### 保持严谨性与工作量成比例（避免官僚主义）

使用渐进式严谨性：

1. **轻量级规范（大多数变更的默认）**
   - 简短的行为要点、清晰的范围和验收检查
2. **完整规范（仅用于高风险或跨边界工作）**
   - 用于 API 破坏、迁移、安全/隐私或跨团队/仓库变更的更深入契约细节

这保持日常使用轻量级，同时在失败代价昂贵的地方保持清晰。

### 人类探索 -> 代理编写规范

OpenSpec 通常从人类探索中由代理编写。为使其可靠：

- 人类提供意图、约束和来自探索的示例
- 代理将其转换为简洁的、行为优先的需求和场景
- 代理将实现细节保留在设计/任务中，而不是规范中
- 验证检查强制执行结构和可测试性

简而言之：人类塑造意图；代理产生一致的、可验证的契约。

### 这个哲学应该存放在哪里

为避免在探索笔记中丢失这些，将其编入：
1. `docs/concepts.md` 用于面向人类的框架
2. `openspec/specs/openspec-conventions/spec.md` 用于规范性规范约定
3. `openspec/specs/docs-agent-instructions/spec.md` 用于代理指令编写规则

---

## 总结

| 问题 | 状态 | 备注 |
|------|------|------|
| 配置文件 UX | 已决定 | `openspec config profile` 带预设 |
| 配置分层 | 已决定 | 两层：全局 + 项目（无工作区层） |
| 规范组织 | 开放 | 正在考虑四种模型（包括混合模型 D） |
| 规范哲学 | 方向确定 | 行为优先契约、渐进式严谨性和代理对齐编写 |
| 规范继承 | 开放 | 继承 vs 引用 vs 无 |
| 多仓库支持 | 开放 | 工作区概念待定 |
| 依赖跟踪 | 开放 | 初步可能超出范围 |

### 关键洞察

"工作区"问题实际上是两个独立的问题：
1. **配置/配置文件范围** → 用全局 + 项目解决（不需要工作区）
2. **规范/变更组织** → 未解决，需要更深入的设计工作

这些应该是单独的变更和单独的探索。

---

## 参考资料

- [VSCode 设置优先级](https://code.visualstudio.com/docs/configure/settings)
- [ESLint Flat Config 在 Monorepos 中的讨论](https://github.com/eslint/eslint/discussions/16960)
- [Turborepo 包配置](https://turborepo.dev/docs/reference/package-configurations)
- [pnpm 工作区](https://pnpm.io/workspaces)
- [Claude Code 设置](https://code.claude.com/docs/en/settings)
- [Kiro 多根工作区](https://kiro.dev/docs/editor/multi-root-workspaces/)
- [DDD 限界上下文](https://martinfowler.com/bliki/BoundedContext.html)
- [Protobuf Monorepo 模式](https://www.lesswrong.com/posts/xts8dC3NeTHwqYgCG/keep-your-protos-in-one-repo)
- [Booking.com 多平台设计系统](https://booking.design/how-we-built-our-multi-platform-design-system-at-booking-com-d7b895399d40)
- [InnerSource RFC 模式](https://patterns.innersourcecommons.org/p/transparent-cross-team-decision-making-using-rfcs)
