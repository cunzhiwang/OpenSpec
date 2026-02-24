# 变更创建规范

## 目的
提供用于创建和验证 OpenSpec 变更目录的编程工具。

## 需求
### 需求：变更创建
系统应当提供一个函数来以编程方式创建新的变更目录。

#### 场景：创建变更
- **当** 调用 `createChange(projectRoot, 'add-auth')` 时
- **则** 系统创建 `openspec/changes/add-auth/` 目录

#### 场景：拒绝重复变更
- **当** 调用 `createChange(projectRoot, 'add-auth')` 且 `openspec/changes/add-auth/` 已存在时
- **则** 系统抛出错误，提示变更已存在

#### 场景：需要时创建父目录
- **当** 调用 `createChange(projectRoot, 'add-auth')` 且 `openspec/changes/` 不存在时
- **则** 系统创建完整路径，包括父目录

#### 场景：拒绝无效变更名称
- **当** 使用无效名称调用 `createChange(projectRoot, 'Add Auth')` 时
- **则** 系统抛出验证错误

### 需求：变更名称验证
系统应当验证变更名称遵循 kebab-case 约定。

#### 场景：接受有效 kebab-case 名称
- **当** 验证像 `add-user-auth` 这样的变更名称时
- **则** 验证返回 `{ valid: true }`

#### 场景：接受数字后缀
- **当** 验证像 `add-feature-2` 这样的变更名称时
- **则** 验证返回 `{ valid: true }`

#### 场景：接受单个单词
- **当** 验证像 `refactor` 这样的变更名称时
- **则** 验证返回 `{ valid: true }`

#### 场景：拒绝大写字符
- **当** 验证像 `Add-Auth` 这样的变更名称时
- **则** 验证返回 `{ valid: false, error: "..." }`

#### 场景：拒绝空格
- **当** 验证像 `add auth` 这样的变更名称时
- **则** 验证返回 `{ valid: false, error: "..." }`

#### 场景：拒绝下划线
- **当** 验证像 `add_auth` 这样的变更名称时
- **则** 验证返回 `{ valid: false, error: "..." }`

#### 场景：拒绝特殊字符
- **当** 验证像 `add-auth!` 这样的变更名称时
- **则** 验证返回 `{ valid: false, error: "..." }`

#### 场景：拒绝前导连字符
- **当** 验证像 `-add-auth` 这样的变更名称时
- **则** 验证返回 `{ valid: false, error: "..." }`

#### 场景：拒绝尾随连字符
- **当** 验证像 `add-auth-` 这样的变更名称时
- **则** 验证返回 `{ valid: false, error: "..." }`

#### 场景：拒绝连续连字符
- **当** 验证像 `add--auth` 这样的变更名称时
- **则** 验证返回 `{ valid: false, error: "..." }`
