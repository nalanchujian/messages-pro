import { displaySample, getLocale, sourceLabel, sourceValue, t } from './i18n'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ReactNode, DragEvent } from 'react'
import { BarChart3, Check, ChevronDown, ChevronUp, FileText, GripVertical, Info, MapPin, Pencil, Settings, Tags, Users } from 'lucide-react'
import type { Fan, Message } from './types'
import { fanMetrics, money, useDemo } from './store'
import { Avatar, MediaView, Modal, Tooltip } from './ui'
import SalesHistory, { SalesMediaSummary, useChartDrag } from './SalesHistory'
import FanListsDialog from './FanListsDialog'
import NoteTemplateDialog from './NoteTemplateDialog'
import { DateField, SelectField } from './ProfileFields'
import './insights.css'

const getLocations = () => [
  { country: 'United States', timeZone: 'America/New_York', label: t('ui.287') },
  { country: 'United States', timeZone: 'America/Los_Angeles', label: t('ui.288') },
  { country: 'United Kingdom', timeZone: 'Europe/London', label: t('ui.290') },
  { country: 'Canada', timeZone: 'America/Toronto', label: t('ui.292') },
  { country: 'France', timeZone: 'Europe/Paris', label: t('ui.294') },
  { country: 'Germany', timeZone: 'Europe/Berlin', label: t('ui.296') },
  { country: 'Spain', timeZone: 'Europe/Madrid', label: t('ui.298') },
  { country: 'Australia', timeZone: 'Australia/Sydney', label: t('ui.300') },
  { country: 'China', timeZone: 'Asia/Shanghai', label: t('ui.302') },
  { country: 'Japan', timeZone: 'Asia/Tokyo', label: t('ui.304') },
]
const getSourceOptions = () => ['Unknown', 'TikTok', 'Instagram', 'X', 'OnlyFans', 'Reddit', 'Other']
type SectionId = 'spending' | 'metrics' | 'subscription' | 'profile' | 'lists' | 'notes'
type Tab = 'insights' | 'sales' | 'notes'
const sectionIds: SectionId[] = ['spending', 'metrics', 'subscription', 'profile', 'lists', 'notes']
const sectionName = (id: SectionId): string => ({ spending: t('ui.310'), metrics: t('ui.311'), subscription: t('ui.089'), profile: t('insights.profile'), lists: t('ui.312'), notes: t('ui.313') })[id]
function readSectionOrder(): SectionId[] {
  try {
    const saved = JSON.parse(localStorage.getItem('infloww-demo:insight-order') || 'null')
    if (Array.isArray(saved) && saved.length === sectionIds.length && new Set(saved).size === sectionIds.length && saved.every(id => sectionIds.includes(id))) return saved
  } catch { /* Use the reference order when browser storage is unavailable. */ }
  return sectionIds
}
function localTime(now: number, fan: Fan) {
  if (!fan.timeZone || !fan.country || fan.country === 'Unknown' || fan.country === '未知') return t('ui.305')
  try { return new Intl.DateTimeFormat(getLocale()==='zh'?'zh-CN':'en-US', { hour: '2-digit', minute: '2-digit', timeZone: fan.timeZone }).format(now) } catch { return t('ui.305') }
}
function dateLabel(at?: number, includeTime = false) {
  if (!at) return '—'
  return new Intl.DateTimeFormat(getLocale()==='zh'?'zh-CN':'en-US', { month: 'numeric', day: 'numeric', year: 'numeric', ...(includeTime ? { hour: '2-digit', minute: '2-digit' } as const : {}) }).format(at)
}
function subscriptionLabel(fan: Fan) {
  if (fan.subscriptionStatus === 'expired') return fan.subscriptionExpiresAt ? t('insights.subscription.expired', [dateLabel(fan.subscriptionExpiresAt)]) : t('ui.339')
  if (!fan.renew && fan.subscriptionExpiresAt) return t('insights.subscription.expiring', [dateLabel(fan.subscriptionExpiresAt)])
  return t(fan.subscriptionStatus === 'trial' ? 'ui.340' : 'ui.341')
}
function spendAge(at: number, now: number) {
  const minutes = Math.max(0, Math.floor((now - at) / 60000))
  if (!minutes) return t('ui.314')
  if (minutes < 60) return t('ui.315', [minutes])
  if (minutes < 1440) return t('ui.316', [Math.floor(minutes / 60)])
  return t('ui.317', [Math.floor(minutes / 1440)])
}
function InfoTip({ children }: { children: ReactNode }) {
  const anchor = useRef<HTMLSpanElement>(null)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  function place() {
    const rect = anchor.current?.getBoundingClientRect()
    if (rect) setPosition({ left: Math.max(8, Math.min(rect.left - 80, window.innerWidth - 208)), top: rect.bottom + 7 })
  }
  return <span ref={anchor} className="if-tooltip" tabIndex={0} onMouseEnter={place} onFocus={place}><Info size={14} /><span role="tooltip" style={position}>{children}</span></span>
}
// Keep typing local; the reference note editor also saves after a short pause.
function NotesEditor({ value, label, placeholder, onSave, creatorNote = false, resetEmptyOnBlur = false }: { value: string; label: string; placeholder: string; onSave: (value: string) => void; creatorNote?: boolean; resetEmptyOnBlur?: boolean }) {
  const [text, setText] = useState(value)
  const latest = useRef(value), saved = useRef(value), save = useRef(onSave), timer = useRef<number | undefined>(undefined)
  save.current = onSave
  const flush = () => {
    window.clearTimeout(timer.current)
    if (latest.current !== saved.current) { saved.current = latest.current; save.current(latest.current) }
  }
  useEffect(() => { if (value !== saved.current) { saved.current = value; latest.current = value; setText(value) } }, [value])
  useEffect(() => () => { window.clearTimeout(timer.current); if (latest.current !== saved.current) save.current(latest.current) }, [])
  return <textarea className={`if-rich-notes${creatorNote ? ' if-creator-note-editor' : ''}`} aria-label={label} value={text} placeholder={placeholder} maxLength={10000} onBlur={() => { if (resetEmptyOnBlur && !latest.current) { latest.current = placeholder; setText(placeholder) } flush() }} onChange={event => {
    latest.current = event.target.value; setText(event.target.value); window.clearTimeout(timer.current); timer.current = window.setTimeout(flush, 400)
  }} />
}
function SalaryAmountInput({ value, onSave }: { value: number; onSave: (value: number) => void }) {
  const [localValue, setLocalValue] = useState(String(value))
  useEffect(() => setLocalValue(String(value)), [value])
  return <input aria-label={t('ui.318')} type="number" min="0" max="99999" step="0.01" value={localValue} onChange={event => setLocalValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur() }} onBlur={() => { const normalized = Math.floor(Math.min(99999, Math.max(0, Number(localValue) || 0)) * 100) / 100; setLocalValue(String(normalized)); if (normalized !== value) onSave(normalized) }} />
}
function CollapsibleCard({ id, open, onToggle, onMove, onDrop, onDragStart, onDragEnd, dragging, children, action }: {
  id: SectionId; open: boolean; onToggle: () => void; onMove: (direction: -1 | 1) => void;
  onDrop: () => void; onDragStart: (event: DragEvent) => void; onDragEnd: () => void; dragging: boolean;
  children: ReactNode; action?: ReactNode;
}) {
  const title = sectionName(id)
  return <section className={`if-insight-card${dragging ? ' if-insight-dragging' : ''}`} aria-labelledby={`if-${id}-heading`} data-section={id} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move' }} onDrop={event => { event.preventDefault(); onDrop() }}>
    <header><button className="if-insight-drag-handle" draggable aria-label={t('ui.319', [title])} title={t('ui.320')} onDragStart={onDragStart} onDragEnd={onDragEnd} onKeyDown={event => { if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) { event.preventDefault(); onMove(event.key === 'ArrowUp' ? -1 : 1) } }}><GripVertical size={17} /></button><button className="if-insight-card-title" onClick={onToggle} aria-expanded={open}><strong id={`if-${id}-heading`}>{title}</strong></button><span className="if-insight-card-actions">{action}<button aria-label={`${open ? t('ui.321') : t('ui.322')}${title}`} onClick={onToggle}>{open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button></span></header>
    {open && <div className="if-insight-card-body">{children}</div>}
  </section>
}
export function PpvChart({ messages, pricing = false }: { messages: Message[]; pricing?: boolean }) {
  const { state } = useDemo()
  const drag = useChartDrag()
  const [hover, setHover] = useState<{ message: Message; anchor: HTMLElement } | null>(null)
  const tooltipId = useId()
  const latestId = messages.at(-1)?.id
  useEffect(() => { if (drag.ref.current) drag.ref.current.scrollLeft = drag.ref.current.scrollWidth; setHover(null) }, [latestId, messages.length])
  if (!messages.length) return <div className="if-insight-empty">{t('ui.323')}</div>
  const sorted = [...messages].sort((a, b) => a.createdAt - b.createdAt)
  const max = Math.max(1, ...sorted.map(message => message.price)), min = Math.min(...sorted.map(message => message.price))
  const avg = sorted.reduce((total, message) => total + message.price, 0) / sorted.length
  const width = Math.max(pricing ? 460 : 640, sorted.length * 96)
  const points = sorted.map((message, index) => ({ message, x: 64 + (index + .5) / sorted.length * (width - 96), y: 280 - message.price / max * 160 }))
  const messageMedia = (message: Message) => message.attachments.flatMap(attachment => { const media = state.media.find(item => item.id === attachment.mediaId); return media ? [media] : [] })
  return <div className="if-spend-chart"><div className="if-chart-header"><h3>{t(pricing ? 'popup.priceHistory' : 'insights.chart.timeline')}<InfoTip>{t(pricing ? 'popup.priceHistoryHint' : 'insights.chart.hint')}</InfoTip></h3><span>{t(pricing ? 'popup.priceMax' : 'ui.325')}<b>{money(max)}</b>　{t(pricing ? 'popup.priceAvg' : 'ui.326')}<b>{money(pricing ? avg : min)}</b></span></div><div className="if-chart-scroll" {...drag}><svg style={{ minWidth: width }} viewBox={`0 0 ${width} 340`} role="group" aria-label={t('ui.327')}>
    {[0, 1, 2, 3].map(index => <g key={index}><line x1="46" y1={280 - index * 53} x2={width - 24} y2={280 - index * 53} stroke="#ddd" strokeDasharray="4 4" /><text x="38" y={284 - index * 53} textAnchor="end">${Math.round(max * index / 3)}</text></g>)}
    <polyline points={points.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#3467ff" strokeWidth="2" />
    {points.map(({ message, x, y }) => <g key={message.id}><circle cx={x} cy={y} r="4" fill="#fff" stroke="#3467ff" /><foreignObject x={x - 25} y={y - 78} width="50" height="64"><button type="button" className={`if-chart-point${message.purchasedAt ? ' purchased' : ''}`} aria-label={`${dateLabel(message.createdAt, true)} · ${money(message.price)} · ${message.purchasedAt ? t('ui.251') : t('ui.253')}`} aria-describedby={hover?.message.id === message.id ? tooltipId : undefined} onClick={event => setHover({ message, anchor: event.currentTarget })} onMouseEnter={event => setHover({ message, anchor: event.currentTarget })} onMouseLeave={() => setHover(null)} onFocus={event => setHover({ message, anchor: event.currentTarget })} onBlur={() => setHover(null)}><MediaView media={messageMedia(message)[0]} compact /><span>{money(message.price)}</span></button></foreignObject><text x={x} y="308" textAnchor="middle">{new Intl.DateTimeFormat(getLocale()==='zh'?'zh-CN':'en-US', { month: 'numeric', day: 'numeric' }).format(message.createdAt)}</text></g>)}
  </svg></div><div className="if-chart-legend"><span><i />{t('ui.251')}</span><span><i />{t('ui.328')}</span></div>{sorted.length > 7 && <p className="if-chart-pan-hint">{t('insights.chart.drag')}</p>}{hover && <Tooltip id={tooltipId} anchor={hover.anchor}><SalesMediaSummary media={messageMedia(hover.message)} text={hover.message.text} /></Tooltip>}</div>
}

export default function InsightsPanel() {
  const { state, dispatch, creator, fan, now } = useDemo()
  const locations = getLocations()
  const sourceOptions = getSourceOptions()
  const noteTemplate = creator.fanNoteTemplate ?? t('ui.309')
  const [templateOpen, setTemplateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('insights')
  const [open, setOpen] = useState<Record<SectionId, boolean>>({ spending: true, metrics: true, subscription: true, profile: true, lists: true, notes: true })
  const [order, setOrder] = useState(readSectionOrder), [dragging, setDragging] = useState<SectionId | null>(null)
  const [nicknameOpen, setNicknameOpen] = useState(false), [nickname, setNickname] = useState(''), [defaultNickname, setDefaultNickname] = useState('')
  const [listsOpen, setListsOpen] = useState(false), [savedField, setSavedField] = useState('')
  const [chartOpen, setChartOpen] = useState(false)
  const metrics = fan ? fanMetrics(state, creator.id, fan.id) : null
  const transactions = useMemo(() => fan ? state.transactions.filter(item => item.creatorId === creator.id && item.fanId === fan.id && item.kind !== 'subscription' && item.amount > 0).sort((a, b) => b.at - a.at) : [], [state.transactions, creator.id, fan?.id])
  const ppvTransactions = transactions.filter(item => item.kind === 'ppv'), tipTransactions = transactions.filter(item => item.kind === 'tip')
  const lastSpend = transactions[0], highestSpend = [...transactions].sort((a, b) => b.amount - a.amount)[0]
  const toggle = (id: SectionId) => setOpen(value => ({ ...value, [id]: !value[id] }))
  useEffect(() => { setNicknameOpen(false); setListsOpen(false); setTemplateOpen(false); setChartOpen(false); setSavedField('') }, [creator.id, fan?.id])
  useEffect(() => { if (!savedField) return; const timer = window.setTimeout(() => setSavedField(''), 1400); return () => window.clearTimeout(timer) }, [savedField])
  function patchFan(payload: Partial<Fan>, field: string) { if (fan) { dispatch({ type: 'PATCH_FAN', creatorId: creator.id, fanId: fan.id, payload }); setSavedField(field) } }
  function saveOrder(next: SectionId[]) { setOrder(next); try { localStorage.setItem('infloww-demo:insight-order', JSON.stringify(next)) } catch { /* The order still works for this session. */ } }
  function moveSection(id: SectionId, target: SectionId) { if (id === target) return; const next = order.filter(item => item !== id); next.splice(order.indexOf(target), 0, id); saveOrder(next); setDragging(null) }
  const sharedCardProps = (id: SectionId) => ({ id, open: open[id], onToggle: () => toggle(id), onMove: (direction: -1 | 1) => { const target = order[order.indexOf(id) + direction]; if (target) moveSection(id, target) }, onDrop: () => { if (dragging) moveSection(dragging, id) }, onDragStart: (event: DragEvent) => { event.dataTransfer.setData('text/plain', id); event.dataTransfer.effectAllowed = 'move'; setDragging(id) }, onDragEnd: () => setDragging(null), dragging: dragging === id })
  const selectedLocation = fan ? locations.find(item => item.timeZone === fan.timeZone) : undefined
  const selectedSource = fan ? sourceValue(fan.source || 'Unknown') : 'Unknown'
  const fanLists = creator.lists.filter(list => fan?.listIds.includes(list.id))
  const sections = fan && metrics ? {
    spending: <CollapsibleCard {...sharedCardProps('spending')}><div className="if-spending-top"><div><span>{t('ui.329')}</span><strong>{money(metrics.spent)}</strong></div><div><span>{t('ui.330')}</span><strong className="if-spend-age">{lastSpend ? spendAge(lastSpend.at, now) : '—'}</strong><small>{lastSpend ? `${lastSpend.kind === 'ppv' ? t('interface.213') : t('ui.090')} | ${money(lastSpend.amount)}` : '— | —'}</small></div></div><div className="if-insight-divider" /><div className="if-spending-rows"><div><span>{t('interface.213')}</span><b>{money(metrics.messages)} <em>{t('ui.331')}</em></b><small>{ppvTransactions.length ? money(metrics.messages / ppvTransactions.length) : '—'} {t('ui.332')}</small></div><div><span>{t('ui.090')}</span><b>{money(metrics.tips)} <em>{t('ui.331')}</em></b><small>{tipTransactions.length ? money(metrics.tips / tipTransactions.length) : '—'} {t('ui.332')}</small></div><div><span>{t('ui.333')}</span><b>{highestSpend ? money(highestSpend.amount) : '—'}</b>{highestSpend && <small>{highestSpend.kind === 'ppv' ? t('interface.213') : t('ui.090')} | {dateLabel(highestSpend.at)}</small>}</div></div></CollapsibleCard>,
    metrics: <CollapsibleCard {...sharedCardProps('metrics')}><div className="if-metric-row"><span>{t('ui.334')} <InfoTip>{t('insights.metrics.hint')}</InfoTip></span><b>{t(`insights.metrics.${fan.organizationSpendingPower ?? 'insufficient'}`)}</b></div><div className="if-metric-row"><span>{t('ui.337')}</span><b className={`if-risk-chip if-risk-${fan.chargebackRisk ?? 'unknown'}`}>{t(`insights.metrics.${fan.chargebackRisk ?? 'unknown'}`)}</b></div></CollapsibleCard>,
    subscription: <CollapsibleCard {...sharedCardProps('subscription')}><div className="if-detail-rows"><div><span>{t('ui.338')}</span><b className={fan.subscriptionStatus === 'expired' ? 'if-subscription-expired' : !fan.renew ? 'if-subscription-expiring' : 'if-subscription-active'}>{subscriptionLabel(fan)}</b></div><div><span>{t('ui.342')}</span><b>{fan.subscriptionStatus === 'free' || fan.subscriptionStatus === 'trial' || !fan.subscriptionPrice ? t('ui.343') : money(fan.subscriptionPrice)}</b></div><div><span>{t('ui.344')}</span><b>{displaySample(fan.subscriptionLabel) || '—'}</b></div><div><span>{t('insights.subscription.renewal')}</span><b>{fan.renew ? t('ui.346') : t('ui.347')}</b></div></div></CollapsibleCard>,
    profile: <CollapsibleCard key={`${creator.id}:${fan.id}:profile`} {...sharedCardProps('profile')}><div className="if-profile-form">
      <div className="if-profile-line"><span>{t('ui.348')} <InfoTip>{t('ui.349')} {`{name}`}{t('ui.350')}</InfoTip></span><button className="if-inline-edit" onClick={() => { setNickname(fan.nickname); setDefaultNickname(creator.defaultNickname); setNicknameOpen(true) }}>{fan.nickname || creator.defaultNickname || t('ui.351')}<Pencil size={17} /></button></div>
      <label className="if-profile-line"><span>{t('ui.352')}</span><DateField label={t('ui.352')} value={fan.birthday} onChange={birthday => patchFan({ birthday }, t('ui.352'))} /></label>
      <label className="if-location-select"><MapPin size={18} /><SelectField label={t('ui.353')} width={260} searchable value={selectedLocation?.timeZone ?? ''} options={[{ value: '', label: t('ui.305') }, ...locations.map(item => ({ value: item.timeZone, label: item.label }))]} onChange={value => { const item = locations.find(item => item.timeZone === value); patchFan({ country: item?.country ?? 'Unknown', timeZone: item?.timeZone ?? '' }, t('ui.354')) }} /></label>
      <div className="if-profile-line"><span>{t('ui.355')}</span><b>{localTime(now, fan)}</b></div><label className="if-profile-line"><span>{t('ui.356')}</span><SelectField label={t('ui.357')} width={180} value={selectedSource} options={[...new Set([...sourceOptions, selectedSource])].map(source => ({ value: source, label: sourceLabel(source) }))} onChange={source => patchFan({ source }, t('ui.356'))} /></label><div className="if-insight-divider" />
      <div className="if-profile-line if-salary-line"><span>{t('ui.358')}</span><div><div className="if-salary-amount"><SelectField label={t('ui.359')} width={120} value={fan.salaryCurrency ?? '$'} options={['$', '£', '€', 'A$', 'C$'].map(value => ({ value, label: value }))} onChange={salaryCurrency => patchFan({ salaryCurrency }, t('ui.359'))} /><SalaryAmountInput key={`${creator.id}:${fan.id}`} value={fan.salaryAmount ?? 0} onSave={salaryAmount => patchFan({ salaryAmount }, t('ui.358'))} /></div><SelectField label={t('ui.360')} width={180} value={fan.salaryCycle ?? 'monthly'} options={[{ value: 'monthly', label: t('ui.361') }, { value: 'biweekly', label: t('ui.362') }, { value: 'weekly', label: t('ui.363') }, ...(fan.salaryCycle === 'yearly' ? [{ value: 'yearly', label: t('ui.364') }] : [])]} onChange={salaryCycle => patchFan({ salaryCycle: salaryCycle as Fan['salaryCycle'] }, t('ui.360'))} /></div></div>
      <label className="if-profile-line"><span>{t('ui.365')}</span><DateField label={t('ui.365')} value={fan.lastPayDate ?? ''} onChange={lastPayDate => patchFan({ lastPayDate }, t('ui.365'))} /></label>
    </div></CollapsibleCard>,
    lists: <CollapsibleCard {...sharedCardProps('lists')} action={<button aria-label={t('ui.366')} onClick={() => setListsOpen(true)}><Settings size={17} /></button>}><div className="if-list-chips">{fanLists.map(list => <span key={list.id}>{displaySample(list.name)}</span>)}{!fanLists.length && <small>{t('ui.367')}</small>}</div></CollapsibleCard>,
    notes: <CollapsibleCard {...sharedCardProps('notes')} action={<button aria-label={t('ui.368')} onClick={() => setTemplateOpen(true)}><Settings size={17} /></button>}><NotesEditor key={`${creator.id}:${fan.id}:fan`} label={t('ui.369')} value={fan.notes ? displaySample(fan.notes) : noteTemplate} placeholder={noteTemplate} resetEmptyOnBlur onSave={notes => patchFan({ notes }, t('ui.313'))} /></CollapsibleCard>,
  } : null
  return <aside className={`if-insights-panel if-insights-${activeTab}`} aria-label={t('ui.370')}>
    <header className="if-insights-heading"><h2>{activeTab === 'insights' ? t('ui.034') : activeTab === 'sales' ? t('ui.324') : t('ui.371')}</h2>{activeTab === 'sales' ? <button className="if-chart-button" disabled={!fan} onClick={() => setChartOpen(true)}><BarChart3 size={14} />{t('ui.372')}</button> : activeTab === 'notes' ? <Avatar name={creator.name} color={creator.color} size={30} /> : null}{savedField && <span className="if-save-indicator" role="status"><Check size={11} />{t('ui.373')}</span>}</header>
    <div className="if-insights-body" key={activeTab}>
      {activeTab === 'notes' ? <NotesEditor key={`${creator.id}:creator`} creatorNote label={t('ui.371')} value={displaySample(creator.notes)} placeholder={t('ui.374')} onSave={notes => { dispatch({ type: 'PATCH_CREATOR', creatorId: creator.id, payload: { notes } }); if (state.role === 'admin') setSavedField(t('ui.371')) }} /> : !fan || !metrics ? <div className="if-insight-empty"><Users size={28} /><strong>{t('ui.375')}</strong><span>{t('ui.376')}</span></div> : activeTab === 'insights' ? <div className="if-insight-sections">{order.map(id => <div key={id} className="if-insight-section-wrapper">{sections?.[id]}</div>)}</div> : <>
        <div className="if-ppv-buy-rate"><span>{t('ui.377')}</span><b>{metrics.ppvs.filter(message => message.purchasedAt).length}/{metrics.ppvs.length} ({Math.round(metrics.buyRate * 100)}%)</b><InfoTip>{t('ui.378')}</InfoTip></div>
        <div className="if-ppv-price-summary"><div><b>{metrics.ppvs.length ? money(metrics.highestPrice) : '—'}</b><span>{t('ui.379')}</span></div><div><b>{metrics.ppvs.length ? money(metrics.lowestPrice) : '—'}</b><span>{t('ui.380')}</span></div></div>
        <SalesHistory messages={metrics.ppvs} media={state.media} onCopy={message => dispatch({ type: 'COPY_DRAFT', creatorId: creator.id, fanId: fan.id, messageId: message.id })} />
      </>}
    </div>
    <nav className="if-insight-bottom-tabs" aria-label={t('ui.383')}>{([{ id: 'insights', label: t('ui.384'), icon: <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true"><path d="M3 15c2.5-4 5.8-6 10-6s7.5 2 10 6c-2.5 4-5.8 6-10 6S5.5 19 3 15Z" fill="currentColor"/><circle cx="13" cy="15" r="4" fill="white"/><circle cx="13" cy="15" r="2" fill="currentColor"/><path d="M13 3v2M5.5 5.5 7 7M20.5 5.5 19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }, { id: 'sales', label: t('ui.385'), icon: <Tags size={21} /> }, { id: 'notes', label: t('ui.313'), icon: <FileText size={21} /> }] as const).map(tab => <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} aria-pressed={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>{tab.icon}<span>{tab.label}</span></button>)}</nav>
    {nicknameOpen && fan && <Modal title={t('ui.386')} width={480} closable={false} maskClosable={false} onClose={() => setNicknameOpen(false)}><form className="if-insight-modal-form" onSubmit={event => { event.preventDefault(); patchFan({ nickname: nickname.trim() }, t('ui.348')); if (state.role === 'admin' && defaultNickname !== creator.defaultNickname) dispatch({ type: 'PATCH_CREATOR', creatorId: creator.id, payload: { defaultNickname: defaultNickname.trim() } }); setNicknameOpen(false) }}><label>{t('ui.387')}<input value={nickname} maxLength={100} onChange={event => setNickname(event.target.value)} autoFocus /></label><label>{t('ui.388')}<input required title={t('popup.defaultNicknameRequired')} value={defaultNickname} maxLength={100} disabled={state.role !== 'admin'} onChange={event => setDefaultNickname(event.target.value)} /></label><p>{t('ui.389')} {`{name}`}{t('ui.390')}</p><div className="if-insight-modal-footer"><button type="button" className="if-small-button" onClick={() => setNicknameOpen(false)}>{t('ui.071')}</button><button type="submit" disabled={!defaultNickname.trim()} className="if-small-button if-blue-button">{t('ui.391')}</button></div></form></Modal>}
    {listsOpen && fan && <FanListsDialog creatorId={creator.id} fanId={fan.id} onClose={() => setListsOpen(false)} />}
    {templateOpen && <NoteTemplateDialog creatorId={creator.id} onClose={() => setTemplateOpen(false)} onSaved={() => setSavedField(t('noteTemplate.title'))} />}
    {chartOpen && metrics && <Modal title={t('ui.393')} width={800} maskClosable={false} onClose={() => setChartOpen(false)} className="if-sales-chart-dialog"><PpvChart messages={metrics.ppvs} /><div className="if-insight-modal-footer"><button className="if-small-button" onClick={() => setChartOpen(false)}>{t('insights.close')}</button></div></Modal>}

  </aside>
}
