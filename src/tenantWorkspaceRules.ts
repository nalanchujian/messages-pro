import type { DisplayPreferences, InboxFilter, SmartModeId } from './smartConfig'
import type { PresetTenantId, TenantProfile } from './tenantProfiles'
import type { ActionKind } from './types'

export type DetailSection = 'recommendation' | 'metrics' | 'facts' | 'memory'

export type TenantWorkspaceRule = {
  modeId: SmartModeId
  title: string
  description: string
  workStyle: string
  queueHint: string
  sortLabel: string
  chatHint: string
  copilotLabel: string
  copilotStart: 'reply' | 'strategy' | 'memory'
  insightTitle: string
  landingConversationId: string
  queues: InboxFilter[]
  preferences: DisplayPreferences
  detailOrder: DetailSection[]
  priorityWeights: Record<ActionKind, number>
  highValueBonus: number
  unreadBonus: number
}

// Demo policies are explicit so the four tenant archetypes visibly differ on first switch.
// Manual changes are stored per tenant and take precedence until smart mode is reapplied.
export const tenantWorkspaceRules: Record<PresetTenantId, TenantWorkspaceRule> = {
  aster: {
    modeId: 'relationship', title: '关系经营工作台', description: '优先延续高价值关系，保留对话背景、团队记忆与温和关怀。',
    workStyle: '精细经营', queueHint: '高价值关系优先', sortLabel: '关系价值', chatHint: '参考关系背景与已有承诺', copilotLabel: '关系助理', copilotStart: 'memory',
    insightTitle: '关系背景', landingConversationId: 'mason',
    queues: ['all', 'renewal', 'reply', 'purchase-follow-up', 'fulfillment', 'manual'],
    preferences: {
      compactList: false, listPreview: true, listPriority: true, listSla: true,
      chatNextStep: true, chatCopilot: true, chatTimestamps: true, chatHelp: false,
      profileMetrics: true, profileRecommendation: true, profileKnown: true, profileMemory: true,
    },
    detailOrder: ['recommendation', 'memory', 'facts', 'metrics'],
    priorityWeights: { reply: 70, fulfillment: 90, 'purchase-follow-up': 55, renewal: 68, manual: 10 },
    highValueBonus: 38, unreadBonus: 3,
  },
  north: {
    modeId: 'reply', title: '高并发分流工作台', description: '压缩列表并突出待履约、需回复与处理时限，减少分配遗漏。',
    workStyle: '高效处理', queueHint: '待处理时限优先', sortLabel: '处理时限', chatHint: '快速处理，必要时查看交接依据', copilotLabel: '快速回复', copilotStart: 'reply',
    insightTitle: '处理状态', landingConversationId: 'riley',
    queues: ['all', 'fulfillment', 'reply', 'waiting', 'purchase-follow-up', 'manual'],
    preferences: {
      compactList: true, listPreview: false, listPriority: true, listSla: true,
      chatNextStep: true, chatCopilot: true, chatTimestamps: false, chatHelp: false,
      profileMetrics: false, profileRecommendation: true, profileKnown: false, profileMemory: false,
    },
    detailOrder: ['recommendation', 'facts', 'metrics', 'memory'],
    priorityWeights: { reply: 92, fulfillment: 110, 'purchase-follow-up': 50, renewal: 35, manual: 10 },
    highValueBonus: 0, unreadBonus: 10,
  },
  pulse: {
    modeId: 'purchase', title: '购买跟进工作台', description: '突出首购反馈、履约与消费信息，让购买后的互动连续且适度。',
    workStyle: '增长转化', queueHint: '购买后互动优先', sortLabel: '购买信号', chatHint: '先回应购买反馈，再考虑后续互动', copilotLabel: '购买策略', copilotStart: 'strategy',
    insightTitle: '购买信号', landingConversationId: 'leo',
    queues: ['all', 'purchase-follow-up', 'fulfillment', 'reply', 'renewal', 'waiting'],
    preferences: {
      compactList: false, listPreview: true, listPriority: true, listSla: true,
      chatNextStep: true, chatCopilot: true, chatTimestamps: true, chatHelp: false,
      profileMetrics: true, profileRecommendation: true, profileKnown: true, profileMemory: false,
    },
    detailOrder: ['metrics', 'recommendation', 'facts', 'memory'],
    priorityWeights: { reply: 62, fulfillment: 98, 'purchase-follow-up': 115, renewal: 35, manual: 10 },
    highValueBonus: 10, unreadBonus: 4,
  },
  seed: {
    modeId: 'guidance', title: '带教核对工作台', description: '保留消息上下文与操作提示，优先核对资料缺口和 AI 推断。',
    workStyle: '新人带教', queueHint: '事实核对优先', sortLabel: '核对需求', chatHint: '核对记录与推断后再发送', copilotLabel: '核对助手', copilotStart: 'strategy',
    insightTitle: '资料核对', landingConversationId: 'nate',
    queues: ['all', 'reply', 'renewal', 'fulfillment', 'manual', 'waiting'],
    preferences: {
      compactList: false, listPreview: true, listPriority: true, listSla: true,
      chatNextStep: false, chatCopilot: true, chatTimestamps: true, chatHelp: true,
      profileMetrics: false, profileRecommendation: true, profileKnown: true, profileMemory: true,
    },
    detailOrder: ['facts', 'recommendation', 'memory', 'metrics'],
    priorityWeights: { reply: 67, fulfillment: 108, 'purchase-follow-up': 60, renewal: 70, manual: 42 },
    highValueBonus: 0, unreadBonus: 3,
  },
}

