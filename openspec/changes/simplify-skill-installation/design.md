## 上下文

OpenSpec 目前为每个用户安装 10 个工作流（技能 + 命令），让新用户感到不知所措。init 流程在用户体验价值之前询问多个问题（配置文件、交付、工具），造成摩擦。

当前架构：
- `src/core/init.ts` - 处理工具选择和技能/命令生成
- `src/core/config.ts` - 定义带 `skillsDir` 映射的 `AI_TOOLS`
- `src/core/shared/skill-generation.ts` - 从模板生成技能文件
- `src/core/templates/workflows/*.ts` - 单个工作流模板
- `src/prompts/searchable-multi-select.ts` - 工具选择 UI

全局配置存在于 `~/.config/openspec/config.json` 用于遥测/功能标志。配置文件/交付设置将扩展此现有配置。

## 目标/非目标

**目标：**
- 让新用户在 1 分钟内达到"啊哈时刻"
- 带自动检测和确认的智能默认 init（core 配置文件，both 交付）
- 从现有目录自动检测已安装的工具
- 引入配置文件系统（core/custom）用于工作流选择
- 引入交付配置（skills/commands/both）作为高级用户设置
- 创建新的 `propose` 工作流组合 `new` + `ff`
- 修复工具选择用户体验（空格选择，回车确认）
- 为现有用户保持向后兼容性

**非目标：**
- 移除任何现有工作流（所有通过自定义配置文件保持可用）
- 每项目配置文件/交付设置（仅用户级）
- 更改产物结构或模式系统
- 修改技能/命令的格式化或写入方式

## 决策

### 1. 扩展现有全局配置

将配置文件/交付设置添加到现有 `~/.config/openspec/config.json`（通过 `src/core/global-config.ts`）。

**理由：** 全局配置已经存在，具有 XDG/APPDATA 跨平台路径处理、模式演进和合并默认值行为。复用它避免了第二个配置文件并利用现有基础设施。

**模式扩展：**
```json
{
  "telemetry": { ... },     // 现有
  "featureFlags": { ... },  // 现有
  "profile": "core",        // 新
  "delivery": "both",       // 新
  "workflows": [...]        // 新（仅用于 custom 配置文件）
}
```

**考虑的替代方案：**
- 新 `~/.openspec/config.yaml`：创建第二个配置文件，不同格式，路径混淆
- 项目配置：需要同步机制，用户直接编辑它
- 环境变量：可发现性较差，难以持久化

### 2. 两层配置文件系统

```
core（默认）：     propose、explore、apply、archive（4 个）
custom：          用户定义的工作流子集
```

**理由：** Core 涵盖基本循环（propose → explore → apply → archive）。Custom 允许用户通过交互式选择器精确选择需要的内容。

**配置用户体验：**
```
$ openspec config profile

交付：[skills] [commands] [both]
                          ^^^^^^

工作流：（空格切换，回车保存）
[x] propose
[x] explore
[x] apply
[x] archive
[ ] new
[ ] ff
...
```

**考虑的替代方案：**
- 三层（core/extended/custom）：Extended 是多余的 - 想要所有工作流的用户可以在 custom 中选择它们
- 配置文件和交付的单独命令：合并到一个选择器中减少认知负担

### 3. Propose 工作流 = New + FF 组合

创建变更并在一步中生成所有产物的单一工作流。

**理由：** 大多数用户想从想法到实施就绪。分离 `new`（创建文件夹）和 `ff`（生成产物）添加了不必要的步骤。想要控制的高级用户可以通过自定义配置文件使用 `new` + `continue`。

**实现：** `src/core/templates/workflows/propose.ts` 中的新模板：
1. 通过 `openspec new change` 创建变更目录
2. 运行产物生成循环（像 ff 那样）
3. 在输出中包含入门风格的解释

### 4. 带确认的自动检测

扫描现有工具目录，预选检测到的工具，要求确认。

**理由：** 减少问题同时仍给用户控制。比完全自动（无确认）可能安装不需要的工具更好，或无检测（总是询问）增加摩擦。

**检测逻辑：**
```typescript
// 使用现有 AI_TOOLS 配置获取目录映射
// AI_TOOLS 中的每个工具都有一个 skillsDir 属性（如 '.claude'、'.cursor'、'.windsurf'）
// 扫描 cwd 中与 skillsDir 值匹配的现有目录，预选匹配项
const detectedTools = AI_TOOLS.filter(tool =>
  fs.existsSync(path.join(cwd, tool.skillsDir))
);
```

### 5. 交付作为配置文件配置的一部分

