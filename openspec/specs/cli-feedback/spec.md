# cli-feedback 规范

## 目的
定义 `openspec feedback` 行为，通过 `gh` 安全地创建 GitHub issues，并在自动化不可用时提供手动回退。

## 需求
### 需求：反馈命令

系统应当提供 `openspec feedback` 命令，使用 `gh` CLI 在 openspec 仓库中创建 GitHub Issue。系统应当使用带参数数组的 `execFileSync` 来防止 shell 注入漏洞。

#### 场景：简单反馈提交

- **当** 用户执行 `openspec feedback "Great tool!"` 时
- **则** 系统执行 `gh issue create`，标题为 "Feedback: Great tool!"
- **且** 在 openspec 仓库中创建 issue
- **且** issue 带有 `feedback` 标签
- **且** 系统显示创建的 issue URL

#### 场景：安全命令执行

- **当** 通过 `gh` CLI 提交反馈时
- **则** 系统使用带独立参数数组的 `execFileSync`
- **且** 用户输入不通过 shell 传递
- **且** shell 元字符（引号、反引号、$() 等）被当作字面文本处理

#### 场景：带正文的反馈

- **当** 用户执行 `openspec feedback "Title here" --body "Detailed description..."` 时
- **则** 系统创建带指定标题的 GitHub Issue
- **且** issue 正文包含详细描述
- **且** issue 正文包含元数据（OpenSpec 版本、平台、时间戳）

### 需求：GitHub CLI 依赖

系统应当在可用时使用 `gh` CLI 进行自动反馈提交，并在 `gh` 未安装或未认证时提供手动提交回退。系统应当使用平台适当的命令来检测 `gh` CLI 可用性。

#### 场景：缺少 gh CLI 时带回退

- **当** 用户运行 `openspec feedback "message"` 时
- **且** `gh` CLI 未安装（PATH 中找不到）
- **则** 系统显示警告："GitHub CLI not found. Manual submission required."
- **且** 输出带分隔符的结构化反馈内容：
  - "--- FORMATTED FEEDBACK ---"
  - 标题行
  - 标签行
  - 带元数据的正文内容
  - "--- END FEEDBACK ---"
- **且** 显示预填充的 GitHub issue URL 供手动提交
- **且** 以零代码退出（成功回退）

#### 场景：Unix 上的跨平台 gh CLI 检测

- **当** 系统在 macOS 或 Linux 上运行时（平台为 'darwin' 或 'linux'）
- **且** 检查 `gh` CLI 是否安装
- **则** 系统执行 `which gh` 命令

#### 场景：Windows 上的跨平台 gh CLI 检测

- **当** 系统在 Windows 上运行时（平台为 'win32'）
- **且** 检查 `gh` CLI 是否安装
- **则** 系统执行 `where gh` 命令

#### 场景：未认证的 gh CLI 带回退

- **当** 用户运行 `openspec feedback "message"` 时
- **且** `gh` CLI 已安装但未认证
- **则** 系统显示警告："GitHub authentication required. Manual submission required."
- **且** 输出结构化反馈内容（与缺少 gh CLI 场景格式相同）
- **且** 显示预填充的 GitHub issue URL 供手动提交
- **且** 显示认证指示："To auto-submit in the future: gh auth login"
- **且** 以零代码退出（成功回退）

#### 场景：已认证的 gh CLI

- **当** 用户运行 `openspec feedback "message"` 时
- **且** `gh auth status` 返回成功（已认证）
- **则** 系统继续进行反馈提交

### 需求：Issue 元数据

系统应当在 GitHub Issue 正文中包含相关元数据。

#### 场景：标准元数据

- **当** 为反馈创建 GitHub Issue 时
- **则** issue 正文包含：
  - OpenSpec CLI 版本
  - 平台（darwin、linux、win32）
  - 提交时间戳
  - 分隔行："---\nSubmitted via OpenSpec CLI"

#### 场景：Windows 平台元数据

- **当** 在 Windows 上为反馈创建 GitHub Issue 时
- **则** issue 正文包含 "Platform: win32"
- **且** 所有平台检测使用 Node.js `os.platform()` API

#### 场景：无敏感元数据

- **当** 为反馈创建 GitHub Issue 时
- **则** issue 正文不包含：
  - 用户系统的文件路径
  - 项目名称或目录名称
  - 环境变量
  - IP 地址

### 需求：反馈始终有效

系统应当允许反馈提交，无论遥测设置如何。

#### 场景：禁用遥测时的反馈

- **当** 用户通过 `OPENSPEC_TELEMETRY=0` 禁用了遥测时
- **且** 用户运行 `openspec feedback "message"`
- **则** 反馈仍通过 `gh` CLI 提交
- **且** 不发送遥测事件

#### 场景：CI 环境中的反馈

- **当** 环境中设置了 `CI=true` 时
- **且** 用户运行 `openspec feedback "message"`
- **则** 反馈提交正常进行（如果 `gh` 可用且已认证）

### 需求：错误处理

系统应当优雅地处理反馈提交错误。

#### 场景：gh CLI 执行失败

- **当** `gh issue create` 命令失败时
- **则** 系统显示来自 `gh` CLI 的错误输出
- **且** 以与 `gh` 相同的退出代码退出

#### 场景：网络故障

- **当** `gh` CLI 报告网络连接问题时
- **则** 系统显示来自 `gh` 的错误消息
- **且** 建议检查网络连接
- **且** 以非零代码退出

### 需求：代理反馈技能

系统应当提供 `/feedback` 技能，指导代理收集和提交用户反馈。

#### 场景：代理发起的反馈

- **当** 用户在代理对话中调用 `/feedback` 时
- **则** 代理从对话中收集上下文
- **且** 起草带有丰富内容的反馈 issue
- **且** 匿名化敏感信息
- **且** 向用户展示草稿以供批准
- **且** 在用户确认后通过 `openspec feedback` 命令提交

#### 场景：上下文丰富

- **当** 代理起草反馈时
- **则** 代理包含相关上下文，如：
  - 正在执行什么任务
  - 什么工作得好或不好
  - 具体的摩擦点或赞扬

#### 场景：匿名化

- **当** 代理起草反馈时
- **则** 代理移除或替换：
  - 文件路径用 `<path>` 或通用描述
  - API 密钥、令牌、密钥用 `<redacted>`
  - 公司/组织名称用 `<company>`
  - 个人姓名用 `<user>`
  - 特定 URL 用 `<url>`（除非是公开/相关的）

#### 场景：需要用户确认

- **当** 代理已起草反馈时
- **则** 代理必须向用户展示完整草稿
- **且** 在提交前请求明确批准
- **且** 允许用户请求修改
- **且** 仅在用户确认后提交

### 需求：Shell 补全

系统应当为 feedback 命令提供 shell 补全。

#### 场景：命令补全

- **当** 用户输入 `openspec fee<TAB>` 时
- **则** shell 补全为 `openspec feedback`

#### 场景：标志补全

- **当** 用户输入 `openspec feedback "msg" --<TAB>` 时
- **则** shell 建议可用标志（`--body`）

