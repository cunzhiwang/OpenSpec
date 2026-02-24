# global-config 规范

## 目的

本规范定义 OpenSpec 如何解析、读取和写入用户级全局配置。它管理 `src/core/global-config.ts` 模块，该模块为存储跨项目持久化的用户偏好、功能标志和设置提供基础。规范通过遵循 XDG 基础目录规范并提供平台特定回退来确保跨平台兼容性，并通过模式演进规则保证向前/向后兼容性。

## 需求
### 需求：全局配置存储
系统应当将全局配置存储在 `~/.config/openspec/config.json` 中，包括带有 `anonymousId` 和 `noticeSeen` 字段的遥测状态。

#### 场景：初始配置创建
- **当** 不存在全局配置文件时
- **且** 第一个遥测事件即将发送
- **则** 系统创建带有遥测配置的 `~/.config/openspec/config.json`

#### 场景：遥测配置结构
- **当** 读取或写入遥测配置时
- **则** 配置包含带有 `anonymousId`（字符串 UUID）和 `noticeSeen`（布尔值）字段的 `telemetry` 对象

#### 场景：配置文件格式
- **当** 存储配置时
- **则** 系统写入用户可读取和修改的有效 JSON

#### 场景：现有配置保留
- **当** 向现有配置文件添加遥测字段时
- **则** 系统保留所有现有配置字段

### 需求：全局配置目录路径

系统应当按照 XDG 基础目录规范解析全局配置目录路径，并提供平台特定回退。

#### 场景：设置了 XDG_CONFIG_HOME 的 Unix/macOS
- **当** `$XDG_CONFIG_HOME` 环境变量设置为 `/custom/config` 时
- **则** `getGlobalConfigDir()` 返回 `/custom/config/openspec`

#### 场景：未设置 XDG_CONFIG_HOME 的 Unix/macOS
- **当** `$XDG_CONFIG_HOME` 环境变量未设置时
- **且** 平台是 Unix 或 macOS
- **则** `getGlobalConfigDir()` 返回 `~/.config/openspec`（展开为绝对路径）

#### 场景：Windows 平台
- **当** 平台是 Windows 时
- **且** `%APPDATA%` 设置为 `C:\Users\User\AppData\Roaming`
- **则** `getGlobalConfigDir()` 返回 `C:\Users\User\AppData\Roaming\openspec`

### 需求：全局配置加载

系统应当从配置目录加载全局配置，当配置文件不存在或无法解析时使用合理的默认值。

#### 场景：配置文件存在且有效
- **当** `config.json` 存在于全局配置目录中时
- **且** 文件包含匹配配置模式的有效 JSON
- **则** `getGlobalConfig()` 返回解析的配置

#### 场景：配置文件不存在
- **当** `config.json` 不存在于全局配置目录中时
- **则** `getGlobalConfig()` 返回默认配置
- **且** 不创建目录或文件

#### 场景：配置文件是无效 JSON
- **当** `config.json` 存在但包含无效 JSON 时
- **则** `getGlobalConfig()` 返回默认配置
- **且** 向 stderr 记录警告

### 需求：全局配置保存

系统应当将全局配置保存到配置目录，如果目录不存在则创建它。

#### 场景：保存配置到新目录
- **当** 调用 `saveGlobalConfig(config)` 时
- **且** 全局配置目录不存在
- **则** 创建目录
- **且** 将 `config.json` 写入提供的配置

#### 场景：保存配置到现有目录
- **当** 调用 `saveGlobalConfig(config)` 时
- **且** 全局配置目录已存在
- **则** 写入 `config.json`（如存在则覆盖）

### 需求：默认配置

系统应当提供当不存在配置文件时使用的默认配置。

#### 场景：默认配置结构
- **当** 不存在配置文件时
- **则** 默认配置包含空的 `featureFlags` 对象

### 需求：配置模式演进

系统应当将加载的配置与默认值合并，以确保新的配置字段在加载旧配置文件时仍然可用。

#### 场景：配置文件缺少新字段
- **当** `config.json` 存在且包含 `{ "featureFlags": {} }` 时
- **且** 当前模式包含新字段 `defaultAiTool`
- **则** `getGlobalConfig()` 返回 `{ featureFlags: {}, defaultAiTool: <default> }`
- **且** 对于两者都存在的字段，加载的值优先于默认值

#### 场景：配置文件有额外未知字段
- **当** `config.json` 包含当前模式中没有的字段时
- **则** 未知字段在返回的配置中被保留
- **且** 不引发错误或警告
