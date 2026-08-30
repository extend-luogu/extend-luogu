import type { FeatureCapability, FeatureStatus } from '@exlg/runtime'

export const statusLabels: Record<FeatureStatus, string> = {
  disabled: '已关闭',
  idle: '当前页面未匹配',
  mounting: '正在挂载',
  mounted: '正在运行',
  error: '发生错误',
}

export const capabilityLabels: Record<FeatureCapability, string> = {
  dom: '页面内容',
  storage: '本地存储',
  clipboard: '剪贴板',
  'luogu.private-messages': '洛谷站内私信',
}

export const categoryLabels: Readonly<Record<string, string>> = {
  reading: '阅读体验',
  problem: '题目工具',
  communication: '通信与提醒',
  diagnostics: '诊断工具',
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 240) : String(error).slice(0, 240)
}
