import type { ActionKind, ActionStatus, ConversationWorkflow, WorkflowEvent } from './types'

// The current action describes what is happening in this conversation. A message,
// purchase and delivery are separate business facts and must not complete each other.
export function initialWorkflow(kind: ActionKind): ConversationWorkflow {
  return {
    actionStatus: kind === 'manual' ? 'done' : 'pending',
    lastOutboundAt: null,
    paymentStatus: kind === 'fulfillment' || kind === 'purchase-follow-up' ? 'paid' : 'none',
    ppvStatus: kind === 'purchase-follow-up' ? 'purchased' : 'none',
    fulfillmentStatus: kind === 'fulfillment' ? 'awaiting-review' : 'not-applicable',
  }
}

export function applyWorkflowEvent(state: ConversationWorkflow, kind: ActionKind, event: WorkflowEvent): ConversationWorkflow {
  switch (event.type) {
    case 'message_sent':
      return { ...state, lastOutboundAt: event.at, actionStatus: kind === 'fulfillment' ? state.actionStatus : 'waiting' }
    case 'review_requested':
      return kind === 'fulfillment' && state.fulfillmentStatus !== 'delivered'
        ? { ...state, actionStatus: 'waiting', fulfillmentStatus: 'reviewing' } : state
    case 'followup_scheduled':
      return kind === 'fulfillment' ? state : { ...state, actionStatus: 'scheduled' }
    case 'delivery_confirmed':
      return kind === 'fulfillment' && state.paymentStatus === 'paid'
        ? { ...state, actionStatus: 'done', fulfillmentStatus: 'delivered' } : state
    case 'action_completed':
      return kind === 'fulfillment' ? state : { ...state, actionStatus: 'done' }
    case 'action_reopened':
      if (kind === 'fulfillment' && state.fulfillmentStatus === 'delivered') return state
      return { ...state, actionStatus: 'pending', fulfillmentStatus: kind === 'fulfillment' ? 'awaiting-review' : state.fulfillmentStatus }
    case 'legacy_status': {
      const status: ActionStatus = event.legacyStatus ?? state.actionStatus
      return { ...state, actionStatus: status,
        fulfillmentStatus: kind === 'fulfillment'
          ? status === 'done' ? 'delivered' : status === 'waiting' ? 'reviewing' : 'awaiting-review'
          : state.fulfillmentStatus,
      }
    }
  }
}

export function resolveWorkflow(kind: ActionKind, events: WorkflowEvent[]): ConversationWorkflow {
  return events.reduce((state, event) => applyWorkflowEvent(state, kind, event), initialWorkflow(kind))
}
