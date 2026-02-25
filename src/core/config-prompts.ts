import type { ProjectConfig } from './project-config.js';

/**
 * 将配置序列化为带有帮助注释的 YAML 字符串。
 *
 * @param config - 部分配置对象（schema 必需，context/rules 可选）
 * @returns 可写入文件的 YAML 字符串
 */
export function serializeConfig(config: Partial<ProjectConfig>): string {
  const lines: string[] = [];

  // Schema（必需）
  lines.push(`schema: ${config.schema}`);
  lines.push('');

  // 上下文部分（带注释）
  lines.push('# 项目上下文（可选）');
  lines.push('# 在创建工件时会显示给 AI。');
  lines.push('# 添加你的技术栈、约定、风格指南、领域知识等。');
  lines.push('# 示例：');
  lines.push('#   context: |');
  lines.push('#     技术栈：TypeScript、React、Node.js');
  lines.push('#     我们使用约定式提交');
  lines.push('#     领域：电商平台');
  lines.push('');

  // 规则部分（带注释）
  lines.push('# 每个工件的规则（可选）');
  lines.push('# 为特定工件添加自定义规则。');
  lines.push('# 示例：');
  lines.push('#   rules:');
  lines.push('#     proposal:');
  lines.push('#       - 提案保持在 500 字以内');
  lines.push('#       - 始终包含"非目标"部分');
  lines.push('#     tasks:');
  lines.push('#       - 将任务拆分为最多 2 小时的块');

  return lines.join('\n') + '\n';
}
