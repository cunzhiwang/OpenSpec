## 为什么

用户抱怨技能/命令太多（目前有 10 个），新用户感到不知所措。我们想简化默认体验，同时保留高级用户能力和向后兼容性。

目标：**让用户在一分钟内达到"啊哈时刻"**。

```text
0:00  $ openspec init
      ✓ 完成。运行 /opsx:propose "你的想法"

0:15  /opsx:propose "添加用户认证"

0:45  代理创建 proposal.md、design.md、tasks.md
      "哇，它为我规划了整个事情" ← 啊哈

1:00  /opsx:apply
```

此外，用户对工作流如何交付有不同的偏好（技能 vs 命令 vs 两者），但这应该是高级用户配置，而不是新用户需要考虑的事情。

## 变更内容

### 1. 智能默认 Init

Init 自动检测工具并要求确认：

```text
$ openspec init

检测到的工具：
  [x] Claude Code
  [x] Cursor
  [ ] Windsurf

按 Enter 确认，或按空格切换

正在设置 OpenSpec...
✓ 完成

开始你的第一个变更：
  /opsx:propose "添加深色模式"
```

**不提示配置文件或交付。** 默认值是：
- 配置文件：core
- 交付：both

高级用户可以通过 `openspec config profile` 自定义。

### 2. 工具检测行为

Init 扫描现有工具目录（`.claude/`、`.cursor/` 等）：
- **检测到工具（交互式）：** 显示预选复选框，用户确认或调整
- **未检测到工具（交互式）：** 提示完整的工具选择
- **非交互式（CI）：** 自动使用检测到的工具，如果未检测到则失败

### 3. 修复工具选择用户体验

当前行为让用户困惑：
- Tab 确认（意外）

新行为：
- **空格** 切换选择
- **Enter** 确认

### 4. 引入配置文件

配置文件定义安装哪些工作流：

- **core**（默认）：`propose`、`explore`、`apply`、`archive`（4 个工作流）
- **custom**：用户选择的工作流子集

`propose` 工作流是新的 - 它将 `new` + `ff` 合并为一个命令，创建变更并生成所有产物。

### 5. 改进的 Propose 用户体验

`/opsx:propose` 应该通过解释它正在做什么来自然地引导用户：

```text
我将创建一个包含 3 个产物的变更：
- proposal.md（什么和为什么）
- design.md（如何）
- tasks.md（实施步骤）

准备好实施后，运行 /opsx:apply
```

这边学边教 - 大多数用户不需要单独的入门。

### 6. 引入交付配置

交付控制工作流如何安装：

- **both**（默认）：技能和命令
- **skills**：仅技能
- **commands**：仅命令

存储在现有全局配置（`~/.config/openspec/config.json`）中。init 期间不提示。

### 7. 新 CLI 命令

```shell
# 配置文件配置（交付 + 工作流的交互式选择器）
openspec config profile          # 交互式选择器
openspec config profile core     # 预设快捷方式（core 工作流，保留交付）
```

交互式选择器允许用户在一个地方配置交付方法和工作流选择：

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
[ ] continue
[ ] verify
[ ] sync
[ ] bulk-archive
[ ] onboard
```

### 8. 向后兼容性和迁移

**现有用户保持当前设置。** 当 `openspec update` 在具有现有工作流且全局配置中没有 `profile` 的项目上运行时，它执行一次性迁移：

1. 扫描项目中所有工具目录中已安装的工作流文件
2. 将 `profile: "custom"`、`delivery: "both"`、`workflows: [<detected>]` 写入全局配置
3. 刷新模板但不添加或移除任何工作流
4. 显示："已迁移：自定义配置文件包含 N 个现有工作流"

迁移后，后续的 `init` 和 `update` 命令尊重迁移的配置。

**关键行为：**
- 现有用户的工作流完全按原样保留（不会自动添加 `propose`）
- 如果未设置配置文件，`init`（重新初始化）和 `update` 都会在现有项目上触发迁移
- 在**新**项目上（没有现有工作流）的 `openspec init` 使用全局配置，默认为 `core`
- 使用自定义配置文件的 `init` 直接应用配置的工作流（无配置文件确认提示）
- `init` 验证 `--profile` 值（`core` 或 `custom`）并在无效输入时报错
- 迁移消息提到 `propose` 并建议 `openspec config profile core` 以选择加入
- 迁移后，用户可以通过 `openspec config profile core` 选择加入 `core` 配置文件
- 工作流模板在"下一步"指导中有条件地仅引用已安装的工作流
- 交付更改会应用：切换到 `skills` 会移除命令文件，切换到 `commands` 会移除技能文件
- 重新运行 `init` 在现有项目上应用交付清理（移除不再匹配交付的文件）
- `update` 即使模板版本已经是当前的，也将配置文件/交付漂移视为需要更新
- `update` 将仅命令安装视为已配置的工具
- 所有工作流通过自定义配置文件保持可用

## 能力

### 新能力

- `profiles`：工作流配置文件（core、custom）、交付偏好、全局配置存储、交互式选择器
- `propose-workflow`：创建变更 + 生成所有产物的组合工作流

### 修改的能力

- `cli-init`：带工具自动检测的智能默认、基于配置文件的技能/命令生成
- `cli-update`：配置文件支持、交付更改、现有用户的一次性迁移

## 影响

### 新文件
- `src/core/templates/workflows/propose.ts` - 新的 propose 工作流模板
- `src/core/profiles.ts` - 配置文件定义和逻辑
- `src/core/available-tools.ts` - 从目录检测用户有哪些 AI 工具

### 修改的文件
- `src/core/init.ts` - 智能默认、自动检测、工具确认
- `src/core/config.ts` - 添加配置文件和交付类型
- `src/core/global-config.ts` - 向模式添加 profile、delivery、workflows 字段
- `src/core/shared/skill-generation.ts` - 按配置文件过滤，尊重交付
- `src/core/shared/tool-detection.ts` - 更新 SKILL_NAMES 和 COMMAND_IDS 以包含 propose
- `src/commands/config.ts` - 添加带交互式选择器的 `profile` 子命令
- `src/core/update.ts` - 添加配置文件/交付支持、交付更改的文件删除
- `src/prompts/searchable-multi-select.ts` - 修复键绑定（空格/回车）

### 全局配置模式扩展
```json
// ~/.config/openspec/config.json（扩展现有）
{
  "telemetry": { ... },          // 现有
  "featureFlags": { ... },       // 现有
  "profile": "core",             // 新：core | custom
  "delivery": "both",            // 新：both | skills | commands
  "workflows": ["propose", ...]  // 新：仅当 profile: custom 时
}
```

## 配置文件参考

| 配置文件 | 工作流 | 描述 |
|---------|--------|------|
| core | propose、explore、apply、archive | 大多数用户的精简流程（默认） |
| custom | 用户定义 | 通过 `openspec config profile` 精确选择你需要的 |
