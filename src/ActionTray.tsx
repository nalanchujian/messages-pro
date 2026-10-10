import { Check, ShieldCheck, Sparkles } from 'lucide-react'
import type { ConversationAction, ConversationWorkflow } from './types'
import type { ConversationDecision } from './workspaceEngine'

type Props = {
  action: ConversationAction
  workflow: ConversationWorkflow
  decision: ConversationDecision
  aiEnabled: boolean
  showEvidence: boolean
  onOpenAi: () => void
  onReview: () => void
  onComplete: () => void
  onSchedule: () => void
  onShowEvidence: () => void
}

export function ActionTray({ action, workflow, decision, aiEnabled, showEvidence, onOpenAi, onReview, onComplete, onSchedule, onShowEvidence }: Props) {
  const isFulfillment = action.kind === 'fulfillment'
  const isDone = workflow.actionStatus === 'done'
  const stage = isFulfillment
    ? workflow.fulfillmentStatus === 'delivered' ? '已交付' : workflow.fulfillmentStatus === 'reviewing' ? '待确认交付' : '待核对订单'
    : workflow.actionStatus === 'waiting' ? '等待回复' : workflow.actionStatus === 'scheduled' ? '已安排跟进' : isDone ? '已完成' : '待处理'
  return <section className={`action-tray ${isFulfillment ? 'is-fulfillment' : ''}`} aria-label="当前行动操作">
    <div className="action-tray-main">
      <span className="action-tray-icon">{isDone ? <Check size={16} /> : isFulfillment ? <ShieldCheck size={16} /> : <Sparkles size={16} />}</span>
      <div className="action-tray-copy"><div><strong>{decision.primaryAction}</strong><span>{stage}</span></div><p>{isFulfillment
        ? workflow.fulfillmentStatus === 'delivered' ? '付款与交付分开记录，本次交付已由操作员确认。'
          : workflow.fulfillmentStatus === 'reviewing' ? '团队核对中；付款已记录，交付仍未完成。'
            : '已付款请求需核对交付安排；发送回复不会完成履约。'
        : isDone ? '本轮行动已完成，等待新的业务事件。' : action.reason}</p></div>
    </div>
    <div className="action-tray-actions">
      {isFulfillment && workflow.fulfillmentStatus === 'awaiting-review' && <button className="tray-primary" onClick={onReview}>请求团队核对</button>}
      {isFulfillment && workflow.fulfillmentStatus === 'reviewing' && <button className="tray-primary" onClick={onComplete}>确认已交付</button>}
      {!isFulfillment && workflow.actionStatus === 'pending' && action.kind === 'renewal' && <button className="tray-primary" onClick={onSchedule}>安排跟进</button>}
      {!isFulfillment && workflow.actionStatus === 'pending' && action.kind !== 'renewal' && aiEnabled && <button className="tray-primary" onClick={onOpenAi}>生成回复</button>}
      {showEvidence && <button className="tray-secondary" onClick={onShowEvidence}>查看依据</button>}
    </div>
  </section>
}
