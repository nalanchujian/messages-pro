export type Message = {
  id: string
  text: string
  sentAt: string
  direction: 'inbound' | 'outbound'
  status?: 'sent' | 'read'
}

export type Conversation = {
  id: string
  name: string
  handle: string
  avatar: string
  online: boolean
  unread: number
  preview: string
  updatedAt: string
  labels: string[]
  spend: string
  messages: Message[]
  note: string
  summary: string
}

export type ActionKind = 'reply' | 'fulfillment' | 'purchase-follow-up' | 'renewal' | 'manual'
export type ActionStatus = 'pending' | 'waiting' | 'scheduled' | 'done'
export type WorkflowEventType = 'message_sent' | 'review_requested' | 'followup_scheduled' | 'action_completed' | 'delivery_confirmed' | 'action_reopened' | 'legacy_status'
export type WorkflowEvent = {
  id: string
  conversationId: string
  type: WorkflowEventType
  at: number
  legacyStatus?: ActionStatus
}
export type ConversationWorkflow = {
  actionStatus: ActionStatus
  lastOutboundAt: number | null
  paymentStatus: 'none' | 'paid'
  ppvStatus: 'none' | 'viewed' | 'purchased'
  fulfillmentStatus: 'not-applicable' | 'awaiting-review' | 'reviewing' | 'delivered'
}
export type ConversationAction = {
  kind: ActionKind
  title: string
  reason: string
  due: string
  afterSend: string
  source: string
}
export type FanFact = {
  label: string
  value: string
  kind: 'recorded' | 'team' | 'inferred'
  source: string
  updatedAt: string
}

export type FanIntelligence = {
  priorityScore: number
  priorityLabel: string
  signal: string
  reason: string
  strategy: {
    goal: string
    nextAction: string
    guardrail: string
    taskAction: string | null
    drafts: Array<{ tone: string; text: string }>
  }
  memoryCandidates: Array<{ text: string; source: string }>
  risk: '低' | '中' | '高'
  confidence: number
  bestTime: string
  suggestedContent: string
  queues: Array<'reply' | 'fulfillment' | 'renewal' | 'purchase-follow-up' | 'manual'>
  sla: string
  updatedAt: string
  scoreBreakdown: Array<{ label: string; points: number; source: string; updatedAt: string }>
}
