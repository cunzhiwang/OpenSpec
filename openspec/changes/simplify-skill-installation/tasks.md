## 1. 全局配置扩展

- [x] 1.1 用 `profile`、`delivery` 和 `workflows` 字段扩展 `src/core/global-config.ts` 模式
- [x] 1.2 为 profile（`core` | `custom`）、delivery（`both` | `skills` | `commands`）和 workflows（字符串数组）添加 TypeScript 类型
- [x] 1.3 更新 `GlobalConfig` 接口和默认值（profile=`core`，delivery=`both`）
- [x] 1.4 更新现有 `readGlobalConfig()` 以处理带默认值的缺失新字段
- [x] 1.5 添加模式演进测试（没有新字段的现有配置）

## 2. 配置文件系统

- [x] 2.1 创建 `src/core/profiles.ts` 带配置文件定义（core、custom）
- [x] 2.2 定义 `CORE_WORKFLOWS` 常量：`['propose', 'explore', 'apply', 'archive']`
- [x] 2.3 定义 `ALL_WORKFLOWS` 常量包含所有 11 个工作流
- [x] 2.4 在 `src/core/shared/tool-detection.ts` 中添加 `COMMAND_IDS` 常量（与现有 SKILL_NAMES 并行）
- [x] 2.5 实现 `getProfileWorkflows(profile, customWorkflows?)` 解析器函数
- [x] 2.6 添加配置文件解析测试

## 3. Config Profile 命令（交互式选择器）

- [x] 3.1 在 `src/commands/config.ts` 中添加 `config profile` 子命令
- [x] 3.2 实现带交付选择的交互式选择器 UI（skills/commands/both）
- [x] 3.3 实现带工作流切换的交互式选择器 UI
- [x] 3.4 在选择器中预选当前配置值
- [x] 3.5 确认时更新全局配置（仅配置，无文件重新生成）
- [x] 3.6 显示更新后消息："配置已更新。在你的项目中运行 `openspec update` 以应用。"
- [x] 3.7 检测是否在 OpenSpec 项目内运行并提供自动运行更新
- [x] 3.8 实现 `config profile core` 预设快捷方式（保留交付设置）
- [x] 3.9 处理非交互模式：带有帮助消息的错误
- [x] 3.10 更新 `openspec config list` 以显示 profile、delivery 和 workflows 设置（指示默认值 vs 显式）
- [x] 3.11 添加 config profile 命令和 config list 输出的测试

## 4. 可用工具检测

- [x] 4.1 创建 `src/core/available-tools.ts`（与现有 `tool-detection.ts` 分开）
- [x] 4.2 实现 `getAvailableTools(projectPath)` 扫描 AI 工具目录（`.claude/`、`.cursor/` 等）
- [x] 4.3 使用 `AI_TOOLS` 配置将目录名称映射到工具 ID
- [x] 4.4 添加可用工具检测测试，包括跨平台路径

## 5. Propose 工作流模板

- [x] 5.1 创建 `src/core/templates/workflows/propose.ts`
- [x] 5.2 实现组合 new + ff 行为的技能模板
- [x] 5.3 确保 propose 在生成产物前通过 `openspec new change` 创建 `.openspec.yaml`
- [x] 5.4 向模板添加入门风格的解释性输出
- [x] 5.5 为 propose 实现命令模板
- [x] 5.6 从 `src/core/templates/skill-templates.ts` 导出模板
- [x] 5.7 在 `src/core/shared/tool-detection.ts` 中向 `SKILL_NAMES` 添加 `openspec-propose`
- [x] 5.8 在 `src/core/shared/skill-generation.ts` 中向命令模板添加 `propose`
- [x] 5.9 在 `src/core/shared/tool-detection.ts` 中向 `COMMAND_IDS` 添加 `propose`
- [x] 5.10 添加 propose 模板测试（创建变更，生成产物，等效于 new + ff）

## 6. 条件技能/命令生成

- [x] 6.1 更新 `getSkillTemplates()` 以接受配置文件过滤参数
- [x] 6.2 更新 `getCommandTemplates()` 以接受配置文件过滤参数
- [x] 6.3 更新 init.ts 中的 `generateSkillsAndCommands()` 以尊重交付设置
- [x] 6.4 添加当交付为 'commands' 时跳过技能生成的逻辑
- [x] 6.5 添加当交付为 'skills' 时跳过命令生成的逻辑
- [x] 6.6 添加条件生成测试

## 7. Init 流程更新

- [x] 7.1 更新 init 以首先调用 `getAvailableTools()`
- [x] 7.2 更新 init 以读取全局配置的配置文件/交付默认值
- [x] 7.3 向 init 添加迁移检查：在配置文件解析前调用共享 `migrateIfNeeded()`
- [x] 7.4 更改工具选择以显示预选检测到的工具
- [x] 7.5 在 init 中直接应用配置的配置文件（无配置文件确认提示）
- [x] 7.6 更新成功消息以显示 `/opsx:propose` 提示（仅当 propose 在活跃配置文件中时）
- [x] 7.7 添加 `--profile` 标志以覆盖全局配置
- [x] 7.8 更新非交互模式以使用默认值而不提示
- [x] 7.9 添加各种场景的 init 流程测试（包括重新初始化时的迁移和自定义配置文件行为）

