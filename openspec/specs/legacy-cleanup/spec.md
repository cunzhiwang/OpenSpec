# legacy-cleanup 规范

## 目的
定义在初始化和更新工作流期间对遗留 OpenSpec 产物的检测和清理行为。

## 需求
### 需求：遗留产物检测

系统应当检测来自先前初始化版本的遗留 OpenSpec 产物。

#### 场景：检测遗留配置文件

- **当** 在现有项目上运行 `openspec init` 时
- **则** 系统应当检查带有 OpenSpec 标记的配置文件：
  - `CLAUDE.md`
  - `.cursorrules`
  - `.windsurfrules`
  - `.clinerules`
  - `.kilocode_rules`
  - `.github/copilot-instructions.md`
  - `.amazonq/instructions.md`
  - `CODEBUDDY.md`
  - `IFLOW.md`
  - 以及来自遗留 ToolRegistry 的所有其他工具配置文件

#### 场景：检测遗留斜杠命令目录

- **当** 在现有项目上运行 `openspec init` 时
- **则** 系统应当检查旧的斜杠命令目录：
  - `.claude/commands/openspec/`
  - `.cursor/commands/openspec/`（注意：旧格式在 commands 根目录使用 `openspec-*.md`）
  - `.windsurf/workflows/openspec-*.md`
  - 以及遗留 SlashCommandRegistry 中所有工具的等效目录

#### 场景：检测遗留 OpenSpec 结构文件

- **当** 在现有项目上运行 `openspec init` 时
- **则** 系统应当检查：
  - `openspec/AGENTS.md`
  - `openspec/project.md`（仅用于迁移消息，不删除）
  - 带有 OpenSpec 标记的根 `AGENTS.md`

### 需求：遗留清理确认

系统应当在移除遗留产物之前提示确认。

#### 场景：检测到遗留时提示清理

- **当** 检测到遗留产物时
- **则** 系统应当显示发现的内容
- **且** 提示："Legacy files detected. Upgrade and clean up? [Y/n]"
- **且** 如果用户按 Enter 则默认为 Yes

#### 场景：用户确认清理

- **当** 用户回复 Y 或按 Enter 时
- **则** 系统应当移除遗留产物
- **且** 继续进行基于技能的设置

#### 场景：用户拒绝清理

- **当** 用户回复 N 时
- **则** 系统应当中止初始化
- **且** 显示建议手动清理或使用 `--force` 标志的消息

#### 场景：非交互模式

- **当** 使用 `--no-interactive` 运行或在 CI 环境中时
- **且** 检测到遗留产物
- **则** 系统应当以退出代码 1 中止
- **且** 显示检测到的遗留产物
- **且** 建议交互式运行或使用 `--force` 标志

### 需求：配置文件内容的精确移除

系统应当在从配置文件移除 OpenSpec 标记时保留用户内容。

#### 场景：配置文件只有 OpenSpec 内容

- **当** 配置文件只包含 OpenSpec 标记块（外部空白可接受）时
- **则** 系统应当移除 OpenSpec 标记块
- **且** 保留文件（即使为空或只有空白）
- **且** 不删除文件（配置文件属于用户的项目根目录）

#### 场景：配置文件有混合内容

- **当** 配置文件在 OpenSpec 标记外包含内容时
- **则** 系统应当仅移除 `<!-- OPENSPEC:START -->` 到 `<!-- OPENSPEC:END -->` 块
- **且** 保留标记前后的所有内容
- **且** 清理任何产生的双空行

#### 场景：根 AGENTS.md 有混合内容

- **当** 根 `AGENTS.md` 包含 OpenSpec 标记和其他内容时
- **则** 系统应当仅移除 OpenSpec 标记块
- **且** 保留文件的其余部分

### 需求：遗留目录移除

系统应当完全移除遗留斜杠命令目录。

#### 场景：移除旧斜杠命令目录

- **当** 遗留斜杠命令目录存在时（例如 `.claude/commands/openspec/`）
- **则** 系统应当删除整个目录及其内容
- **且** 不删除父目录（例如 `.claude/commands/` 保留）

#### 场景：移除遗留 AGENTS.md

- **当** `openspec/AGENTS.md` 存在时
- **则** 系统应当删除该文件
- **且** 不删除 `openspec/` 目录本身

### 需求：project.md 迁移提示

系统应当保留 project.md 并显示迁移提示而不是删除它。

#### 场景：升级期间 project.md 存在

- **当** 遗留清理期间 `openspec/project.md` 存在时
- **则** 系统不应当删除该文件
- **且** 系统应当在输出中显示迁移提示：
  ```
  Manual migration needed:
    → openspec/project.md still exists
      Move useful content to config.yaml's "context:" field, then delete
  ```

#### 场景：project.md 迁移理由

- **给定** project.md 可能包含用户编写的项目文档
- **且** config.yaml 的 context 字段服务于相同目的（自动注入到产物中）
- **当** 显示迁移提示时
- **则** 用户可以手动迁移或使用 `/opsx:explore` 获取 AI 辅助

### 需求：清理报告

系统应当报告清理了什么。

#### 场景：显示清理摘要

- **当** 遗留清理完成时
- **则** 系统应当显示摘要部分：
  ```
  Cleaned up legacy files:
    ✓ Removed OpenSpec markers from CLAUDE.md
    ✓ Removed .claude/commands/openspec/ (replaced by /opsx:*)
    ✓ Removed openspec/AGENTS.md (no longer needed)
  ```
- **且如果** `openspec/project.md` 存在
- **则** 系统应当显示单独的迁移部分：
  ```
  Manual migration needed:
    → openspec/project.md still exists
      Move useful content to config.yaml's "context:" field, then delete
  ```

#### 场景：未检测到遗留

- **当** 未找到遗留产物时
- **则** 系统不应当显示清理部分
- **且** 直接进行技能设置
