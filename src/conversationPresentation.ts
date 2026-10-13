import type { TenantProfile } from './tenantProfiles'
import type { Assignment, ConversationDecision } from './workspaceEngine'
import type { Conversation, ConversationAction, ConversationWorkflow, FanFact } from './types'

export type ConversationRowPresentation = {
  headline: string
  context: string
  badges: string[]
  urgency: string | null
  recommended: boolean
  emphasis: 'relationship' | 'fulfillment' | 'purchase' | 'verification' | 'handoff' | 'standard'
}

export function presentConversation(input: {
  tenant: TenantProfile
  item: Conversation
  action: ConversationAction
  workflow: ConversationWorkflow
  facts: FanFact[]
  assignment: Assignment | undefined
  decision: ConversationDecision
  recommended: boolean
}): ConversationRowPresentation {
  const { tenant, item, action, workflow, facts, assignment, decision } = input
  const { fans, data, collaboration, ai } = tenant.dimensions
  const highValue = Number(item.spend.replace(/[^\d.]/g, '')) >= 1000
  const inferredCount = facts.filter((fact) => fact.kind === 'inferred').length
  const recordedCount = facts.filter((fact) => fact.kind === 'recorded').length
  const latestInference = [...facts].reverse().find((fact) => fact.kind === 'inferred')
  const knownPreference = facts.find((fact) => fact.kind === 'team' && /偏好|兴趣|沟通/.test(fact.label))
  const handoff = collaboration === 'shifts' && Boolean(assignment?.handoffPending)
  const recommended = ai === 'triage' && input.recommended
  let emphasis: ConversationRowPresentation['emphasis'] = 'standard'
  let context = action.reason

  if (handoff) {
    emphasis = 'handoff'
    context = `${assignment?.owner ?? '团队'} 已发起交接 · ${action.reason}`
  } else if (action.kind === 'fulfillment') {
    emphasis = 'fulfillment'
    context = workflow.fulfillmentStatus === 'delivered' ? '已付款 · 交付已确认'
      : workflow.fulfillmentStatus === 'reviewing' ? '已付款 · 团队核对中'
        : /付款|已支付/.test(action.reason) ? action.reason : `已付款 · ${action.reason}`
  } else if (data === 'sparse' && decision.needsVerification) {
    emphasis = 'verification'
    context = `${inferredCount} 条推断需核对 · ${latestInference?.value ?? `${recordedCount} 条平台记录`}`
  } else if (action.kind === 'purchase-follow-up') {
    emphasis = 'purchase'
    context = `${workflow.ppvStatus === 'purchased' ? 'PPV 已购' : '购买记录待确认'} · ${action.reason}`
  } else if (fans === 'high' && highValue) {
    emphasis = 'relationship'
    context = `${item.spend} 累计消费${knownPreference ? ` · ${knownPreference.value}` : ' · 优先延续关系'}`
  } else if (action.kind === 'renewal') {
    context = facts.find((fact) => fact.label.includes('订阅'))?.value ?? action.reason
  }

  const primaryBadge = recommended ? '推荐处理'
    : handoff ? '待交接'
      : decision.needsVerification ? '来源待核对'
        : fans === 'high' && highValue ? '高价值关系'
          : action.kind === 'purchase-follow-up' && inferredCount > 0 ? '偏好待确认' : ''
  const ownerBadge = collaboration !== 'solo' && assignment && !handoff ? `负责人 ${assignment.owner}` : ''
  const badges = [primaryBadge, ownerBadge].filter(Boolean)

  const headline = action.kind === 'fulfillment'
    ? workflow.fulfillmentStatus === 'delivered' ? '交付已确认' : workflow.fulfillmentStatus === 'reviewing' ? '等待团队确认交付' : '核对已付款请求'
    : workflow.actionStatus === 'waiting' ? '等待粉丝反馈' : workflow.actionStatus === 'scheduled' ? '按计划跟进' : decision.primaryAction
  return {
    headline, context, badges,
    urgency: workflow.actionStatus === 'pending' ? action.due : null,
    recommended, emphasis,
  }
}
