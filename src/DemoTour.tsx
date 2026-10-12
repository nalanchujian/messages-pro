import { useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, Check, Play, X } from 'lucide-react'
import { dimensionLabel, getTenantProfile, tenantProfiles } from './tenantProfiles'
import type { TenantDimensions, TenantId } from './tenantProfiles'
import { getTenantWorkspaceRule } from './tenantWorkspaceRules'

export type DemoTourHighlight = 'queue' | 'load' | 'action' | 'fulfillment' | 'memory' | 'purchase' | 'collaboration' | 'coverage' | 'verification' | 'copilot' | 'insight'

export type DemoTourStep = {
  id: string
  tenantId: TenantId
  tenantName: string
  tenantType: string
  tenantDifference: string
  conversationId: string
  area: string
  title: string
  description: string
  highlight: DemoTourHighlight
  showAi?: boolean
}

function stepsForTenant(tenantId: TenantId, customDimensions: TenantDimensions): DemoTourStep[] {
  const tenant = getTenantProfile(tenantId, customDimensions)
  const base = {
    tenantId, tenantName: tenant.name, tenantType: tenant.portrait.archetype,
    tenantDifference: tenantId === 'custom'
      ? `当前组合：${dimensionLabel('scale', customDimensions.scale)} · ${dimensionLabel('tasks', customDimensions.tasks)} · ${dimensionLabel('data', customDimensions.data)} · ${dimensionLabel('collaboration', customDimensions.collaboration)}`
      : tenant.portrait.signature,
  }
  if (tenantId === 'aster') return [
    { ...base, id: 'aster-queue', conversationId: 'mason', area: '左侧 · 行动队列', title: '把关系维护排在前面', description: '高价值粉丝占比较高，队列保留续订关怀与日常回复。和 North 的履约优先不同，这里先确保长期关系不断线。', highlight: 'queue' },
    { ...base, id: 'aster-action', conversationId: 'mason', area: '中间 · 当前行动', title: '围绕已有兴趣继续聊', description: '当前行动结合 Mason 已表达的兴趣给出下一句方向。操作员可以查看依据，再决定是否生成或发送回复。', highlight: 'action' },
    { ...base, id: 'aster-memory', conversationId: 'mason', area: '右侧 · 团队记录', title: '接话前看已知背景', description: '右侧优先保留团队备注与已确认记忆，让不同操作员延续同一段关系，避免重复提问和过度推销。', highlight: 'memory' },
  ]
  if (tenantId === 'north') return [
    { ...base, id: 'north-load', conversationId: 'riley', area: '左侧 · 待处理会话', title: '先稳住高峰处理节奏', description: '会话量大时，左侧汇总待处理数量并提供“下一条”。履约请求按处理时限优先，避免高峰期漏掉已付款粉丝。', highlight: 'load' },
    { ...base, id: 'north-fulfillment', conversationId: 'riley', area: '中间 · 当前行动', title: '回复与交付分开处理', description: 'Riley 已付款但交付待核对。发送消息不会自动完成交付；先请求团队核对，再由操作员确认履约。', highlight: 'fulfillment' },
    { ...base, id: 'north-handoff', conversationId: 'riley', area: '右侧 · 轮班交接', title: '让下一班接得住', description: '右侧展示负责人、交接状态与最近事件。North 的规模化处理需要任务和上下文一并移交。', highlight: 'collaboration' },
  ]
  if (tenantId === 'pulse') return [
    { ...base, id: 'pulse-queue', conversationId: 'leo', area: '左侧 · 行动队列', title: '购买后跟进排在前面', description: '购买活跃的团队把首购反馈与后续互动优先呈现，避免只看未读消息而错过刚发生的购买信号。', highlight: 'queue' },
    { ...base, id: 'pulse-action', conversationId: 'leo', area: '中间 · 当前行动', title: '先回应购买体验', description: 'Leo 对已购内容给出了正面反馈。当前行动先建议致谢并询问偏好，不直接跳到下一次销售。', highlight: 'action' },
    { ...base, id: 'pulse-purchase', conversationId: 'leo', area: '右侧 · 购买与互动', title: '用消费线索决定下一句', description: '右侧集中展示购买跟进量与当前消费线索，帮助操作员判断何时继续互动、何时停止推销。', highlight: 'purchase' },
  ]
  if (tenantId === 'seed') return [
    { ...base, id: 'seed-queue', conversationId: 'nate', area: '左侧 · 行动队列', title: '先把基础判断做对', description: '资料稀疏、团队新人多，队列保留人工判断和回复入口；不像 North 那样追求高并发连续处理。', highlight: 'queue' },
    { ...base, id: 'seed-coverage', conversationId: 'nate', area: '右侧 · 资料核对', title: '看清哪些信息还不可靠', description: '资料覆盖较低时，右侧明确提醒区分平台记录、团队记录和 AI 推断，避免把猜测当成粉丝事实。', highlight: 'coverage' },
    { ...base, id: 'seed-verification', conversationId: 'nate', area: '中间 · AI 草稿核对', title: '核对来源后再用 AI 草稿', description: 'AI 可以建议回复，但来源未经核对时无法插入草稿。新人先确认事实，再由人工决定发送。', highlight: 'verification', showAi: true },
  ]

  const rule = getTenantWorkspaceRule(tenant)
  return [
    { ...base, id: 'custom-queue', conversationId: rule.landingConversationId, area: '左侧 · 行动队列', title: '六维特征决定队列顺序', description: `当前选择${dimensionLabel('scale', customDimensions.scale)}、${dimensionLabel('tasks', customDimensions.tasks)}、${dimensionLabel('fans', customDimensions.fans)}。队列据此突出主要任务，同时保留付款履约约束。`, highlight: 'queue' },
    { ...base, id: 'custom-copilot', conversationId: rule.landingConversationId, area: '中间 · AI 辅助', title: 'AI 介入随团队能力变化', description: `当前为${dimensionLabel('ai', customDimensions.ai)}，会话采用${dimensionLabel('collaboration', customDimensions.collaboration)}。AI 的入口和提示会变化，但消息仍由操作员确认发送。`, highlight: 'copilot' },
    { ...base, id: 'custom-insight', conversationId: rule.landingConversationId, area: '右侧 · 会话洞察', title: '洞察随资料完备度调整', description: `当前资料完备度为${dimensionLabel('data', customDimensions.data)}。右侧按六维组合显示重点；资料不足时会提醒核对来源。`, highlight: 'insight' },
  ]
}

