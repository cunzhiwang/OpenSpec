## 上下文

OpenSpec 目前有强大的构建块（工作流模板、命令适配器、生成助手），但编排关注点是分布的：

- 工作流定义和投影列表是分开维护的
- 工具支持在多个地方表示，有部分重叠
- 转换可以在模板渲染时和单个适配器内部发生
- `init`/`update`/遗留升级各自运行相似的写入管道，但有细微差异

设计目标是在使扩展点显式和确定性的同时保留当前行为。

## 目标/非目标

**目标：**
- 为工作流内容和元数据定义一个规范来源
- 使工具/代理特定行为显式且可集中发现
- 保持命令适配器作为工具语法差异的格式化边界
- 将产物生成/写入编排整合到一个可重用的引擎中
- 通过可强制执行的验证和对等测试提高正确性

**非目标：**
- 重新设计命令语义或工作流指令内容
- 在此提案中更改用户可见的 CLI 命令名称/标志
- 合并与产物生成重用无关的遗留清理行为

## 决策

### 1. 规范 `WorkflowManifest`

**决策**：在包含规范技能和命令定义以及元数据默认值的清单条目中表示每个工作流一次。

建议形状：

```ts
interface WorkflowManifestEntry {
  workflowId: string; // 例如 'explore'、'ff'、'onboard'
  skillDirName: string; // 例如 'openspec-explore'
  skill: SkillTemplate;
  command?: CommandTemplate;
  commandId?: string;
  tags: string[];
  compatibility: string;
}
```

**理由**：
- 消除多个手动维护数组之间的漂移
- 使工作流完整性在一个地方可测试
- 在集中注册的同时保持拆分的工作流模块

### 2. 用于能力连接的 `ToolProfileRegistry`

**决策**：添加一个工具配置文件层，将工具 ID 映射到生成能力和行为。

建议形状：

```ts
interface ToolProfile {
  toolId: string;
  skillsDir?: string;
  commandAdapterId?: string;
  transforms: string[];
}
```

**理由**：
- 防止 `AI_TOOLS`、适配器注册表和检测逻辑之间的能力漂移
- 允许有意的"仅技能"工具而无隐式特殊处理
- 提供一个地方来回答"这个工具支持什么？"

### 3. 一流转换管道

**决策**：将转换建模为具有范围 + 阶段 + 适用性的有序插件。

建议形状：

```ts
interface ArtifactTransform {
  id: string;
  scope: 'skill' | 'command' | 'both';
  phase: 'preAdapter' | 'postAdapter';
  priority: number;
  applies(ctx: GenerationContext): boolean;
  transform(content: string, ctx: GenerationContext): string;
}
```

执行顺序：
1. 从清单渲染规范内容
2. 应用匹配的 `preAdapter` 转换
3. 对于命令，运行适配器格式化
4. 应用匹配的 `postAdapter` 转换
5. 验证和写入

**理由**：
- 保持适配器专注于工具格式化，而不是分散的行为重写
- 使代理特定修改显式且可测试
- 替换 `init`/`update` 中的临时转换调用

### 4. 共享 `ArtifactSyncEngine`

**决策**：引入由所有生成入口点使用的单一编排引擎。

职责：
- 从 `(工作流 × 选定工具 × 产物类型)` 构建生成计划
- 运行渲染/转换/适配器管道
- 验证输出
- 写入文件并返回结果摘要

**理由**：
- 移除跨 init/update 路径的重复循环和不同行为
- 启用空运行和未来预览功能而无需重新实现逻辑
- 提高更新和遗留迁移的可靠性

### 5. 验证 + 对等护栏

**决策**：在测试中添加严格检查（开发构建中可选运行时断言）用于：

- 所有清单条目存在必需的技能元数据字段（`license`、`compatibility` 和 `metadata`）
- 投影一致性（技能、命令、检测名称从清单派生）
- 工具配置文件一致性（适配器存在、预期能力）
- 关键工作流/工具的黄金/对等输出

**理由**：
- 将先前的审查问题转换为强制执行的不变量
- 在启用内部重构的同时保持输出保真度
- 使回归在 CI 期间明显

## 风险/权衡

**风险：迁移复杂性**
广泛的重构可能会破坏生成路径的稳定性。
→ 缓解：分阶段引入，在切换前进行对等测试。

**风险：过度抽象**
太多层可能会模糊简单流程。
→ 缓解：保持接口最小化，将注册表与生成代码放在一起。

**权衡：更多前期结构**
添加清单/配置文件/转换注册表增加了概念表面积。
→ 接受：这个成本被减少的漂移和更容易的扩展所抵消。

## 实现方法

1. 在当前公共 API 后面构建清单 + 配置文件 + 转换类型和注册表
2. 重新连接 `getSkillTemplates`/`getCommandContents` 以从清单派生
3. 引入 `ArtifactSyncEngine` 并切换 `init` 以使用它进行对等检查
4. 将 `update` 和遗留升级流程切换到同一引擎
5. 在对等测试通过后移除重复/硬编码列表