交付偏好（skills/commands/both）存储在全局配置中，默认为"both"。

**理由：** 大多数用户不知道或不关心这个区别。有偏好的高级用户可以通过 `openspec config profile` 交互式选择器设置它。不值得在 init 期间询问。

### 6. 文件系统作为已安装工作流的事实

`.claude/skills/`（等）中安装的内容是事实来源，而不是配置。

**理由：**
- 与现有安装向后兼容
- 用户可以手动添加/移除技能目录
- 配置配置文件是安装内容的"模板"，不是约束

**行为：**
- `openspec init` 设置新项目或重新初始化现有项目（选择工具，生成工作流）
- `openspec update` 刷新现有项目以匹配当前配置（无工具选择）
- `openspec config profile` 仅更新全局配置，如果在项目中则提供运行更新
- 额外工作流（不在配置文件中）被保留
- 交付更改会应用：切换到 `skills` 移除命令，切换到 `commands` 移除技能

**为什么不使用单独的工具清单？**

工具选择（项目使用哪些助手）是每用户且每项目的，但两个配置位置是仅每用户（全局配置）或每项目共享（签入的项目配置）。探索了单独的清单但被拒绝：

- *路径键控全局配置*（`projects: { "/path": { tools: [...] } }`）：在目录移动/重命名/删除时脆弱，符号链接歧义，项目行为取决于不可见的外部状态。
- *Gitignored 本地文件*（`.openspec.local`）：新克隆时丢失，增加文件管理开销。
- *签入的项目配置*（`openspec/config.yaml` 带 `tools` 字段）：强制工具选择给整个团队 — Alice 使用 Claude Code，Bob 使用 Cursor，两者都不想强制使用对方的工具。

文件系统方法避免了所有三个问题。对于团队，它实际上是有益的：签入的技能文件意味着任何团队成员的 `openspec update` 会刷新项目支持的所有工具的技能。生成的文件既作为可交付成果又作为隐式工具清单。

已知差距：在项目树外存储配置的工具（没有本地目录可扫描）需要工具特定处理，因为项目中没有可扫描的内容。如果/当支持这样的工具时再处理。

**何时使用 init vs update：**
- `init`：首次设置，或当你想更改配置的工具时
- `update`：更改配置后，或刷新模板到最新版本

### 8. 现有用户迁移

当 `openspec init` 或 `openspec update` 遇到具有现有工作流但全局配置中没有 `profile` 字段的项目时，它执行一次性迁移以保留用户当前设置。

**理由：** 没有迁移，现有用户将默认使用 `core` 配置文件，导致 `propose` 添加到他们的 10 个工作流之上 — 使事情变得更糟，而不是更好。迁移确保现有用户保持他们拥有的完全内容。

**触发者：** `init`（在现有项目上重新初始化）和 `update`。迁移检查是在两个命令中早期调用的共享函数，在配置文件解析之前。

**检测逻辑：**
```typescript
// 共享迁移检查，由 init 和 update 调用：
function migrateIfNeeded(projectPath: string, tools: AiTool[]): void {
  const globalConfig = readGlobalConfig();
  if (globalConfig.profile) return; // 已迁移或显式设置

  const installedWorkflows = scanInstalledWorkflows(projectPath, tools);
  if (installedWorkflows.length === 0) return; // 新用户，使用 core 默认值

  // 现有用户 — 迁移到 custom 配置文件
  writeGlobalConfig({
    ...globalConfig,
    profile: 'custom',
    delivery: 'both',
    workflows: installedWorkflows,
  });
}
```

**扫描逻辑：**
- 扫描所有工具目录（`.claude/skills/`、`.cursor/skills/` 等）中的工作流目录/文件
- 仅匹配 `ALL_WORKFLOWS` 常量 — 忽略用户创建的自定义技能/命令
- 将目录名称映射回工作流 ID（如 `openspec-explore/` → `explore`，`opsx-explore.md` → `explore`）
- 取所有工具中检测到的工作流名称的并集

**边缘情况：**
- **用户手动删除了一些工作流：** 迁移扫描实际安装的内容，尊重他们的选择
- **具有不同工作流集的多个项目：** 第一个触发迁移的项目设置全局配置；后续项目使用它
- **用户在目录中有自定义（非 OpenSpec）技能：** 忽略 — 扫描器仅匹配 `ALL_WORKFLOWS` 中的已知工作流 ID
- **迁移是幂等的：** 如果配置中已设置 `profile`，不会重新迁移
- **非交互式（CI）：** 相同的迁移逻辑，不需要确认 — 它保留现有状态

