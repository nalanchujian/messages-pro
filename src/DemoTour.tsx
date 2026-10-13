import { useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, Check, Play, X } from 'lucide-react'
import { dimensionLabel, getTenantProfile, tenantProfiles } from './tenantProfiles'
import type { TenantDimensions, TenantId } from './tenantProfiles'
import { getTenantWorkspaceRule } from './tenantWorkspaceRules'

export type DemoTourHighlight = 'list' | 'queue' | 'load' | 'action' | 'fulfillment' | 'memory' | 'purchase' | 'collaboration' | 'coverage' | 'verification' | 'copilot' | 'insight'

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
    { ...base, id: 'aster-list', conversationId: 'mason', area: '左侧 · 会话列表', title: '一眼看到关系背景', description: 'Mason 的会话直接显示消费价值、已知偏好和本次回复目标。关系信息跟着人走，不需要先切换分类才能判断。', highlight: 'list' },
    { ...base, id: 'aster-action', conversationId: 'mason', area: '中间 · 处理路径', title: '围绕已有兴趣继续聊', description: '处理路径先回顾对话，再回应粉丝，最后等待反馈。AI 可以给出可编辑草稿，发送仍由操作员决定。', highlight: 'action' },
    { ...base, id: 'aster-memory', conversationId: 'mason', area: '右侧 · 粉丝资料', title: '接话前看已知背景', description: '切到粉丝资料后，消费、团队备注与记忆集中查看。关系经营先看已知背景，避免重复提问和过度推销。', highlight: 'memory' },
  ]
  if (tenantId === 'north') return [
    { ...base, id: 'north-list', conversationId: 'riley', area: '左侧 · 会话列表', title: '待履约状态直接落在会话上', description: 'Riley 这一行同时显示付款、交付状态、负责人和处理时限。高负载列表更紧凑，操作员可以逐条处理并看见推荐下一条。', highlight: 'list' },
    { ...base, id: 'north-fulfillment', conversationId: 'riley', area: '中间 · 处理路径', title: '回复与交付分开处理', description: '处理路径区分付款、团队核对和交付确认。回复不会自动完成履约，已付款请求始终需要明确的交付操作。', highlight: 'fulfillment' },
    { ...base, id: 'north-handoff', conversationId: 'riley', area: '右侧 · 轮班交接', title: '让下一班接得住', description: '右侧展示负责人、交接状态与最近事件。North 的规模化处理需要任务和上下文一并移交。', highlight: 'collaboration' },
  ]
  if (tenantId === 'pulse') return [
    { ...base, id: 'pulse-list', conversationId: 'leo', area: '左侧 · 会话列表', title: '购买信号跟着会话走', description: 'Leo 这一行显示 PPV 已购、首次购买后的反馈，以及尚未确认的内容偏好；处理员无需先进入购买队列才能发现机会。', highlight: 'list' },
    { ...base, id: 'pulse-action', conversationId: 'leo', area: '中间 · 处理路径', title: '先回应购买体验', description: '购买路径先核实交易，再回应体验，最后等待反馈或安排下一次互动；不会把刚购买等同于可以立即推销。', highlight: 'action' },
    { ...base, id: 'pulse-purchase', conversationId: 'leo', area: '右侧 · 购买与互动', title: '用消费线索决定下一句', description: '右侧集中展示购买跟进量与当前消费线索，帮助操作员判断何时继续互动、何时停止推销。', highlight: 'purchase' },
  ]
  if (tenantId === 'seed') return [
    { ...base, id: 'seed-list', conversationId: 'mason', area: '左侧 · 会话列表', title: '资料缺口直接标在会话上', description: 'Mason 的会话标出待核对推断和具体内容，普通回复可继续使用；新人能在打开聊天前识别风险。', highlight: 'list' },
    { ...base, id: 'seed-coverage', conversationId: 'mason', area: '右侧 · 资料核对', title: '看清哪些信息还不可靠', description: '资料覆盖较低时，右侧明确区分平台记录、团队记录和 AI 推断，避免把猜测当成粉丝事实。', highlight: 'coverage' },
    { ...base, id: 'seed-verification', conversationId: 'mason', area: '中间 · AI 草稿核对', title: '只拦截引用未确认线索的草稿', description: 'Mason 的部分草稿引用尚未核对的内容偏好，需要先查看来源；普通回应仍可插入，最后由人工决定发送。', highlight: 'verification', showAi: true },
  ]

  const rule = getTenantWorkspaceRule(tenant)
  return [
    { ...base, id: 'custom-list', conversationId: rule.landingConversationId, area: '左侧 · 会话列表', title: '六维组合体现在每条会话', description: `当前选择${dimensionLabel('scale', customDimensions.scale)}、${dimensionLabel('tasks', customDimensions.tasks)}、${dimensionLabel('fans', customDimensions.fans)}。同一份会话数据会显示不同的处理依据、关系线索和任务状态。`, highlight: 'list' },
    { ...base, id: 'custom-copilot', conversationId: rule.landingConversationId, area: '中间 · AI 辅助', title: 'AI 介入随团队能力变化', description: `当前为${dimensionLabel('ai', customDimensions.ai)}，会话采用${dimensionLabel('collaboration', customDimensions.collaboration)}。AI 的入口和提示会变化，但消息仍由操作员确认发送。`, highlight: 'copilot' },
    { ...base, id: 'custom-insight', conversationId: rule.landingConversationId, area: '右侧 · 会话洞察', title: '洞察随资料完备度调整', description: `当前资料完备度为${dimensionLabel('data', customDimensions.data)}。右侧把当前处理和粉丝资料分开；资料不足时只对引用未确认线索的草稿要求核对。`, highlight: 'insight' },
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
