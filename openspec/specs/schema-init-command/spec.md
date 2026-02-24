# schema-init-command 规范

## 目的
定义 `openspec schema init` 行为，用于在交互和非交互模式下创建项目本地模式骨架。

## 需求
### 需求：Schema init 命令创建项目本地模式
CLI 应当提供 `openspec schema init <name>` 命令，在 `openspec/schemas/<name>/` 下创建新的模式目录，包含有效的 `schema.yaml` 文件和默认模板文件。

#### 场景：使用有效名称创建模式
- **当** 用户运行 `openspec schema init my-workflow` 时
- **则** 系统创建目录 `openspec/schemas/my-workflow/`
- **且** 创建带有 name、version、description 和 artifacts 数组的 `schema.yaml`
- **且** 创建由 artifacts 引用的模板文件
- **且** 显示成功消息及创建的路径

#### 场景：拒绝无效模式名称
- **当** 用户运行 `openspec schema init "My Workflow"`（包含空格）时
- **则** 系统显示关于无效模式名称的错误
- **且** 建议使用 kebab-case 格式
- **且** 以非零代码退出

#### 场景：模式名称已存在
- **当** 用户运行 `openspec schema init existing-schema` 且 `openspec/schemas/existing-schema/` 已存在时
- **则** 系统显示模式已存在的错误
- **且** 建议使用 `--force` 覆盖或 `schema fork` 复制
- **且** 以非零代码退出

### 需求：Schema init 支持交互模式
CLI 应当在交互终端中运行且没有显式标志时提示模式配置。

#### 场景：交互式提示描述
- **当** 用户在交互终端中运行 `openspec schema init my-workflow` 时
- **则** 系统提示模式描述
- **且** 在生成的 `schema.yaml` 中使用提供的描述

#### 场景：交互式提示产物选择
- **当** 用户在交互终端中运行 `openspec schema init my-workflow` 时
- **则** 系统显示带有常见产物（proposal、specs、design、tasks）的多选提示
- **且** 每个选项包含简要描述
- **且** 在生成的 `schema.yaml` 中使用选中的产物

#### 场景：带标志的非交互模式
- **当** 用户运行 `openspec schema init my-workflow --description "My workflow" --artifacts proposal,tasks` 时
- **则** 系统无提示创建模式
- **且** 使用标志值进行配置

### 需求：Schema init 支持设置项目默认值
CLI 应当提供将新创建的模式设置为项目默认值的选项。

#### 场景：交互式设置为默认
- **当** 用户在交互模式下运行 `openspec schema init my-workflow` 时
- **且** 用户确认设置为默认
- **则** 系统更新 `openspec/config.yaml`，添加 `defaultSchema: my-workflow`

#### 场景：通过标志设置为默认
- **当** 用户运行 `openspec schema init my-workflow --default` 时
- **则** 系统创建模式并更新 `openspec/config.yaml`，添加 `defaultSchema: my-workflow`

#### 场景：跳过设置默认
- **当** 用户运行 `openspec schema init my-workflow --no-default` 时
- **则** 系统创建模式而不修改 `openspec/config.yaml`

### 需求：Schema init 输出 JSON 格式
CLI 应当支持 `--json` 标志以提供机器可读输出。

#### 场景：成功时的 JSON 输出
- **当** 用户运行 `openspec schema init my-workflow --json --description "Test" --artifacts proposal` 时
- **则** 系统输出带有 `created: true`、`path` 和 `schema` 字段的 JSON
- **且** 不显示交互式提示或加载指示

#### 场景：错误时的 JSON 输出
- **当** 用户运行 `openspec schema init "invalid name" --json` 时
- **则** 系统输出带有描述问题的 `error` 字段的 JSON
- **且** 以非零代码退出
