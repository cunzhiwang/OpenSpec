## 0. 堆叠协调

- [ ] 0.1 在实施前将此变更变基到最新的 `main`
- [ ] 0.2 如果 `simplify-skill-installation` 先合并，保留其配置文件/交付模型并将此变更应用为能力感知细化
- [ ] 0.3 如果此变更先合并，确保后续变基不会重新引入笼统的"commands = 移除所有技能"规则
- [ ] 0.4 如果 `add-global-install-scope` 已合并，验证组合的范围 × 交付 × 命令表面行为保持确定性

## 1. 工具命令表面能力模型

- [ ] 1.1 在 `src/core/config.ts` 中用可选的命令表面能力字段扩展工具元数据
- [ ] 1.2 定义支持的能力值：`adapter`、`skills-invocable`、`none`
- [ ] 1.3 将 Trae 标记为 `skills-invocable`
- [ ] 1.4 添加共享能力解析器（先显式元数据覆盖，再从适配器存在推断）
- [ ] 1.5 添加能力解析的聚焦单元测试（显式覆盖、推断适配器、推断 none）

## 2. Init：能力感知交付规划

- [ ] 2.1 重构 init 生成逻辑以计算每工具有效操作（生成/移除技能和命令），而不仅使用全局布尔值
- [ ] 2.2 在 `delivery=commands` 中，为 `skills-invocable` 工具保留/生成技能，不移除那些托管技能目录
- [ ] 2.3 在 `delivery=commands` 中，当任何选定工具解析为 `none` 时在写入前快速失败
- [ ] 2.4 更新 init 输出以清楚报告 `skills-invocable` 工具的有效行为（技能用作命令表面）
- [ ] 2.5 确保 init 不再为有意使用 `skills-invocable` 的工具报告"no adapter"
- [ ] 2.6 添加/调整 `delivery=commands` + `trae`（技能保留/生成，无适配器错误）、混合工具（`claude,trae`）带每工具预期输出、以及不支持命令表面（`none`）的确定性失败路径的 init 测试

## 3. Update：能力感知同步和漂移检测

- [ ] 3.1 重构 update 同步逻辑以按工具能力应用交付行为（不是按运行全局）
- [ ] 3.2 在 `delivery=commands` 中，为 `skills-invocable` 工具保留/生成托管技能
- [ ] 3.3 在 `delivery=commands` 中，当配置的工具包含 `none` 命令表面时在部分更新前失败
- [ ] 3.4 更新配置文件/交付漂移检测以避免 `commands` 交付下 `skills-invocable` 工具的永久漂移
- [ ] 3.5 确保配置工具检测在 `commands` 交付下当托管技能存在时仍包含 `skills-invocable` 工具
- [ ] 3.6 更新摘要输出，使 skills-invocable 行为报告为预期行为（不是隐式跳过/错误）
- [ ] 3.7 添加/调整 `delivery=commands` + 配置 Trae（技能保留/生成）、幂等第二次更新（无假漂移循环）、混合配置工具（`claude` + `trae`）、以及不支持命令表面（`none`）的确定性预检失败的 update 测试

## 4. 用户体验和错误消息

- [ ] 4.1 为 `delivery=commands` 当选定工具包含 `skills-invocable` 时添加交互式 init 兼容性说明
- [ ] 4.2 添加确定性非交互错误文本，包含不兼容工具 ID 和建议的替代方案（`both` 或 `skills`）
- [ ] 4.3 对齐 init 和 update 措辞，使能力相关行为/消息一致

## 5. 文档更新

- [ ] 5.1 更新 `docs/supported-tools.md` 以文档化 Trae 的命令表面语义并阐明交付交互
- [ ] 5.2 更新 `docs/cli.md` 交付指导以解释 `delivery=commands` 的能力感知行为
- [ ] 5.3 添加"commands-only + 不支持工具"失败的简短故障排除说明

## 6. 验证

- [ ] 6.1 运行定向测试：`test/core/init.test.ts` 和 `test/core/update.test.ts`
- [ ] 6.2 运行此变更中添加的任何新能力/单元测试文件
- [ ] 6.3 运行完整测试套件（`pnpm test`）并解决回归问题
- [ ] 6.4 手动冒烟检查：使用 `delivery=commands` 的 `openspec init --tools trae`
- [ ] 6.5 手动冒烟检查：使用 `delivery=commands` 的混合工具（`claude,trae`）
