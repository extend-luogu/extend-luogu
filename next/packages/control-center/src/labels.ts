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
  navigation: '页面导航',
  ui: '页面提示',
  'network.luogu': '洛谷网络',
  'network.codeforces': 'Codeforces',
  'network.atcoder': 'AtCoder Problems',
  'network.localhost': '本机 CPH',
  'luogu.editor': '洛谷编辑器',
  'luogu.page-data': '洛谷页面数据',
  'luogu.private-messages': '洛谷站内私信',
}

export const categoryLabels: Readonly<Record<string, string>> = {
  reading: '阅读体验',
  problem: '题目工具',
  communication: '通信与提醒',
  diagnostics: '诊断工具',
  editor: '编辑器',
  navigation: '导航',
  record: '评测记录',
  home: '首页',
  contest: '比赛与题单',
  user: '用户工具',
  practice: '练习工具',
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 240) : String(error).slice(0, 240)
}
