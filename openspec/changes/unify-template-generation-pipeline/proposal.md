## 为什么

最近将 `skill-templates.ts` 拆分为工作流模块提高了可读性，但生成管道仍然分散在多个层：

- 工作流定义与投影逻辑分离（`getSkillTemplates`、`getCommandTemplates`、`getCommandContents`）
- 工具能力和兼容性分布在 `AI_TOOLS`、`CommandAdapterRegistry` 和硬编码列表如 `SKILL_NAMES` 中
- 代理/工具特定转换（例如 OpenCode 命令引用重写）在不同地方应用（`init`、`update` 和适配器代码）
- 产物写入逻辑在 `init`、`update` 和遗留升级流程中重复

这种碎片化造成漂移风险（缺失导出、缺失元数据对等、不匹配计数/支持），使未来的工作流/工具添加更慢且更不可预测。

## 变更内容

- 引入规范的 `WorkflowManifest` 作为所有工作流产物的单一事实来源
- 引入 `ToolProfileRegistry` 以集中工具能力（技能路径、命令适配器、转换）
- 引入具有显式阶段（`preAdapter`、`postAdapter`）和范围（`skill`、`command`、`both`）的一流转换管道
- 引入由 `init`、`update` 和遗留升级路径使用的共享 `ArtifactSyncEngine`
- 添加严格验证和测试护栏以在迁移和未来更改期间保持保真度

## 能力

### 新能力

- `template-artifact-pipeline`：用于技能/命令生成的统一工作流清单、工具配置文件注册表、转换管道和同步引擎

### 修改的能力

- `command-generation`：扩展以支持围绕适配器渲染的有序转换阶段
- `cli-init`：使用共享产物同步编排而不是定制循环
- `cli-update`：使用共享产物同步编排而不是定制循环

## 影响

- **主要重构区域**：
  - `src/core/templates/*`
  - `src/core/shared/skill-generation.ts`
  - `src/core/command-generation/*`
  - `src/core/init.ts`
  - `src/core/update.ts`
  - `src/core/shared/tool-detection.ts`
- **测试添加**：
  - 清单完整性测试（工作流、必需元数据、投影对等）
  - 转换排序和适用性测试
  - 跨工具生成的技能/命令输出的端到端对等测试
- **用户可见行为**：
  - 不需要新的 CLI 表面区域
  - 现有生成的产物保持行为等效，除非在未来增量中显式更改
