import { getTenantWorkspaceRule } from './tenantWorkspaceRules'
import type { DetailSection, TenantWorkspaceRule } from './tenantWorkspaceRules'
import type { TenantProfile } from './tenantProfiles'
import type { ActivityEvent, InboxFilter } from './smartConfig'
import type { Conversation, ConversationAction, ConversationWorkflow, FanFact, FanIntelligence } from './types'

export type Assignment = { owner: string; handoffPending: boolean; event: string }

export type ConversationDecision = {
  priority: number
  lane: 'paid-fulfillment' | 'handoff' | 'action' | 'waiting' | 'complete'
  primaryAction: string
  statusLabel: string
  needsVerification: boolean
  reasons: string[]
}

export type WorkspaceComposition = {
  rule: TenantWorkspaceRule
  queueOrder: InboxFilter[]
  orderedConversationIds: string[]
  decisions: Record<string, ConversationDecision>
  presentation: {
    showLoadOverview: boolean
    defaultPendingOnly: boolean
    showHandoffTools: boolean
    proactiveAi: boolean
    detailOrder: DetailSection[]
  }
}

export type WorkspaceInput = {
  tenant: TenantProfile
  conversations: Conversation[]
  actions: Record<string, ConversationAction>
  workflows: Record<string, ConversationWorkflow>
  intelligence: Record<string, FanIntelligence>
  facts: Record<string, FanFact[]>
  assignments: Record<string, Assignment>
  activity: ActivityEvent[]
  reviewedEvidenceId?: string | null
  now?: number
}

export function composeQueueOrder(tenant: TenantProfile, activity: ActivityEvent[], now = Date.now()): InboxFilter[] {
  const base = getTenantWorkspaceRule(tenant).queues
  const primary = base[1]
  const secondary = base.slice(2).map((queue, index) => ({
    queue, index,
    usage: activity.filter((event) => event.focus === queue && event.at >= now - 7 * 24 * 60 * 60 * 1000 && event.at <= now).length,
  }))
  if (tenant.dimensions.ai === 'triage') secondary.sort((a, b) => b.usage - a.usage || a.index - b.index)
  return [...new Set<InboxFilter>(['all', primary, ...secondary.map((item) => item.queue)])].slice(0, 6)
}

function decideConversation(input: WorkspaceInput, item: Conversation, rule: TenantWorkspaceRule): ConversationDecision {
  const { tenant, actions, workflows, intelligence, facts, assignments } = input
  const action = actions[item.id]
  const workflow = workflows[item.id]
  const assignment = assignments[item.id]
  const kind = action.kind
  const status = workflow.actionStatus
  const paidFulfillmentOpen = kind === 'fulfillment' && workflow.paymentStatus === 'paid' && workflow.fulfillmentStatus !== 'delivered'
  const needsVerification = tenant.dimensions.data === 'sparse' && input.reviewedEvidenceId !== item.id
  const reasons = [paidFulfillmentOpen ? '已付款请求尚未交付' : action.reason]
  if (assignment?.handoffPending) reasons.push('待确认交接')
  if (needsVerification) reasons.push('资料不足，先核对来源')
  if (tenant.dimensions.fans === 'high' && Number(item.spend.replace(/[^\d.]/g, '')) >= 1000) reasons.push('高价值关系')

  const lane: ConversationDecision['lane'] = paidFulfillmentOpen ? 'paid-fulfillment'
    : tenant.dimensions.collaboration === 'shifts' && assignment?.handoffPending ? 'handoff'
      : status === 'pending' ? 'action' : status === 'done' ? 'complete' : 'waiting'
  const verifiedScore = tenant.dimensions.data === 'sparse' || tenant.dimensions.ai === 'advisory'
    ? 0 : (intelligence[item.id]?.priorityScore ?? 0) * 0.1
  const highValueBonus = tenant.dimensions.data === 'sparse' ? 0
    : Number(item.spend.replace(/[^\d.]/g, '')) >= 1000 ? rule.highValueBonus : 0
  const priority = lane === 'paid-fulfillment'
    ? (status === 'pending' ? 10000 : 9000) + item.unread
    : lane === 'handoff' ? 5000 + item.unread
      : lane === 'action' ? 500 + rule.priorityWeights[kind] + verifiedScore + highValueBonus + item.unread * rule.unreadBonus
        : lane === 'waiting' ? (status === 'scheduled' ? 10 : 0) : -10
  const statusLabel = paidFulfillmentOpen && status === 'waiting' ? '团队核对中'
    : status === 'pending' ? '待处理' : status === 'waiting' ? '等待回复' : status === 'scheduled' ? '已安排' : '已完成'
  const primaryAction = status === 'pending' ? action.title
    : paidFulfillmentOpen ? action.afterSend
      : status === 'waiting' ? action.afterSend : status === 'scheduled' ? '按计划跟进' : '当前无需主动处理'

  // Facts may explain a suggestion, but inferred facts cannot change payment or fulfillment truth.
  if (tenant.dimensions.data === 'sparse' && facts[item.id]?.some((fact) => fact.kind === 'inferred')) reasons.push('含未确认推断')
  return { priority, lane, primaryAction, statusLabel, needsVerification, reasons }
}

export function composeWorkspace(input: WorkspaceInput): WorkspaceComposition {
  const rule = getTenantWorkspaceRule(input.tenant)
  const decisions = Object.fromEntries(input.conversations.map((item) => [item.id, decideConversation(input, item, rule)])) as Record<string, ConversationDecision>
  const orderedConversationIds = [...input.conversations]
    .sort((a, b) => decisions[b.id].priority - decisions[a.id].priority || a.id.localeCompare(b.id))
    .map((item) => item.id)
  return {
    rule,
    queueOrder: composeQueueOrder(input.tenant, input.activity, input.now),
    orderedConversationIds,
    decisions,
    presentation: {
      showLoadOverview: input.tenant.dimensions.scale !== 'low',
      defaultPendingOnly: input.tenant.dimensions.scale === 'surge',
      showHandoffTools: input.tenant.dimensions.collaboration === 'shifts',
      proactiveAi: input.tenant.dimensions.ai !== 'advisory',
      detailOrder: rule.detailOrder,
    },
  }
}