export function getDemoTourSteps(startTenantId: TenantId, customDimensions: TenantDimensions): DemoTourStep[] {
  const allTenantIds: TenantId[] = [...tenantProfiles.map((tenant) => tenant.id), 'custom']
  const startIndex = allTenantIds.indexOf(startTenantId)
  const order = [...allTenantIds.slice(startIndex), ...allTenantIds.slice(0, startIndex)]
  return order.flatMap((tenantId) => stepsForTenant(tenantId, customDimensions))
}

type Props = {
  steps: DemoTourStep[]
  stepIndex: number
  onPrevious: () => void
  onNext: () => void
  onSelectTenant: (tenantId: TenantId) => void
  onClose: () => void
}

export function DemoTour({ steps, stepIndex, onPrevious, onNext, onSelectTenant, onClose }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  useEffect(() => {
    closeButtonRef.current?.focus()
    const keepFocusInTour = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const buttons = Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      else if (!panelRef.current?.contains(document.activeElement)) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keepFocusInTour)
    return () => document.removeEventListener('keydown', keepFocusInTour)
  }, [])
  const step = steps[stepIndex]
  const tenantSteps = steps.filter((item) => item.tenantId === step.tenantId)
  const tenantStepIndex = tenantSteps.findIndex((item) => item.id === step.id)
  const tenantGroups = steps.filter((item, index) => index === 0 || item.tenantId !== steps[index - 1].tenantId)
  const nextTenant = steps[stepIndex + 1]?.tenantId !== step.tenantId ? steps[stepIndex + 1]?.tenantName : null
  const isLast = stepIndex === steps.length - 1
  return <>
    <div className="demo-tour-scrim" aria-hidden="true" />
    <section ref={panelRef} className={`demo-tour-panel ${['memory', 'purchase', 'collaboration', 'coverage', 'insight'].includes(step.highlight) ? 'focus-right' : ''}`} role="dialog" aria-modal="true" aria-label="一键演示导览">
      <header className="demo-tour-heading"><span><Play size={14} fill="currentColor" />租户导览 · {step.tenantName}</span><button ref={closeButtonRef} onClick={onClose} aria-label="退出演示" title="退出演示"><X size={17} /></button></header>
      <div className="demo-tour-tenants" role="group" aria-label="选择导览租户">{tenantGroups.map((item) => <button key={item.tenantId} className={item.tenantId === step.tenantId ? 'active' : ''} aria-pressed={item.tenantId === step.tenantId} onClick={() => onSelectTenant(item.tenantId)}>{item.tenantId === 'custom' ? '自定义' : item.tenantName.split(' ')[0]}</button>)}</div>
      <div className="demo-tour-progress" aria-label={`${step.tenantName} 第 ${tenantStepIndex + 1} 步，共 ${tenantSteps.length} 步`}>
        {tenantSteps.map((item, index) => <span key={item.id} className={index === tenantStepIndex ? 'current' : index < tenantStepIndex ? 'complete' : ''} />)}
      </div>
      <div className="demo-tour-content" aria-live="polite"><small>{step.tenantType} · {step.area} · {tenantStepIndex + 1}/{tenantSteps.length}</small><h2>{step.title}</h2><p>{step.description}</p><div className="demo-tour-difference">{step.tenantDifference}</div><div className="demo-tour-cue">查看高亮差异，点击「下一步」继续</div></div>
      <footer className="demo-tour-controls"><button onClick={onPrevious} disabled={stepIndex === 0}><ArrowLeft size={15} />上一步</button><button className="demo-tour-next" onClick={onNext}>{isLast ? <><Check size={15} />结束并恢复</> : <>{nextTenant ? `查看 ${nextTenant}` : '下一步'}<ArrowRight size={15} /></>}</button></footer>
    </section>
  </>
}
