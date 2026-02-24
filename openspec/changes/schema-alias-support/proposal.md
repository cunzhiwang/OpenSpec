## 为什么

我们想将 `spec-driven` 重命名为 `openspec-default` 以更好地反映它是标准/默认工作流。然而，直接重命名会破坏在其 `openspec/config.yaml` 中有 `schema: spec-driven` 的现有项目。添加别名支持允许两个名称可互换使用，实现平滑过渡且无破坏性更改。

## 变更内容

- 在模式解析器中添加模式别名解析
- `openspec-default` 和 `spec-driven` 都将解析为同一个模式
- 物理目录保持为 `schemas/spec-driven/`（或可以重命名为 `schemas/openspec-default/`，以 `spec-driven` 作为别名）
- 所有 CLI 命令和配置文件接受任一名称
- 现有用户配置无需更改

## 能力

### 新能力

- `schema-aliases`：支持模式名称别名，使多个名称可以解析到同一个模式目录

### 修改的能力

<!-- 没有现有规范级行为在变化 - 这纯粹是增量功能 -->

## 影响

- `src/core/artifact-graph/resolver.ts` - 添加别名解析逻辑
- `schemas/` 目录 - 可能将 `spec-driven` 重命名为 `openspec-default`
- 文档 - 更新为首选 `openspec-default`，同时说明 `spec-driven` 仍然有效
- 默认模式常量 - 将 `DEFAULT_SCHEMA` 更新为 `openspec-default`