## 8. Update 命令（配置文件支持 + 迁移）

- [x] 8.1 修改现有 `src/commands/update.ts` 以读取全局配置的 profile/delivery/workflows
- [x] 8.2 实现共享 `scanInstalledWorkflows(projectPath, tools)` — 扫描工具目录，仅匹配 `ALL_WORKFLOWS` 常量，返回跨工具的并集
- [x] 8.3 实现共享 `migrateIfNeeded(projectPath, tools)` — `init` 和 `update` 都使用的一次性迁移逻辑
- [x] 8.4 显示迁移消息："已迁移：自定义配置文件包含 N 个工作流" + "此版本新功能：/opsx:propose。尝试 'openspec config profile core' 获得精简体验。"
- [x] 8.5 添加项目检查：如果不存在 `openspec/` 目录则退出并报错
- [x] 8.6 添加检测哪些工作流在配置中但未安装的逻辑（要添加）
- [x] 8.7 添加检测哪些工作流已安装且需要刷新的逻辑（要更新）
- [x] 8.8 尊重交付设置：如果 `skills` 仅生成技能，如果 `commands` 仅生成命令
- [x] 8.9 交付更改时删除文件：如果 `skills` 移除命令，如果 `commands` 移除技能
- [x] 8.10 为配置文件中缺失的工作流生成新工作流文件
- [x] 8.11 显示摘要："已添加：X、Y" / "已更新：Z" / "已移除：N 个文件" / "已是最新。"
- [x] 8.12 在输出中列出受影响的工具："工具：Claude Code、Cursor"
- [x] 8.13 检测当前未配置的新工具目录并显示重新初始化提示
- [x] 8.14 添加迁移场景测试（现有用户、部分工作流、多个工具、幂等、忽略自定义技能）
- [x] 8.15 添加带配置文件场景的更新命令测试（包括交付更改、项目外错误、新工具检测）

## 9. 工具选择用户体验修复

- [x] 9.1 更新 `src/prompts/searchable-multi-select.ts` 键绑定
- [x] 9.2 更改空格为切换选择
- [x] 9.3 更改回车为确认选择
- [x] 9.4 移除 Tab 确认行为
- [x] 9.5 添加提示文本"空格切换，回车确认"
- [x] 9.6 添加键绑定行为测试

## 10. 脚手架验证

- [x] 10.1 验证 `openspec new change` 创建带 schema 和 created 字段的 `.openspec.yaml`

<!-- 注意：下面的 10.2 和 10.3 是潜在的后续工作，不是此变更的核心 -->
<!-- - [ ] 10.2 更新 ff 技能以验证 `openspec new change` 后 `.openspec.yaml` 存在 -->
<!-- - [ ] 10.3 向技能添加护栏："永远不要手动在 openspec/changes/ 中创建文件 - 使用 openspec new change" -->

## 11. 模板下一步指导

- [x] 11.1 审计所有模板中硬编码的跨工作流命令引用（如 `/opsx:propose`）
- [x] 11.2 用通用基于概念的指导替换任何特定命令引用（如"创建变更提案"）
- [x] 11.3 审查 explore → propose 过渡用户体验（见 `openspec/explorations/explore-workflow-ux.md` 中的开放问题）

## 12. 集成和手动测试

- [x] 12.1 运行完整测试套件并修复任何失败
- [x] 12.2 在 Windows 上测试（或验证 CI 在 Windows 上通过）
- [x] 12.3 测试端到端流程：init → propose → apply → archive
- [x] 12.4 更新新命令的 CLI 帮助文本
- [x] 12.5 手动：交互式 init — 验证检测到的工具预选、确认提示工作、成功消息正确
- [x] 12.6 手动：`openspec config profile` 选择器 — 验证交付切换、工作流切换、当前值预选、core 预设快捷方式
- [x] 12.7 手动：使用自定义配置文件的 init — 验证 init 在无配置文件确认提示情况下继续
- [x] 12.8 手动：通过更新的交付更改 — 验证在 skills/commands/both 之间切换时正确删除/创建文件
- [x] 12.9 手动：迁移流程 — 在配置中没有配置文件的现有项目上运行更新，验证迁移消息和结果配置

## 13. 实施后加固（审查后续）

- [x] 13.1 确保 `update` 即使模板是当前的也将配置文件/交付漂移视为需要更新
- [x] 13.2 确保 `update` 将仅命令安装识别为已配置的工具
- [x] 13.3 确保 `init` 验证 `--profile` 值并在无效覆盖时报错
- [x] 13.4 确保重新运行 `init` 应用交付清理（移除不匹配当前交付模式的文件）
- [x] 13.5 添加/调整配置漂移同步、仅命令检测、无效配置文件覆盖和重新初始化交付清理的回归测试
