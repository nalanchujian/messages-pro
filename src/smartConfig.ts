import { conversationActions } from './data'
import type { TenantProfile } from './tenantProfiles'
import { getTenantWorkspaceRule } from './tenantWorkspaceRules'
import type { ActionStatus, Conversation } from './types'

export type InboxFilter = 'all' | 'reply' | 'fulfillment' | 'renewal' | 'purchase-follow-up' | 'manual' | 'waiting'
export type DisplayPreferences = {
  compactList: boolean
  listPreview: boolean
  listPriority: boolean
  listSla: boolean
  chatNextStep: boolean
  chatCopilot: boolean
  chatTimestamps: boolean
  chatHelp: boolean
  profileMetrics: boolean
  profileRecommendation: boolean
  profileKnown: boolean
  profileMemory: boolean
}
export type SmartModeId = 'reply' | 'renewal' | 'purchase' | 'relationship' | 'guidance'
export type ActivityEvent = { type: 'queue' | 'conversation' | 'sent'; focus: InboxFilter; at: number }
export type SmartProposal = {
  id: SmartModeId
  title: string
  description: string
  workStyle: string
  reasons: string[]
  queues: InboxFilter[]
  preferences: Partial<DisplayPreferences>
  activityCount: number
}

export const defaultVisibleFilters: InboxFilter[] = ['all', 'reply', 'fulfillment', 'purchase-follow-up', 'renewal', 'waiting']
export const defaultPreferences: DisplayPreferences = {
  compactList: false, listPreview: true, listPriority: true, listSla: true,
  chatNextStep: true, chatCopilot: true, chatTimestamps: true, chatHelp: true,
  profileMetrics: true, profileRecommendation: true, profileKnown: true, profileMemory: true,
}

export function conversationFocus(id: string): InboxFilter {
  return conversationActions[id]?.kind ?? 'all'
}

export function inferSmartMode(items: Conversation[], activity: ActivityEvent[], currentFilter: InboxFilter, tenant: TenantProfile, actionStatuses: Record<string, ActionStatus> = {}): SmartProposal {
  const rule = getTenantWorkspaceRule(tenant)
  const recent = activity.filter((event) => event.at >= Date.now() - 7 * 24 * 60 * 60 * 1000)
  const count = (queue: InboxFilter) => items.filter((item) => queue === 'waiting'
    ? ['waiting', 'scheduled'].includes(actionStatuses[item.id] ?? '')
    : conversationActions[item.id]?.kind === queue && (actionStatuses[item.id] ?? (item.id === 'chris' ? 'done' : 'pending')) === 'pending').length
  const primary = rule.queues[1]
  const secondary = rule.queues.slice(2).map((queue, index) => ({ queue, index, usage: recent.filter((event) => event.focus === queue).length }))
  if (tenant.dimensions.ai === 'triage') secondary.sort((a, b) => b.usage - a.usage || a.index - b.index)
  const queues = ['all', primary, ...secondary.map((item) => item.queue)] as InboxFilter[]
  const primaryLabel = ({ reply: '需回复', fulfillment: '待履约', renewal: '续订关怀', 'purchase-follow-up': '购买跟进', manual: '人工判断', waiting: '等待中', all: '全部' } as Record<InboxFilter, string>)[primary]
  const reasons = [`${rule.queueHint}，优先显示「${primaryLabel}」；当前有 ${count(primary)} 个相关会话。`]
  if (tenant.dimensions.ai === 'triage') reasons.push(recent.length
    ? `最近 7 天有 ${recent.length} 次队列、会话或发送操作，次要队列据此自适应排序。`
    : '次要队列会根据后续操作自适应排序。')
  else if (tenant.dimensions.ai === 'assisted') reasons.push('AI 主动提示下一步并提供回复草稿，队列按租户特征保持固定顺序。')
  else reasons.push('AI 按需提供建议与依据，不主动提示下一步；所有操作由人工确认。')
  if (currentFilter !== 'all' && currentFilter !== primary) reasons.push('当前筛选只影响本次查看，不改变租户的首要工作重点。')
  return { id: rule.modeId, title: rule.title, description: rule.description, workStyle: rule.workStyle, reasons, queues, preferences: rule.preferences, activityCount: recent.length }
}