**考虑的替代方案：**
- 在 `init` 而不是 `update` 期间迁移：Init 已经有自己的流程（工具选择等）。将迁移与 init 混合会造成混乱的用户体验
- 不迁移，只默认使用 core：通过添加 `propose` 和显示"额外工作流"警告来破坏现有用户
- 在全局配置读取时迁移：太隐式，难以向用户显示反馈

### 9. 模板中的通用下一步指导

工作流模板使用通用的、基于概念的下一步指导，而不是引用特定的工作流命令。例如，模板不说"运行 `/opsx:propose`"，而是说"创建变更提案"。

**理由：** 条件交叉引用（每个模板检查安装了哪些其他工作流并渲染不同的命令名称）给模板生成、测试和维护增加了显著复杂性。通用指导完全避免了这一点，同时仍然有用 — 用户已经知道他们安装的工作流。

**注意：** 如果我们发现用户一直难以将概念映射到命令，我们可以用条件交叉引用重新审视这一点。现在，简单性获胜。

### 7. 修复多选键绑定

从 tab 确认更改为行业标准的空格/回车。

**理由：** Tab 确认是非标准的，让用户困惑。大多数 CLI 工具使用空格切换，回车确认。

**实现：** 修改 `src/prompts/searchable-multi-select.ts` 键绑定配置。

### 10. 更新同步必须考虑配置漂移，而不仅是版本漂移

`openspec update` 不能仅依赖 `generatedBy` 版本检查来决定是否需要工作。

**理由：** 即使现有技能模板是当前的，配置文件和交付更改也可能需要文件添加/移除操作。如果我们只检查模板版本，update 可能会错误地返回"最新"并跳过所需的同步。

**实现：**
- 保留模板刷新决策的版本检查
- 为配置文件/交付添加文件状态漂移检查（缺失的预期文件或已移除交付模式的过期文件）
- 将版本漂移或配置漂移视为需要更新

### 11. 工具配置检测包括仅命令安装

更新的配置工具检测必须包括命令文件，而不仅是技能文件。

**理由：** 使用 `delivery: commands`，项目可以在没有技能文件的情况下完全配置。仅技能检测错误地报告"未找到配置的工具"。

**实现：**
- 对于更新流程，如果工具有生成的技能或生成的命令，则将其视为已配置
- 保持迁移工作流扫描行为不变（技能仍然是迁移的事实来源）

### 12. Init 配置文件覆盖是严格验证的

`openspec init --profile` 必须在继续前验证允许的值。

**理由：** 静默接受未知的配置文件值隐藏用户错误并产生隐式回退行为。

**实现：** 仅接受 `core` 和 `custom`；对无效值抛出清晰的 CLI 错误。

## 风险/权衡

**风险：破坏现有用户工作流**
→ 缓解：文件系统是事实，现有安装不受影响。所有工作流通过自定义配置文件可用。

**风险：Propose 工作流复制 ff 逻辑**
→ 缓解：将共享产物生成提取到可重用函数，`propose` 和 `ff` 都调用它。

**风险：全局配置文件管理**
→ 缓解：首次使用时创建目录/文件。优雅处理缺失文件（使用默认值）。

**风险：自动检测误报**
→ 缓解：显示检测到的工具并要求确认，不要静默自动安装。

**权衡：Core 配置文件只有 4 个工作流**
→ 可接受：这些涵盖了主要循环。需要更多的用户可以使用 `openspec config profile` 选择额外的工作流。

## 迁移计划

1. **第一阶段：添加基础设施**
   - 用 profile/delivery/workflows 字段扩展 global-config.ts
   - 配置文件定义和解析
   - 工具自动检测

2. **第二阶段：创建 propose 工作流**
   - 组合 new + ff 的新模板
   - 带解释性输出的增强用户体验

3. **第三阶段：更新 init 流程**
   - 带工具确认的智能默认
   - 自动检测并确认工具
   - 尊重配置文件/交付设置

4. **第四阶段：添加 config profile 命令**
   - `openspec config profile` 交互式选择器
   - `openspec config profile core` 预设快捷方式

5. **第五阶段：更新 update 命令**
   - 读取全局配置的配置文件/交付
   - 从配置文件添加缺失的工作流
   - 当交付更改时删除文件（如 `skills` 时移除命令）
   - 显示更改摘要

6. **第六阶段：修复多选用户体验**
   - 更新 searchable-multi-select 中的键绑定

**回滚：** 所有更改都是增量的。通过选择所有工作流的自定义配置文件保留现有行为。
