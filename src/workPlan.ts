import type { ConversationAction, ConversationWorkflow } from './types'
import type { Assignment } from './workspaceEngine'

export type WorkPlanStep = { label: string; state: 'done' | 'current' | 'next' }

export function buildWorkPlan(
  action: ConversationAction,
  workflow: ConversationWorkflow,
  assignment: Assignment,
  collaboration: 'solo' | 'team' | 'shifts',
  needsVerification: boolean,
): WorkPlanStep[] {
  const handoff = collaboration === 'shifts' && assignment.handoffPending
  const source: WorkPlanStep[] = needsVerification ? [{ label: '引用偏好前核对来源', state: 'next' }] : []
  const transfer: WorkPlanStep[] = handoff ? [{ label: '确认交接', state: 'current' }] : []
  const step = (label: string, done: boolean, current: boolean): WorkPlanStep => ({ label, state: done ? 'done' : current ? 'current' : 'next' })

  if (action.kind === 'fulfillment') {
    const reviewing = workflow.fulfillmentStatus === 'reviewing'
    const delivered = workflow.fulfillmentStatus === 'delivered'
    return [...transfer, ...source,
      step('核对付款与订单', workflow.paymentStatus === 'paid', !handoff),
      step('团队确认交付', reviewing || delivered, !handoff && !reviewing && !delivered),
      step('确认已交付', delivered, !handoff && reviewing),
    ]
  }

  if (action.kind === 'purchase-follow-up') {
    const responded = workflow.lastOutboundAt !== null
    const scheduled = workflow.actionStatus === 'scheduled' || workflow.actionStatus === 'done'
    return [...transfer, ...source,
      step('确认购买记录', workflow.ppvStatus === 'purchased', !handoff),
      step('回应购买体验', responded, !handoff && !responded),
      step('等待反馈或安排后续', scheduled, !handoff && responded && !scheduled),
    ]
  }

  if (action.kind === 'renewal') {
    const responded = workflow.lastOutboundAt !== null
    const scheduled = workflow.actionStatus === 'scheduled' || workflow.actionStatus === 'done'
    return [...transfer, ...source,
      step('查看订阅背景', true, false),
      step('发送续订关怀', responded, !handoff && !responded),
      step('安排后续跟进', scheduled, !handoff && responded && !scheduled),
    ]
  }

  const responded = workflow.lastOutboundAt !== null
  return [...transfer, ...source,
    step('阅读当前对话', true, false),
    step(action.kind === 'manual' ? '人工判断下一步' : '回应粉丝', responded || workflow.actionStatus === 'done', !handoff && !responded),
    step('等待反馈', workflow.actionStatus === 'waiting' || workflow.actionStatus === 'done', !handoff && responded && workflow.actionStatus !== 'waiting'),
  ]
}
