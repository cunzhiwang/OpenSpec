# context-injection 规范

## 目的
定义如何将来自 `openspec/config.yaml` 的项目上下文注入到工作流指令中，同时保留源文本和格式。

## 需求
### 需求：将上下文注入所有产物指令

系统应当将项目配置中的 context 字段注入到所有产物的指令中，包装在 XML 风格的 `<context>` 标签中。

#### 场景：配置有 context 字段
- **当** 配置包含 `context: "Tech stack: TypeScript, React"` 时
- **则** 指令输出包含 `<context>\nTech stack: TypeScript, React\n</context>`

#### 场景：配置没有 context 字段
- **当** 配置省略 context 字段或 context 为 undefined 时
- **则** 指令输出不包含 `<context>` 标签

#### 场景：Context 是多行字符串
- **当** 配置包含多行的 context 时
- **则** 指令输出在 `<context>` 标签内保留换行符

#### 场景：Context 应用于所有产物
- **当** 为任何产物（proposal、specs、design、tasks）加载指令时
- **则** context 部分出现在所有指令输出中

### 需求：使用 XML 风格标签格式化上下文

系统应当将 context 内容包装在 `<context>` 开始标签和 `</context>` 结束标签中，内容在单独的行上。

#### 场景：Context 标签结构
- **当** 将 context 注入指令时
- **则** 格式严格为 `<context>\n{content}\n</context>\n\n`

#### 场景：Context 出现在模板之前
- **当** 生成带有 context 的指令时
- **则** `<context>` 部分出现在 `<template>` 部分之前

### 需求：完全按提供的方式保留 context 内容

系统应当在不修改、转义或解释的情况下注入 context 内容。

#### 场景：Context 包含特殊字符
- **当** context 包含 `<`、`>`、`&`、引号等字符时
- **则** 字符完全按配置中的写法保留

#### 场景：Context 包含 URL
- **当** context 包含 URL 如 "docs at https://example.com" 时
- **则** URL 在注入内容中完全保留

#### 场景：Context 包含 Markdown
- **当** context 包含 Markdown 格式如 `**bold**` 或 `[links](url)` 时
- **则** Markdown 保留而不渲染或转义