// Every preset and custom tenant uses the same six-dimensional behavior model.
export function getTenantWorkspaceRule(tenant: TenantProfile): TenantWorkspaceRule {
  const { scale, fans, tasks, data, collaboration, ai } = tenant.dimensions
  const preset = tenant.id === 'custom' ? null : tenantWorkspaceRules[tenant.id]
  const highVolume = scale === 'surge'
  const buyerFocus = tasks === 'purchase'
  const sparseData = data === 'sparse'
  const primary: InboxFilter = tasks === 'fulfillment' ? 'fulfillment' : buyerFocus ? 'purchase-follow-up' : 'reply'
  const queues = [...new Set<InboxFilter>([
    'all', primary,
    ...(tasks === 'fulfillment' || highVolume ? ['reply', 'fulfillment'] as InboxFilter[] : []),
    ...(buyerFocus ? ['purchase-follow-up'] as InboxFilter[] : []),
    ...(fans === 'high' ? ['renewal'] as InboxFilter[] : []),
    ...(sparseData ? ['manual'] as InboxFilter[] : []),
    'reply', 'fulfillment', 'purchase-follow-up', 'renewal', 'manual', 'waiting',
  ])].slice(0, 6)
  const priorityWeights: Record<ActionKind, number> = {
    reply: 70 + (highVolume ? 22 : 0) + (tasks === 'conversation' ? 15 : 0),
    fulfillment: 85 + (highVolume ? 20 : 0) + (tasks === 'fulfillment' ? 35 : 0),
    'purchase-follow-up': 58 + (buyerFocus ? 55 : 0),
    renewal: 55 + (fans === 'high' ? 30 : 0),
    manual: 12 + (sparseData ? 48 : 0),
  }
  const detailOrder: DetailSection[] = highVolume
    ? sparseData ? ['facts', 'recommendation', 'metrics', 'memory'] : ['recommendation', 'facts', 'metrics', 'memory']
    : sparseData ? ['facts', 'recommendation', 'metrics', 'memory']
      : buyerFocus ? ['metrics', 'recommendation', 'facts', 'memory']
      : fans === 'high' ? ['memory', 'recommendation', 'facts', 'metrics']
        : ['recommendation', 'facts', 'metrics', 'memory']
  const focusLabel = primary === 'fulfillment' ? '履约处理' : primary === 'purchase-follow-up' ? '购买跟进' : '消息回复'
  const hints = [
    highVolume ? '优先处理超时消息' : '',
    buyerFocus ? '留意购买后的反馈' : '',
    sparseData ? '先核对资料与推断' : '',
    collaboration === 'shifts' ? '保留交接线索' : '',
    ai === 'advisory' ? 'AI 按需提供建议' : ai === 'triage' ? '队列根据近期操作自适应排序' : '',
  ].filter(Boolean)
  return {
    modeId: preset?.modeId ?? (sparseData ? 'guidance' : buyerFocus ? 'purchase' : fans === 'high' ? 'relationship' : 'reply'),
    title: preset?.title ?? '组合式智能工作台',
    description: preset?.description ?? (hints.length ? hints.join('；') : '根据六个维度调整队列、回复辅助和会话洞察。'),
    workStyle: preset?.workStyle ?? focusLabel,
    queueHint: `${focusLabel}优先`,
    sortLabel: highVolume ? '处理时限' : buyerFocus ? '购买反馈' : fans === 'high' ? '关系与时限' : '待办优先',
    chatHint: hints.slice(0, 3).join(' · ') || '参考对话背景与当前行动',
    copilotLabel: preset?.copilotLabel ?? (ai === 'advisory' ? '建议助手' : ai === 'triage' ? '队列助理' : 'AI 助理'),
    copilotStart: sparseData ? 'strategy' : buyerFocus ? 'strategy' : fans === 'high' ? 'memory' : 'reply',
    insightTitle: sparseData ? '资料核对' : buyerFocus ? '购买与互动' : highVolume ? '处理状态' : '粉丝关系',
    landingConversationId: preset?.landingConversationId ?? (tasks === 'fulfillment' ? 'riley' : buyerFocus ? 'leo' : fans === 'high' ? 'mason' : 'nate'),
    queues,
    preferences: {
      compactList: highVolume, listPreview: !highVolume, listPriority: true, listSla: scale !== 'low' || tasks === 'fulfillment',
      chatNextStep: ai !== 'advisory', chatCopilot: true, chatTimestamps: !highVolume, chatHelp: sparseData || ai === 'advisory',
      profileMetrics: data === 'complete' || buyerFocus || fans !== 'low', profileRecommendation: ai !== 'advisory',
      profileKnown: true,
      profileMemory: data === 'complete' || fans === 'high' || collaboration === 'shifts',
    },
    detailOrder, priorityWeights,
    highValueBonus: fans === 'high' ? 38 : fans === 'balanced' ? 18 : 0,
    unreadBonus: highVolume ? 10 : 3,
  }
}
