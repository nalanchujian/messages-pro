import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BookOpen, BrainCircuit, Building2, Check, ChevronDown, Lightbulb, Search, Send, Settings2, ShieldCheck, Sparkles, Tag, WandSparkles, X } from 'lucide-react'
import { conversationActions, conversations, fanFacts, fanIntelligence } from './data'
import { conversationFocus, defaultPreferences, defaultVisibleFilters, inferSmartMode } from './smartConfig'
import type { ActivityEvent, DisplayPreferences, InboxFilter, SmartModeId } from './smartConfig'
import { defaultCustomDimensions, defaultTenantId, dimensionLabel, getTenantProfile, tenantDimensionDefinitions, tenantProfiles } from './tenantProfiles'
import type { TenantDimensions, TenantId } from './tenantProfiles'
import { getTenantWorkspaceRule } from './tenantWorkspaceRules'
import type { TenantWorkspaceRule } from './tenantWorkspaceRules'
import { getTenantLevelRule, tenantGradingRules } from './tenantGradingRules'
import type { ActionStatus, Conversation, Message } from './types'
import './styles.css'

type AiMode = 'reply' | 'strategy' | 'rewrite' | 'memory'
type SettingsView = 'smart' | 'manual'
type ManualTab = 'list' | 'chat' | 'sidebar'
type ConfigurationMode = 'smart' | 'manual'
type PreferenceOption = { key: keyof DisplayPreferences; label: string; description: string }

function actionStatus(id: string, statuses: Record<string, ActionStatus>): ActionStatus {
  return statuses[id] ?? (conversationActions[id]?.kind === 'manual' ? 'done' : 'pending')
}

function matchesFilter(item: Conversation, filter: InboxFilter, statuses: Record<string, ActionStatus>) {
  const status = actionStatus(item.id, statuses)
  return filter === 'all' || (filter === 'waiting'
    ? status === 'waiting' || status === 'scheduled'
    : conversationActions[item.id]?.kind === filter && status === 'pending')
}

const inboxFilters: Array<{ id: InboxFilter; label: string }> = [
  { id: 'all', label: '全部' }, { id: 'reply', label: '需回复' }, { id: 'fulfillment', label: '待履约' },
  { id: 'purchase-follow-up', label: '购买跟进' }, { id: 'renewal', label: '续订关怀' },
  { id: 'manual', label: '人工判断' }, { id: 'waiting', label: '等待中' },
]
const queueSettingsKey = 'messages-pro-visible-queues'
const displaySettingsKey = 'messages-pro-display-preferences'
const activitySettingsKey = 'messages-pro-workspace-activity'
const ignoredModeKey = 'messages-pro-ignored-mode'
const tenantSettingsKey = 'messages-pro-selected-tenant'
const draftSettingsKey = 'messages-pro-drafts'
const actionSettingsKey = 'messages-pro-action-statuses'
const conversationSettingsKey = 'messages-pro-demo-conversations'
const memorySettingsKey = 'messages-pro-confirmed-memories'
const configurationModeKey = 'messages-pro-configuration-mode'
const customDimensionsKey = 'messages-pro-custom-tenant-dimensions'
const assignmentSettingsKey = 'messages-pro-assignments'
const triageLockKey = 'messages-pro-triage-lock'
const tenantKey = (key: string, tenantId: TenantId) => `${key}:${tenantId}`

type Assignment = { owner: string; handoffPending: boolean; event: string }

function defaultAssignments(items: Conversation[], collaboration: TenantDimensions['collaboration']): Record<string, Assignment> {
  return Object.fromEntries(items.map((item, index) => [item.id, {
    owner: collaboration === 'solo' ? '我' : index % 3 === 0 ? 'Alex' : '我',
    handoffPending: collaboration === 'shifts' && (item.id === 'riley' || index % 5 === 0),
    event: collaboration === 'shifts' ? '上一班次已留下交接记录' : '会话已分配',
  }]))
}

function loadAssignments(tenantId: TenantId, items: Conversation[], collaboration: TenantDimensions['collaboration']): Record<string, Assignment> {
  const baseline = defaultAssignments(items, collaboration)
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(tenantKey(assignmentSettingsKey, tenantId)) ?? 'null')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return baseline
    for (const item of items) {
      const record = (saved as Record<string, unknown>)[item.id]
      if (record && typeof record === 'object' && !Array.isArray(record)) {
        const value = record as Record<string, unknown>
        if (typeof value.owner === 'string' && typeof value.handoffPending === 'boolean' && typeof value.event === 'string') baseline[item.id] = { owner: value.owner, handoffPending: value.handoffPending, event: value.event }
      }
    }
  } catch { /* Ignore invalid demo ownership. */ }
  return baseline
}

function loadSelectedTenant(): TenantId {
  const saved = localStorage.getItem(tenantSettingsKey)
  return saved === 'custom' || tenantProfiles.some((tenant) => tenant.id === saved) ? saved as TenantId : defaultTenantId
}

function loadCustomDimensions(): TenantDimensions {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(customDimensionsKey) ?? 'null')
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      const next = { ...defaultCustomDimensions }
      for (const dimension of tenantDimensionDefinitions) {
        const value = (saved as Record<string, unknown>)[dimension.key]
        const migrated = dimension.key === 'fans'
          ? ({ broad: 'low', buyers: 'balanced', 'high-value': 'high' } as Record<string, string>)[String(value)] ?? value
          : dimension.key === 'tasks' && value === 'backlog' ? 'fulfillment' : value
        if (dimension.options.some((option) => option.value === migrated)) Object.assign(next, { [dimension.key]: migrated })
      }
      return next
    }
  } catch { /* Ignore invalid demo selections. */ }
  return defaultCustomDimensions
}

function tenantStorageValue(key: string, tenantId: TenantId) {
  return localStorage.getItem(tenantKey(key, tenantId)) ?? (tenantId === defaultTenantId ? localStorage.getItem(key) : null)
}
const listOptions: PreferenceOption[] = [
  { key: 'listPreview', label: '消息预览', description: '在用户列表显示最新一条消息' },
  { key: 'listPriority', label: '行动建议', description: '显示当前需要完成的动作' },
  { key: 'listSla', label: '处理时限', description: '显示行动的处理时间' },
]
const chatOptions: PreferenceOption[] = [
  { key: 'chatNextStep', label: '情境操作条', description: '在输入框旁显示当前行动与快捷入口' },
  { key: 'chatCopilot', label: 'AI Copilot 入口', description: '显示回复、策略、改写与记忆工具' },
  { key: 'chatTimestamps', label: '消息时间与状态', description: '显示消息时间及已读状态' },
  { key: 'chatHelp', label: '输入框提示', description: '显示发送快捷键与草稿说明' },
]
const profileOptions: PreferenceOption[] = [
  { key: 'profileMetrics', label: '消费概览', description: '显示已记录的粉丝消费金额' },
  { key: 'profileRecommendation', label: '当前行动', description: '显示目标、原因、处理时限与依据' },
  { key: 'profileKnown', label: '关键事实', description: '区分平台记录、团队记录与 AI 推断' },
  { key: 'profileMemory', label: '粉丝记忆', description: '显示已记录和确认的偏好' },
]
const decisionOptions = profileOptions.filter((option) => option.key === 'profileRecommendation')
const fanOptions = profileOptions.filter((option) => option.key !== 'profileRecommendation')
const profilePreferenceKeys = profileOptions.map((option) => option.key)

function loadVisibleFilters(tenantId: TenantId): InboxFilter[] {
  try {
    const saved: unknown = JSON.parse(tenantStorageValue(queueSettingsKey, tenantId) ?? 'null')
    if (Array.isArray(saved)) {
      if (saved.some((id) => ['high-value', 'preference', 'unread'].includes(id))) return defaultVisibleFilters
      const valid = [...new Set(saved.filter((id): id is InboxFilter => inboxFilters.some((option) => option.id === id)))]
      if (valid.length) return valid.slice(0, 6)
    }
  } catch { /* Use defaults when stored settings are invalid. */ }
  return defaultVisibleFilters
}

function loadActionStatuses(tenantId: TenantId): Record<string, ActionStatus> {
  try {
    const saved: unknown = JSON.parse(tenantStorageValue(actionSettingsKey, tenantId) ?? '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
    return Object.fromEntries(Object.entries(saved).filter(([id, status]) =>
      id in conversationActions && ['pending', 'waiting', 'scheduled', 'done'].includes(String(status)),
    )) as Record<string, ActionStatus>
  } catch { return {} }
}

function loadPreferences(tenantId: TenantId): DisplayPreferences {
  try {
    const saved: unknown = JSON.parse(tenantStorageValue(displaySettingsKey, tenantId) ?? 'null')
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      const next = { ...defaultPreferences }
      for (const key of Object.keys(defaultPreferences) as Array<keyof DisplayPreferences>) {
        const value = (saved as Record<string, unknown>)[key]
        if (typeof value === 'boolean') next[key] = value
      }
      if (!profilePreferenceKeys.some((key) => next[key])) next.profileMetrics = true
      return next
    }
  } catch { /* Use defaults when stored settings are invalid. */ }
  return defaultPreferences
}

function loadConfigurationMode(tenantId: TenantId): ConfigurationMode {
  const saved = tenantStorageValue(configurationModeKey, tenantId)
  if (saved === 'smart' || saved === 'manual') return saved

  // Older versions saved the default layout on every visit. Preserve only layouts
  // that a tenant actually changed before configuration modes existed.
  const queues = loadVisibleFilters(tenantId)
  const preferences = loadPreferences(tenantId)
  const queuesChanged = queues.join(',') !== defaultVisibleFilters.join(',')
  const preferencesChanged = (Object.keys(defaultPreferences) as Array<keyof DisplayPreferences>)
    .some((key) => preferences[key] !== defaultPreferences[key])
  return queuesChanged || preferencesChanged ? 'manual' : 'smart'
}

function loadActivity(tenantId: TenantId): ActivityEvent[] {
  try {
    const saved: unknown = JSON.parse(tenantStorageValue(activitySettingsKey, tenantId) ?? 'null')
    if (Array.isArray(saved)) return saved.filter((event): event is ActivityEvent =>
      event && ['queue', 'conversation', 'sent'].includes(event.type)
      && inboxFilters.some((option) => option.id === event.focus)
      && typeof event.at === 'number' && event.at <= Date.now() && event.at >= Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).slice(-40)
  } catch { /* Ignore invalid local activity. */ }
  return []
}

type IgnoredMode = { id: SmartModeId; until: number }
function loadIgnoredMode(tenantId: TenantId): IgnoredMode | null {
  try {
    const saved: unknown = JSON.parse(tenantStorageValue(ignoredModeKey, tenantId) ?? 'null')
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      const value = saved as Record<string, unknown>
      if (['reply', 'renewal', 'purchase', 'relationship', 'guidance'].includes(String(value.id)) && typeof value.until === 'number' && value.until > Date.now()) return value as IgnoredMode
    }
  } catch { /* Ignore invalid local feedback. */ }
  return null
}

function loadDrafts(tenantId: TenantId): Record<string, string> {
  try {
    const saved: unknown = JSON.parse(tenantStorageValue(draftSettingsKey, tenantId) ?? '{}')
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved as Record<string, string> : {}
  } catch { return {} }
}

function initialConversations(scale: TenantDimensions['scale']) {
  const count = scale === 'surge' ? conversations.length : scale === 'steady' ? 9 : 5
  return conversations.slice(0, count).map((item) => item.id === 'mason' ? { ...item, unread: 0 } : item)
}

function loadConversationItems(tenantId: TenantId, customDimensions: TenantDimensions): Conversation[] {
  const baseline = initialConversations(getTenantProfile(tenantId, customDimensions).dimensions.scale)
  try {
    const saved: unknown = JSON.parse(tenantStorageValue(conversationSettingsKey, tenantId) ?? 'null')
    if (!Array.isArray(saved)) return baseline
    return baseline.map((base) => {
      const previous = saved.find((item): item is Partial<Conversation> => item && typeof item === 'object' && item.id === base.id)
      if (!previous) return base
      const messages = Array.isArray(previous.messages) && previous.messages.length >= base.messages.length
        ? previous.messages.filter((message): message is Message => message && typeof message.id === 'string' && typeof message.text === 'string' && ['inbound', 'outbound'].includes(message.direction))
        : base.messages
      return {
        ...base,
        messages,
        unread: typeof previous.unread === 'number' ? previous.unread : base.unread,
        preview: typeof previous.preview === 'string' ? previous.preview : base.preview,
        updatedAt: typeof previous.updatedAt === 'string' ? previous.updatedAt : base.updatedAt,
      }
    })
  } catch { return baseline }
}

function loadMemories(tenantId: TenantId): Record<string, string[]> {
  try {
    const saved: unknown = JSON.parse(tenantStorageValue(memorySettingsKey, tenantId) ?? '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
    return Object.fromEntries(Object.entries(saved).filter(([id, values]) => id in conversationActions && Array.isArray(values)).map(([id, values]) =>
      [id, (values as unknown[]).filter((value): value is string => typeof value === 'string')],
    ))
  } catch { return {} }
}

function loadWorkspaceConfig(tenantId: TenantId, customDimensions: TenantDimensions) {
  const mode = loadConfigurationMode(tenantId)
  if (mode === 'manual') return { mode, queues: loadVisibleFilters(tenantId), preferences: loadPreferences(tenantId) }
  const tenant = getTenantProfile(tenantId, customDimensions)
  const proposal = inferSmartMode(loadConversationItems(tenantId, customDimensions), loadActivity(tenantId), 'all', tenant, loadActionStatuses(tenantId))
  const locked = tenant.dimensions.ai === 'triage' && localStorage.getItem(tenantKey(triageLockKey, tenantId)) === 'true'
  return { mode, queues: locked ? loadVisibleFilters(tenantId) : proposal.queues, preferences: { ...defaultPreferences, ...proposal.preferences } }
}

function matchesQuery(item: Conversation, query: string) {
  const term = query.trim().toLowerCase()
  return !term || [item.name, item.handle, item.preview, conversationActions[item.id]?.title ?? ''].some((value) => value.toLowerCase().includes(term))
}

function tenantConversationPriority(item: Conversation, rule: TenantWorkspaceRule, statuses: Record<string, ActionStatus>, assignments: Record<string, Assignment>, collaboration: TenantDimensions['collaboration'], data: TenantDimensions['data']) {
  const status = actionStatus(item.id, statuses)
  const kind = conversationActions[item.id].kind
  // A paid request or explicit fulfillment promise always outranks value and sales signals.
  if (status === 'pending' && kind === 'fulfillment') return 1000 + (data === 'sparse' ? item.unread : fanIntelligence[item.id].priorityScore)
  if (collaboration === 'shifts' && assignments[item.id]?.handoffPending) return 550 + (status === 'pending' ? 20 : 0)
  if (status !== 'pending') return status === 'scheduled' ? -10 : status === 'waiting' ? -20 : -30
  const spend = Number(item.spend.replace(/[^\d.]/g, ''))
  return rule.priorityWeights[kind]
    + (data === 'sparse' ? 0 : fanIntelligence[item.id].priorityScore * 0.1)
    + (data !== 'sparse' && spend >= 1000 ? rule.highValueBonus : 0)
    + item.unread * rule.unreadBonus
}

function isHighValue(item: Conversation) {
  return Number(item.spend.replace(/[^\d.]/g, '')) >= 1000
}

function draftOptions(active: Conversation) {
  return fanIntelligence[active.id].strategy.drafts
}

function memoryCandidates(active: Conversation) {
  return fanIntelligence[active.id].memoryCandidates
}

function App() {
  const messageAreaRef = useRef<HTMLDivElement>(null)
  const scoreDetailsRef = useRef<HTMLDetailsElement>(null)
  const factsSectionRef = useRef<HTMLElement>(null)
  const settingsDialogRef = useRef<HTMLDialogElement>(null)
  const tenantDialogRef = useRef<HTMLDialogElement>(null)
  const gradingDialogRef = useRef<HTMLDialogElement>(null)
  const demoDataDialogRef = useRef<HTMLDialogElement>(null)
  const [tenantId, setTenantId] = useState<TenantId>(loadSelectedTenant)
  const [customDimensions, setCustomDimensions] = useState<TenantDimensions>(loadCustomDimensions)
  const tenant = useMemo(() => getTenantProfile(tenantId, customDimensions), [tenantId, customDimensions])
  const workspaceRule = useMemo(() => getTenantWorkspaceRule(tenant), [tenant])
  const [initialWorkspace] = useState(() => loadWorkspaceConfig(tenantId, customDimensions))
  const [showTenantDialog, setShowTenantDialog] = useState(false)
  const [showGradingDialog, setShowGradingDialog] = useState(false)
  const [showDemoDataDialog, setShowDemoDataDialog] = useState(false)
  const [demoDataResult, setDemoDataResult] = useState('')
  const [items, setItems] = useState<Conversation[]>(() => loadConversationItems(tenantId, customDimensions))
  const [assignments, setAssignments] = useState<Record<string, Assignment>>(() => loadAssignments(tenantId, items, tenant.dimensions.collaboration))
  const [handoffOnly, setHandoffOnly] = useState(false)
  const [showCompactInsights, setShowCompactInsights] = useState(false)
  const [triageLocked, setTriageLocked] = useState(() => localStorage.getItem(tenantKey(triageLockKey, tenantId)) === 'true')
  const [evidenceReviewedId, setEvidenceReviewedId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState(() => workspaceRule.landingConversationId)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<InboxFilter>('all')
  const [configurationMode, setConfigurationMode] = useState<ConfigurationMode>(initialWorkspace.mode)
  const [visibleFilterIds, setVisibleFilterIds] = useState<InboxFilter[]>(initialWorkspace.queues)
  const [preferences, setPreferences] = useState<DisplayPreferences>(initialWorkspace.preferences)
  const [activity, setActivity] = useState<ActivityEvent[]>(() => loadActivity(tenantId))
  const [ignoredMode, setIgnoredMode] = useState<IgnoredMode | null>(() => loadIgnoredMode(tenantId))
  const [previousConfig, setPreviousConfig] = useState<{ queues: InboxFilter[]; preferences: DisplayPreferences; filter: InboxFilter; mode: ConfigurationMode } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsView, setSettingsView] = useState<SettingsView>('smart')
  const [manualTab, setManualTab] = useState<ManualTab>('list')
  const [drafts, setDrafts] = useState<Record<string, string>>(() => loadDrafts(tenantId))
  const [actionStatuses, setActionStatuses] = useState<Record<string, ActionStatus>>(() => loadActionStatuses(tenantId))
  const [openFanIds, setOpenFanIds] = useState(() => [workspaceRule.landingConversationId])
  const [note, setNote] = useState(() => conversations.find((item) => item.id === workspaceRule.landingConversationId)?.note ?? conversations[0].note)
  const [showAi, setShowAi] = useState(false)
  const [aiMode, setAiMode] = useState<AiMode>('reply')
  const [savedMemories, setSavedMemories] = useState<Record<string, string[]>>(() => loadMemories(tenantId))
  const [toast, setToast] = useState('')
  const active = items.find((item) => item.id === activeId) ?? items[0]
  const intelligence = fanIntelligence[active.id]
  const action = conversationActions[active.id]
  const activeActionStatus = actionStatus(active.id, actionStatuses)
  const draft = drafts[active.id] ?? ''
  const activeMemories = savedMemories[active.id] ?? []
  const activeAssignment = assignments[active.id] ?? { owner: '我', handoffPending: false, event: '会话已分配' }
  const needsEvidence = tenant.dimensions.data === 'sparse' && evidenceReviewedId !== active.id
  const handoffCount = items.filter((item) => assignments[item.id]?.handoffPending).length
  const pendingCount = items.filter((item) => actionStatus(item.id, actionStatuses) === 'pending').length
  const tenantInsight = tenant.dimensions.data === 'sparse'
    ? `${fanFacts[active.id].filter((fact) => fact.kind === 'recorded').length} 条平台记录 · 先核对建议所引资料`
    : tenant.dimensions.tasks === 'fulfillment' && action.kind === 'fulfillment'
      ? `${action.reason} · ${activeActionStatus === 'done' ? '已确认交付' : '等待履约确认'}`
      : tenant.dimensions.tasks === 'purchase'
        ? `先回应购买反馈 · ${intelligence.signal}`
        : tenant.dimensions.fans === 'high' ? active.summary
          : `${pendingCount} 项待处理 · ${intelligence.signal}`
  const visibleFilters = visibleFilterIds.map((id) => inboxFilters.find((option) => option.id === id)).filter((option): option is { id: InboxFilter; label: string } => Boolean(option))
  const currentSettingsOptions = manualTab === 'list' ? listOptions : chatOptions
  const visibleProfileSections = profilePreferenceKeys.filter((key) => preferences[key]).length
  const queueCount = (id: InboxFilter) => items.filter((item) => matchesQuery(item, query) && matchesFilter(item, id, actionStatuses)).length
  const insightMetrics = tenant.dimensions.data === 'sparse'
    ? [{ label: '资料覆盖', value: `${Math.round(tenant.signals.dataCoverage * 100)}%` }, { label: '待核对推断', value: String(fanFacts[active.id].filter((fact) => fact.kind === 'inferred').length) }]
    : tenant.dimensions.tasks === 'fulfillment'
      ? [{ label: '待履约', value: String(queueCount('fulfillment')) }, { label: '需回复', value: String(queueCount('reply')) }, { label: '交接中', value: String(handoffCount) }]
      : tenant.dimensions.tasks === 'purchase'
        ? [{ label: '购买跟进', value: String(queueCount('purchase-follow-up')) }, { label: '当前消费', value: active.spend }]
        : [{ label: '高价值占比', value: `${Math.round(tenant.signals.highValueShare * 100)}%` }, { label: '当前消费', value: active.spend }]
  const smartProposal = useMemo(() => inferSmartMode(items, activity, filter, tenant, actionStatuses), [items, activity, filter, tenant, actionStatuses])
  const proposedQueues = smartProposal.queues.filter((id) => inboxFilters.some((option) => option.id === id)).slice(0, 6)
  const addedQueues = proposedQueues.filter((id) => !visibleFilterIds.includes(id))
  const removedQueues = visibleFilterIds.filter((id) => !proposedQueues.includes(id))
  const queuesChanged = proposedQueues.join(',') !== visibleFilterIds.join(',')
  const proposedPreferenceChanges = (Object.entries(smartProposal.preferences) as Array<[keyof DisplayPreferences, boolean]>)
    .filter(([key, value]) => preferences[key] !== value)
  const describePreferenceChange = ([key, value]: [keyof DisplayPreferences, boolean]) => `${key === 'compactList' ? '列表密度' : [...listOptions, ...chatOptions, ...profileOptions].find((option) => option.key === key)?.label}：${key === 'compactList' ? value ? '紧凑' : '标准' : value ? '显示' : '收起'}`
  const queueChanges = [
    addedQueues.length ? `加入 ${addedQueues.map((id) => inboxFilters.find((option) => option.id === id)?.label).join('、')}` : '',
    removedQueues.length ? `收起 ${removedQueues.map((id) => inboxFilters.find((option) => option.id === id)?.label).join('、')}` : '',
    queuesChanged ? `优先显示 ${inboxFilters.find((option) => option.id === proposedQueues[1])?.label ?? '当前重点'}` : '',
  ].filter(Boolean)
  const smartChanges = [
    { section: '用户列表', changes: [...queueChanges, ...proposedPreferenceChanges.filter(([key]) => key === 'compactList' || key.startsWith('list')).map(describePreferenceChange)] },
    { section: '聊天区', changes: proposedPreferenceChanges.filter(([key]) => key.startsWith('chat')).map(describePreferenceChange) },
    { section: '会话洞察', changes: proposedPreferenceChanges.filter(([key]) => key.startsWith('profile')).map(describePreferenceChange) },
  ]
  const hasSmartChanges = configurationMode === 'manual' || queuesChanged || proposedPreferenceChanges.length > 0
  const recommendationIgnored = ignoredMode?.id === smartProposal.id && ignoredMode.until > Date.now()
  const visibleConversations = useMemo(() => [...items]
    .filter((item) => matchesFilter(item, filter, actionStatuses) && matchesQuery(item, query) && (!handoffOnly || assignments[item.id]?.handoffPending))
    .sort((a, b) => tenantConversationPriority(b, workspaceRule, actionStatuses, assignments, tenant.dimensions.collaboration, tenant.dimensions.data) - tenantConversationPriority(a, workspaceRule, actionStatuses, assignments, tenant.dimensions.collaboration, tenant.dimensions.data)), [filter, items, query, actionStatuses, workspaceRule, assignments, tenant.dimensions.collaboration, tenant.dimensions.data, handoffOnly])

  useEffect(() => {
    if (configurationMode !== 'smart') return
    if (!(tenant.dimensions.ai === 'triage' && triageLocked)) setVisibleFilterIds((current) => current.join(',') === smartProposal.queues.join(',') ? current : smartProposal.queues)
    setPreferences((current) => {
      const next = { ...defaultPreferences, ...smartProposal.preferences }
      return (Object.keys(next) as Array<keyof DisplayPreferences>).every((key) => current[key] === next[key]) ? current : next
    })
  }, [configurationMode, smartProposal, tenant.dimensions.ai, triageLocked])

  useEffect(() => {
    localStorage.setItem(tenantKey(assignmentSettingsKey, tenantId), JSON.stringify(assignments))
  }, [assignments, tenantId])

  useEffect(() => {
    localStorage.setItem(tenantKey(triageLockKey, tenantId), String(triageLocked))
  }, [triageLocked, tenantId])

  useEffect(() => {
    localStorage.setItem(tenantKey(draftSettingsKey, tenantId), JSON.stringify(drafts))
  }, [drafts, tenantId])

  useEffect(() => {
    localStorage.setItem(tenantKey(actionSettingsKey, tenantId), JSON.stringify(actionStatuses))
  }, [actionStatuses, tenantId])

  useEffect(() => {
    localStorage.setItem(tenantKey(conversationSettingsKey, tenantId), JSON.stringify(items))
  }, [items, tenantId])

  useEffect(() => {
    localStorage.setItem(tenantKey(memorySettingsKey, tenantId), JSON.stringify(savedMemories))
  }, [savedMemories, tenantId])

  useEffect(() => {
    localStorage.setItem(tenantKey(queueSettingsKey, tenantId), JSON.stringify(visibleFilterIds))
  }, [visibleFilterIds, tenantId])

  useEffect(() => {
    localStorage.setItem(tenantKey(displaySettingsKey, tenantId), JSON.stringify(preferences))
  }, [preferences, tenantId])

  useEffect(() => {
    localStorage.setItem(tenantKey(configurationModeKey, tenantId), configurationMode)
  }, [configurationMode, tenantId])

  useEffect(() => {
    localStorage.setItem(tenantKey(activitySettingsKey, tenantId), JSON.stringify(activity))
  }, [activity, tenantId])

  useEffect(() => {
    if (ignoredMode) localStorage.setItem(tenantKey(ignoredModeKey, tenantId), JSON.stringify(ignoredMode))
    else localStorage.removeItem(tenantKey(ignoredModeKey, tenantId))
  }, [ignoredMode, tenantId])

  useEffect(() => {
    localStorage.setItem(tenantSettingsKey, tenantId)
  }, [tenantId])

  useEffect(() => {
    localStorage.setItem(customDimensionsKey, JSON.stringify(customDimensions))
  }, [customDimensions])

  useEffect(() => {
    const dialog = tenantDialogRef.current
    if (!dialog) return
    if (showTenantDialog && !dialog.open) dialog.showModal()
    if (!showTenantDialog && dialog.open) dialog.close()
  }, [showTenantDialog])

  useEffect(() => {
    const dialog = gradingDialogRef.current
    if (!dialog) return
    if (showGradingDialog && !dialog.open) dialog.showModal()
    if (!showGradingDialog && dialog.open) dialog.close()
  }, [showGradingDialog])

  useEffect(() => {
    const dialog = demoDataDialogRef.current
    if (!dialog) return
    if (showDemoDataDialog && !dialog.open) dialog.showModal()
    if (!showDemoDataDialog && dialog.open) dialog.close()
  }, [showDemoDataDialog])

  useEffect(() => {
    const dialog = settingsDialogRef.current
    if (!dialog) return
    if (showSettings && !dialog.open) dialog.showModal()
    if (!showSettings && dialog.open) dialog.close()
  }, [showSettings])

  useEffect(() => {
    if (!preferences.chatCopilot) setShowAi(false)
  }, [preferences.chatCopilot])

  useLayoutEffect(() => {
    const area = messageAreaRef.current
    if (area) area.scrollTop = area.scrollHeight
  }, [active.id, active.messages.length, showAi])

  useEffect(() => {
    const area = messageAreaRef.current
    if (!area) return
    const observer = new ResizeObserver(() => { area.scrollTop = area.scrollHeight })
    observer.observe(area)
    return () => observer.disconnect()
  }, [])

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  function recordActivity(type: ActivityEvent['type'], focus: InboxFilter) {
    const now = Date.now()
    setActivity((current) => [...current.filter((event) => event.at >= now - 7 * 24 * 60 * 60 * 1000), { type, focus, at: now }].slice(-40))
  }

  function changeTenant(nextId: TenantId) {
    if (nextId === tenantId) return
    localStorage.setItem(tenantKey(queueSettingsKey, tenantId), JSON.stringify(visibleFilterIds))
    localStorage.setItem(tenantKey(displaySettingsKey, tenantId), JSON.stringify(preferences))
    localStorage.setItem(tenantKey(configurationModeKey, tenantId), configurationMode)
    localStorage.setItem(tenantKey(activitySettingsKey, tenantId), JSON.stringify(activity))
    localStorage.setItem(tenantKey(draftSettingsKey, tenantId), JSON.stringify(drafts))
    localStorage.setItem(tenantKey(actionSettingsKey, tenantId), JSON.stringify(actionStatuses))
    localStorage.setItem(tenantKey(conversationSettingsKey, tenantId), JSON.stringify(items))
    localStorage.setItem(tenantKey(memorySettingsKey, tenantId), JSON.stringify(savedMemories))
    localStorage.setItem(tenantKey(assignmentSettingsKey, tenantId), JSON.stringify(assignments))
    localStorage.setItem(tenantKey(triageLockKey, tenantId), String(triageLocked))
    if (ignoredMode) localStorage.setItem(tenantKey(ignoredModeKey, tenantId), JSON.stringify(ignoredMode))
    else localStorage.removeItem(tenantKey(ignoredModeKey, tenantId))
    const nextWorkspace = loadWorkspaceConfig(nextId, customDimensions)
    setTenantId(nextId)
    setConfigurationMode(nextWorkspace.mode)
    setVisibleFilterIds(nextWorkspace.queues)
    setPreferences(nextWorkspace.preferences)
    setActivity(loadActivity(nextId))
    setIgnoredMode(loadIgnoredMode(nextId))
    setDrafts(loadDrafts(nextId))
    setActionStatuses(loadActionStatuses(nextId))
    const nextItems = loadConversationItems(nextId, customDimensions)
    setItems(nextItems)
    setAssignments(loadAssignments(nextId, nextItems, getTenantProfile(nextId, customDimensions).dimensions.collaboration))
    setHandoffOnly(false)
    setShowCompactInsights(false)
    setTriageLocked(localStorage.getItem(tenantKey(triageLockKey, nextId)) === 'true')
    setEvidenceReviewedId(null)
    const landingId = getTenantWorkspaceRule(getTenantProfile(nextId, customDimensions)).landingConversationId
    setActiveId(landingId)
    setOpenFanIds([landingId])
    setNote(conversations.find((item) => item.id === landingId)?.note ?? conversations[0].note)
    setSavedMemories(loadMemories(nextId))
    setFilter('all')
    setQuery('')
    setShowAi(false)
    setPreviousConfig(null)
  }

  function updateCustomDimension<K extends keyof TenantDimensions>(key: K, value: TenantDimensions[K]) {
    if (customDimensions[key] === value) return
    const next = { ...customDimensions, [key]: value }
    setCustomDimensions(next)
    if (tenantId === 'custom') {
      const nextItems = key === 'scale'
        ? initialConversations(next.scale).map((base) => items.find((item) => item.id === base.id) ?? base)
        : items
      if (key === 'scale') {
        setItems(nextItems)
        if (!nextItems.some((item) => item.id === activeId)) {
          const landingId = getTenantWorkspaceRule(getTenantProfile('custom', next)).landingConversationId
          setActiveId(landingId)
          setOpenFanIds([landingId])
        }
      }
      if (key === 'tasks') {
        const landingId = getTenantWorkspaceRule(getTenantProfile('custom', next)).landingConversationId
        setActiveId(landingId)
        setOpenFanIds((current) => current.includes(landingId) ? current : [...current, landingId])
        setNote(conversations.find((item) => item.id === landingId)?.note ?? conversations[0].note)
        setShowAi(false)
      }
      if (key === 'collaboration') {
        setAssignments(defaultAssignments(nextItems, next.collaboration))
        setHandoffOnly(false)
      } else if (key === 'scale') {
        setAssignments((current) => ({ ...defaultAssignments(nextItems, next.collaboration), ...current }))
      }
      if (key === 'ai') setTriageLocked(false)
      if (key === 'data') setEvidenceReviewedId(null)
      const proposal = inferSmartMode(nextItems, activity, filter, getTenantProfile('custom', next), actionStatuses)
      setConfigurationMode('smart')
      setVisibleFilterIds(proposal.queues)
      setPreferences({ ...defaultPreferences, ...proposal.preferences })
      setPreviousConfig(null)
    }
  }

  function selectConversation(id: string) {
    const next = items.find((item) => item.id === id)
    if (!next) return
    if (id !== activeId) recordActivity('conversation', conversationFocus(id))
    setActiveId(id)
    setOpenFanIds((current) => current.includes(id) ? current : [...current, id])
    setNote(next.note)
    setShowAi(false)
    setItems((current) => current.map((item) => item.id === id ? { ...item, unread: 0 } : item))
  }

  function closeFanTab(id: string) {
    if (openFanIds.length <= 1) return
    const remaining = openFanIds.filter((fanId) => fanId !== id)
    setOpenFanIds(remaining)
    if (activeId === id) {
      const nextId = remaining[remaining.length - 1]
      const next = items.find((item) => item.id === nextId)
      if (next) {
        setActiveId(nextId)
        setNote(next.note)
        setShowAi(false)
        setItems((current) => current.map((item) => item.id === nextId ? { ...item, unread: 0 } : item))
      }
    }
  }

  function updateDraft(value: string) {
    setDrafts((current) => ({ ...current, [active.id]: value }))
  }

  function setInboxFilter(next: InboxFilter) {
    setFilter(next)
    if (next !== filter) recordActivity('queue', next)
  }

  function toggleVisibleFilter(id: InboxFilter) {
    const selected = visibleFilterIds.includes(id)
    if ((selected && visibleFilterIds.length === 1) || (!selected && visibleFilterIds.length === 6)) return
    const next = selected ? visibleFilterIds.filter((value) => value !== id) : [...visibleFilterIds, id]
    setPreviousConfig(null)
    setConfigurationMode('manual')
    setVisibleFilterIds(next)
    if (selected && filter === id) setFilter(inboxFilters.find((item) => next.includes(item.id))!.id)
  }

  function togglePreference(key: keyof DisplayPreferences) {
    if (profilePreferenceKeys.includes(key) && preferences[key] && visibleProfileSections === 1) return
    setPreviousConfig(null)
    setConfigurationMode('manual')
    setPreferences((current) => ({ ...current, [key]: !current[key] }))
  }

  function resetSettings() {
    const proposal = inferSmartMode(items, activity, 'all', tenant, actionStatuses)
    setPreviousConfig(null)
    setConfigurationMode('smart')
    setVisibleFilterIds(proposal.queues)
    setPreferences({ ...defaultPreferences, ...proposal.preferences })
    if (!proposal.queues.includes(filter)) setFilter('all')
  }

  function applySmartProposal() {
    if (!hasSmartChanges) return
    setPreviousConfig(configurationMode === 'manual' ? { queues: visibleFilterIds, preferences, filter, mode: configurationMode } : null)
    setConfigurationMode('smart')
    setVisibleFilterIds(proposedQueues)
    setPreferences((current) => ({ ...current, ...smartProposal.preferences }))
    if (!proposedQueues.includes(filter)) setFilter('all')
    setIgnoredMode(null)
    notify(`已应用${tenant.portrait.archetype}推荐配置`)
  }

  function undoSmartProposal() {
    if (!previousConfig) return
    setVisibleFilterIds(previousConfig.queues)
    setPreferences(previousConfig.preferences)
    setConfigurationMode(previousConfig.mode)
    setFilter(previousConfig.filter)
    setPreviousConfig(null)
    notify('已撤销智能配置')
  }

  function ignoreSmartProposal() {
    setIgnoredMode({ id: smartProposal.id, until: Date.now() + 24 * 60 * 60 * 1000 })
  }

  function resetDemoConversations() {
    setItems(initialConversations(tenant.dimensions.scale))
    setAssignments(defaultAssignments(initialConversations(tenant.dimensions.scale), tenant.dimensions.collaboration))
    setHandoffOnly(false)
    setEvidenceReviewedId(null)
    setActionStatuses({})
    setDrafts({})
    setActiveId(workspaceRule.landingConversationId)
    setOpenFanIds([workspaceRule.landingConversationId])
    setNote(conversations.find((item) => item.id === workspaceRule.landingConversationId)?.note ?? conversations[0].note)
    setSavedMemories({})
    setFilter('all')
    setShowAi(false)
  }

  function showRecommendationEvidence() {
    if (preferences.profileRecommendation && scoreDetailsRef.current) {
      scoreDetailsRef.current.open = true
      scoreDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } else if (factsSectionRef.current) {
      factsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } else if (preferences.chatCopilot) {
      setAiMode('strategy')
      setShowAi(true)
    }
  }

  function sendMessage() {
    if (!draft.trim()) return
    const message: Message = { id: crypto.randomUUID(), text: draft.trim(), sentAt: '现在', direction: 'outbound', status: 'sent' }
    setItems((current) => current.map((item) => item.id === active.id ? { ...item, messages: [...item.messages, message], preview: message.text, updatedAt: '刚刚' } : item))
    if (action.kind !== 'fulfillment') setActionStatuses((current) => ({ ...current, [active.id]: 'waiting' }))
    recordActivity('sent', conversationFocus(active.id))
    updateDraft('')
    notify(action.kind === 'fulfillment' ? '消息已发送 · 付款请求仍待确认交付' : `消息已发送 · ${action.afterSend}`)
  }

  function rewriteDraft() {
    updateDraft(draftOptions(active)[1]?.text ?? draftOptions(active)[0].text)
  }

  function confirmMemory(memory: string) {
    if (activeMemories.includes(memory)) return
    setSavedMemories((current) => ({ ...current, [active.id]: [...(current[active.id] ?? []), memory] }))
    notify('已写入粉丝记忆')
  }

  function createSmartTask() {
    if (!intelligence.strategy.taskAction || activeActionStatus === 'scheduled') return
    setActionStatuses((current) => ({ ...current, [active.id]: action.kind === 'fulfillment' ? 'waiting' : 'scheduled' }))
    notify(action.kind === 'fulfillment' ? '已请求团队核对 · 交付前仍需确认' : `已安排：${intelligence.strategy.taskAction}`)
  }

  function completeAction() {
    setActionStatuses((current) => ({ ...current, [active.id]: 'done' }))
    notify(action.kind === 'fulfillment' ? '已确认交付完成' : '已完成当前行动')
  }

  function updateAssignment(owner: string, handoffPending: boolean, event: string) {
    setAssignments((current) => ({ ...current, [active.id]: { owner, handoffPending, event } }))
    notify(event)
  }

  function openNextPending() {
    const next = visibleConversations.find((item) => item.id !== active.id && (actionStatus(item.id, actionStatuses) === 'pending' || assignments[item.id]?.handoffPending))
    if (next) selectConversation(next.id)
    else notify('当前筛选中没有下一条待处理会话')
  }

  function reopenAction() {
    setActionStatuses((current) => ({ ...current, [active.id]: 'pending' }))
    notify('已恢复待办行动')
  }

  const profilePanels = {
    recommendation: preferences.profileRecommendation ? <section className="detail-section priority-section">
      <div className="section-title"><h3><Sparkles size={17} />当前行动</h3><span className={`task-status ${activeActionStatus}`}>{activeActionStatus === 'pending' ? '待处理' : activeActionStatus === 'waiting' ? action.kind === 'fulfillment' ? '团队核对中' : '等待回复' : activeActionStatus === 'scheduled' ? '已安排' : '已完成'}</span></div>
      <p className="priority-context">{action.reason}</p>
      <h4>{activeActionStatus === 'pending' ? action.title : activeActionStatus === 'waiting' ? action.afterSend : activeActionStatus === 'scheduled' ? '按计划跟进' : action.kind === 'fulfillment' ? '交付已确认' : '当前无需主动处理'}</h4>
      <p className="priority-next">{activeActionStatus === 'pending' ? intelligence.strategy.nextAction : activeActionStatus === 'waiting' ? action.kind === 'fulfillment' ? '收到团队确认后，再向粉丝给出准确交付时间；完成交付后手动确认。' : '新消息到来后可恢复处理；也可以手动恢复待办。' : activeActionStatus === 'scheduled' ? '跟进已记录，届时核对最新对话再处理。' : '等待下一次消息或新的业务事件。'}</p>
      <div className="action-meta"><span>处理时间</span><strong>{activeActionStatus === 'pending' ? action.due : activeActionStatus === 'waiting' ? action.kind === 'fulfillment' ? '等待团队确认' : '等待粉丝' : activeActionStatus === 'scheduled' ? '已安排' : '暂无'}</strong></div>
      <div className="task-controls">{activeActionStatus === 'pending' && intelligence.strategy.taskAction && <button className="priority-action" onClick={createSmartTask}>{action.kind === 'fulfillment' ? '请求团队核对' : intelligence.strategy.taskAction}</button>}{activeActionStatus === 'pending' ? <button className="task-secondary" onClick={completeAction}>{action.kind === 'fulfillment' ? '确认已交付' : '标记完成'}</button> : <><button className="task-secondary" onClick={reopenAction}>恢复待办</button>{activeActionStatus !== 'done' && <button className="task-secondary" onClick={completeAction}>{action.kind === 'fulfillment' ? '确认已交付' : '标记完成'}</button>}</>}</div>
      <p className="strategy-boundary">沟通边界：{intelligence.strategy.guardrail}</p>
      <details className="score-details" ref={scoreDetailsRef} onToggle={(event) => { if (event.currentTarget.open) setEvidenceReviewedId(active.id) }}><summary>查看建议依据与来源 <span>样例数据</span></summary><p className="score-explanation">{intelligence.reason}</p>{intelligence.scoreBreakdown.map((factor) => <div className="score-factor" key={factor.label}><div className="factor-line"><span>{factor.label}</span></div><small>{factor.source} · {factor.updatedAt}</small></div>)}<p className="data-updated">更新：{intelligence.updatedAt}</p></details>
    </section> : null,
    metrics: preferences.profileMetrics ? <div className="fan-summary"><span>{active.name} · {active.handle} <small>演示资料</small></span><strong>累计消费 {active.spend}</strong></div> : null,
    facts: preferences.profileKnown ? <section className="detail-section facts-section" ref={factsSectionRef}><div className="section-title"><h3><Tag size={17} />关键事实与线索</h3>{tenant.dimensions.data === 'sparse' && <button className="source-confirm" onClick={() => { setEvidenceReviewedId(active.id); notify('已核对当前会话来源') }}>{needsEvidence ? '确认已核对' : '已核对'}</button>}</div>{tenant.dimensions.data === 'sparse' && <p className="source-caution">仅将平台与团队记录视为已知事实；AI 推断仍待确认。</p>}{fanFacts[active.id].map((fact) => <div className="fact-row" key={fact.label}><div><strong>{fact.label}</strong><span className={`fact-kind ${fact.kind}`}>{fact.kind === 'recorded' ? '平台记录' : fact.kind === 'team' ? '团队记录' : 'AI 推断'}</span></div><p>{fact.value}</p><small>{fact.source} · {fact.updatedAt}</small></div>)}</section> : null,
    memory: preferences.profileMemory ? <section className="detail-section"><div className="section-title"><h3><BrainCircuit size={17} />团队记录</h3><span className="memory-count">新增确认 {activeMemories.length}</span></div><p className="record-label">团队备注</p><p className="profile-note">{note}</p>{activeMemories.map((memory) => <p className="confirmed-memory" key={memory}><Check size={13} />{memory}<small>已由操作员确认</small></p>)}</section> : null,
  }

  return <main className={`app-shell workspace-${tenantId}`}>
    <aside className={`inbox-panel ${preferences.compactList ? 'compact-list' : ''}`} aria-label="用户列表">
      <header className="inbox-header"><div className="brand-mark" aria-label="Messages Pro">M</div><div className="search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索用户或对话" aria-label="搜索用户或对话" />{query && <button onClick={() => setQuery('')} aria-label="清除搜索"><X size={15} /></button>}</div></header>
      <div className="inbox-controls">
        <div className="queue-heading"><strong>行动队列</strong><span>{configurationMode === 'smart' ? workspaceRule.queueHint : '本租户手动配置'}</span></div>
        <div className="queue-grid" role="group" aria-label="行动队列">{visibleFilters.map((option) => <button key={option.id} className={`queue-button ${filter === option.id ? 'active' : ''}`} aria-pressed={filter === option.id} onClick={() => setInboxFilter(option.id)}><span>{option.label}</span><b>{queueCount(option.id)}</b></button>)}</div>
        <div className="list-toolbar"><strong>会话列表</strong><span>{visibleConversations.length} 位 · 按{workspaceRule.sortLabel}排序</span></div>
        {((tenant.dimensions.ai === 'triage' && configurationMode === 'smart') || tenant.dimensions.collaboration === 'shifts' || tenant.dimensions.scale === 'surge') && <div className="list-workflow-tools">
          {tenant.dimensions.ai === 'triage' && configurationMode === 'smart' && <button className={triageLocked ? 'active' : ''} onClick={() => setTriageLocked((value) => !value)} title="只冻结次要行动队列的顺序，不影响会话优先级">{triageLocked ? '队列已固定' : '队列自适应'}</button>}
          {tenant.dimensions.collaboration === 'shifts' && <button className={handoffOnly ? 'active' : ''} onClick={() => setHandoffOnly((value) => !value)}>待交接 {handoffCount}</button>}
          {tenant.dimensions.scale === 'surge' && <button onClick={openNextPending}>下一条待办 →</button>}
        </div>}
        {tenant.dimensions.ai === 'triage' && configurationMode === 'smart' && <p className="triage-reason">{triageLocked ? '已固定当前队列顺序，可随时恢复自适应。' : '次要队列根据近期操作排序；已付款履约始终优先。'}</p>}</div>
      {!visibleConversations.some((item) => item.id === active.id) && <div className="filtered-active"><span>当前聊天 {active.name} 不在筛选结果中</span><button onClick={() => { setQuery(''); setFilter('all') }}>显示会话</button></div>}
      <div className="conversation-list">{visibleConversations.length ? visibleConversations.map((item) => {
        const itemAction = conversationActions[item.id]
        const itemStatus = actionStatus(item.id, actionStatuses)
        return <button className={`conversation ${item.id === active.id ? 'selected' : ''}`} onClick={() => selectConversation(item.id)} key={item.id}>
          <div className="avatar">{item.avatar}{item.online && <i />}</div><div className="conversation-copy"><div className="conversation-title"><strong>{item.name}</strong><time>{item.updatedAt}</time></div>{preferences.listPreview && <p>{item.preview}</p>}{preferences.listPriority && <div className="conversation-meta"><span title={itemAction.reason}>{itemStatus === 'pending' ? itemAction.title : itemStatus === 'waiting' ? itemAction.afterSend : itemStatus === 'scheduled' ? '已安排跟进' : '暂无待办'}</span><em className={`action-state ${itemStatus}`}>{itemStatus === 'pending' ? '待办' : itemStatus === 'waiting' ? '等待' : itemStatus === 'scheduled' ? '已安排' : '完成'}</em></div>}{(tenant.dimensions.collaboration !== 'solo' || tenant.dimensions.fans === 'high') && <div className="conversation-signals">{tenant.dimensions.collaboration !== 'solo' && <span>{assignments[item.id]?.handoffPending ? '待交接' : `负责人 ${assignments[item.id]?.owner ?? '我'}`}</span>}{tenant.dimensions.fans === 'high' && isHighValue(item) && <span>高价值关系</span>}</div>}{preferences.listSla && itemStatus === 'pending' && <small className="sla-hint">{itemAction.due}</small>}</div>{item.unread > 0 && <b className="unread-count">{item.unread}</b>}
        </button>
      }) : <div className="empty-list"><Search size={18} /><strong>没有匹配的用户</strong><span>尝试调整搜索或筛选条件</span></div>}</div>
      <div className="inbox-settings">
        <div className="user-settings-entry">
          <button className={`${showSettings ? 'active' : ''} ${hasSmartChanges && !recommendationIgnored ? 'has-suggestion' : ''}`} onClick={() => { setSettingsView('smart'); setShowSettings(true) }} aria-label={hasSmartChanges && !recommendationIgnored ? '工作台设置，有智能建议' : '工作台设置'} aria-haspopup="dialog" aria-expanded={showSettings} aria-controls="workspace-settings-dialog" title="配置当前租户的工作台"><Settings2 size={16} /><span><strong>工作台设置</strong><small>调整当前租户的显示方式</small></span></button>
        </div>
      </div>
    </aside>
    <section className="chat-panel" aria-label="聊天模块">
      <header className="chat-header"><div className="chat-identity"><div className="avatar large">{active.avatar}{active.online && <i />}</div><div><h2>{active.name}</h2><p>{active.handle}{tenant.dimensions.collaboration !== 'solo' && ` · ${activeAssignment.owner}负责`}</p></div></div><div className="chat-header-meta"><button className="compact-tenant-trigger" onClick={() => setShowTenantDialog(true)} aria-label={`切换演示租户，当前 ${tenant.name}`} aria-haspopup="dialog" aria-expanded={showTenantDialog} aria-controls="tenant-switch-dialog" title={`切换演示租户 · ${tenant.name}`}><Building2 size={14} /><span>{tenant.name}</span></button><button className="compact-insights-trigger" onClick={() => setShowCompactInsights(true)}>会话洞察</button><span className="workspace-mode-badge">{workspaceRule.workStyle}</span><span className="header-presence">{active.online ? '在线' : '离线'}</span></div></header>
      {openFanIds.length > 1 && <div className="fan-tabs" role="tablist" aria-label="已打开的粉丝会话">{openFanIds.map((fanId) => {
        const fan = items.find((item) => item.id === fanId)
        if (!fan) return null
        return <div className={`fan-tab ${fanId === active.id ? 'active' : ''}`} key={fanId}><button role="tab" aria-selected={fanId === active.id} onClick={() => selectConversation(fanId)}><span className="tab-presence" data-online={fan.online} />{fan.name}{drafts[fanId]?.trim() && <i className="draft-indicator" title="有未发送草稿" />}</button><button className="close-tab" aria-label={`关闭 ${fan.name} 会话`} onClick={() => closeFanTab(fanId)}><X size={12} /></button></div>
      })}</div>}
      <div className="message-area" ref={messageAreaRef}><div className="message-thread"><div className="date-pill">今天</div>{active.messages.map((message) => <div className={`message-row ${message.direction}`} key={message.id}><div className="bubble">{message.text}</div>{preferences.chatTimestamps && <small>{message.sentAt}{message.status === 'read' ? ' · 已读' : ''}</small>}</div>)}</div></div>
      <footer className="composer">
        {preferences.chatNextStep && <div className={`context-action ${activeActionStatus}`}><div className="context-action-copy"><Sparkles size={15} /><span>{activeActionStatus === 'pending' ? <><strong>{action.title}</strong> · {intelligence.strategy.nextAction}</> : activeActionStatus === 'waiting' ? action.afterSend : activeActionStatus === 'scheduled' ? '跟进已安排，等待到期处理' : '当前没有待办行动'}</span></div><div className="context-action-buttons">{activeActionStatus === 'pending' && (action.kind === 'renewal' ? <button onClick={createSmartTask}>安排跟进</button> : preferences.chatCopilot && <button onClick={() => { setAiMode('reply'); setShowAi(true) }}>生成回复</button>)}{preferences.profileRecommendation && <button onClick={showRecommendationEvidence}>查看依据</button>}</div></div>}
        {preferences.chatCopilot && <div className="quick-actions"><button onClick={() => { setShowAi((current) => !current); setAiMode(workspaceRule.copilotStart) }} className={`ai-button ${showAi ? 'active' : ''}`}><BrainCircuit size={16} />{workspaceRule.copilotLabel}</button><span>{workspaceRule.chatHint}</span></div>}
        {preferences.chatCopilot && showAi && <section className="ai-workbench">
          <div className="ai-workbench-header"><div><span className="ai-orb"><Sparkles size={15} /></span><div><strong>AI Copilot</strong><p>所有建议都可编辑，确认后才会发送或写入资料。</p></div></div><button onClick={() => setShowAi(false)} aria-label="关闭 AI Copilot"><X size={16} /></button></div>
          <div className="ai-tabs"><button className={aiMode === 'reply' ? 'active' : ''} onClick={() => setAiMode('reply')}>回复</button><button className={aiMode === 'strategy' ? 'active' : ''} onClick={() => setAiMode('strategy')}>策略</button><button className={aiMode === 'rewrite' ? 'active' : ''} onClick={() => setAiMode('rewrite')}>改写</button><button className={aiMode === 'memory' ? 'active' : ''} onClick={() => setAiMode('memory')}>记忆</button></div>
          {aiMode === 'reply' && <div className="ai-content"><div className="ai-assessment"><div><span>回复目标</span><strong>{intelligence.strategy.goal}</strong></div><div><span>安全等级</span><strong className={`risk-${intelligence.risk}`}><ShieldCheck size={13} />{intelligence.risk}风险</strong></div></div><p className="ai-strategy"><Lightbulb size={14} />{intelligence.strategy.nextAction}</p><p className="ai-guardrail">沟通边界：{intelligence.strategy.guardrail}</p>{needsEvidence && <div className="ai-evidence-gate"><span>资料不足，先核对右侧事实和建议来源，再插入 AI 草稿。</span><button onClick={showRecommendationEvidence}>查看来源</button></div>}<div className="ai-drafts">{draftOptions(active).map((option) => <article key={option.tone}><div><strong>{option.tone}</strong><p>{option.text}</p></div><button disabled={needsEvidence} onClick={() => updateDraft(option.text)}>插入</button></article>)}</div></div>}
          {aiMode === 'strategy' && <div className="ai-content strategy-card"><p className="strategy-title">{intelligence.strategy.goal}</p><div><span>下一步</span><strong>{intelligence.strategy.nextAction}</strong></div><div><span>关键意图</span><strong>{intelligence.signal}</strong></div><div><span>最佳触达</span><strong>{intelligence.bestTime}</strong></div><p className="ai-guardrail">沟通边界：{intelligence.strategy.guardrail}</p><p className="ai-warning">{tenant.dimensions.data === 'sparse' ? '资料不足，请核对事实与来源后再采用建议。' : `置信度 ${intelligence.confidence}% · ${intelligence.reason}`}</p></div>}
          {aiMode === 'rewrite' && <div className="ai-content rewrite-card"><p>当前为演示版，可插入一条符合此粉丝阶段的示例回复，再自行编辑。</p>{needsEvidence && <p className="ai-guardrail">资料不足，请先核对右侧建议来源。</p>}<button className="primary-ai-action" disabled={needsEvidence} onClick={rewriteDraft}><WandSparkles size={15} />插入阶段示例</button></div>}
          {aiMode === 'memory' && <div className="ai-content memory-card"><p>仅从已记录的信息提取候选记忆，确认后写入粉丝画像。</p>{memoryCandidates(active).map((memory) => <div className="memory-item" key={memory.text}><span>{memory.text}<small>来源：{memory.source}</small></span><button className={activeMemories.includes(memory.text) ? 'confirmed' : ''} onClick={() => confirmMemory(memory.text)}>{activeMemories.includes(memory.text) ? <><Check size={13} />已确认</> : '确认保存'}</button></div>)}</div>}
        </section>}
        <div className="composer-box"><textarea value={draft} onChange={(event) => updateDraft(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); sendMessage() } }} placeholder={`回复 ${active.name}…`} rows={1} aria-label={`回复 ${active.name}`} /><button onClick={sendMessage} className="send-button" aria-label="发送" disabled={!draft.trim()}><Send size={18} /></button></div>{preferences.chatHelp && <p className="composer-help"><span>⌘ / Ctrl + Enter 发送</span><span>草稿自动保存 · AI 内容发送前请确认</span></p>}
      </footer>
    </section>
    {showCompactInsights && <button className="compact-insights-backdrop" aria-label="关闭会话洞察" onClick={() => setShowCompactInsights(false)} />}
    <aside className={`detail-panel ${showCompactInsights ? 'mobile-open' : ''}`} aria-label="会话洞察">
      <header><h2>会话洞察</h2><div className="detail-header-actions"><button className={`tenant-switch-trigger ${showTenantDialog ? 'active' : ''}`} onClick={() => setShowTenantDialog(true)} aria-label={`切换演示租户，当前 ${tenant.name}`} aria-haspopup="dialog" aria-expanded={showTenantDialog} aria-controls="tenant-switch-dialog" title="切换演示租户，查看不同机构的工作台模式"><Building2 size={14} /><span>{tenant.name}</span><ChevronDown size={13} /></button><button className="compact-insights-close" onClick={() => setShowCompactInsights(false)} aria-label="关闭会话洞察"><X size={16} /></button></div></header>
      <div className="tenant-insight-brief"><span>{workspaceRule.insightTitle}</span><strong>{tenantInsight}</strong><div className="tenant-insight-metrics">{insightMetrics.map((metric) => <div key={metric.label}><small>{metric.label}</small><b>{metric.value}</b></div>)}</div>{tenantId === 'custom' && <div className="tenant-custom-signals"><span>{dimensionLabel('collaboration', customDimensions.collaboration)}</span><span>AI：{dimensionLabel('ai', customDimensions.ai)}</span></div>}</div>
      {tenant.dimensions.data === 'sparse' && <div className="coverage-warning"><ShieldCheck size={14} /><span>资料覆盖率 {Math.round(tenant.signals.dataCoverage * 100)}%；AI 推断请先核对来源。</span><button onClick={showRecommendationEvidence}>查看来源</button></div>}
      {tenant.dimensions.data === 'partial' && <div className="data-quality-note"><ShieldCheck size={14} /><span>资料覆盖率 {Math.round(tenant.signals.dataCoverage * 100)}%；购买与偏好线索请留意来源和更新时间。</span></div>}
      {tenant.dimensions.data === 'complete' && tenant.dimensions.scale !== 'surge' && <div className="data-quality-note complete"><ShieldCheck size={14} /><span>资料较充分，可参考已记录偏好；新推断仍需确认。</span></div>}
      {tenant.dimensions.collaboration !== 'solo' && <section className="collaboration-panel"><div><strong>{tenant.dimensions.collaboration === 'shifts' ? '轮班交接' : '小组协作'}</strong><span>{activeAssignment.handoffPending ? '待确认交接' : `负责人：${activeAssignment.owner}`}</span></div><p>{activeAssignment.event} · {action.kind === 'fulfillment' ? '付款与交付状态需一起移交。' : `最近消息：${active.preview}`}</p><div className="collaboration-actions">{activeAssignment.owner !== '我' && !activeAssignment.handoffPending && <button onClick={() => updateAssignment('我', false, '已认领当前会话')}>认领会话</button>}{tenant.dimensions.collaboration === 'shifts' && activeAssignment.handoffPending && <button onClick={() => updateAssignment('我', false, '已确认本班次接手')}>确认交接</button>}{activeAssignment.owner === '我' && !activeAssignment.handoffPending && <button onClick={() => updateAssignment('Alex', tenant.dimensions.collaboration === 'shifts', tenant.dimensions.collaboration === 'shifts' ? '已发起交接，待下一班次确认' : '已转交 Alex')}>{tenant.dimensions.collaboration === 'shifts' ? '发起交接' : '转交 Alex'}</button>}</div></section>}
      {tenant.dimensions.scale === 'surge' ? <><div className="high-volume-priority">优先展示当前行动与阻塞信息</div>{workspaceRule.detailOrder.slice(0, 2).map((section) => <Fragment key={section}>{profilePanels[section]}</Fragment>)}<details className="secondary-insights"><summary>展开消费与关系信息</summary>{workspaceRule.detailOrder.slice(2).map((section) => <Fragment key={section}>{profilePanels[section]}</Fragment>)}</details></> : workspaceRule.detailOrder.map((section) => <Fragment key={section}>{profilePanels[section]}</Fragment>)}
    </aside>
    <dialog className="tenant-dialog" id="tenant-switch-dialog" ref={tenantDialogRef} aria-labelledby="tenant-dialog-title" onClose={() => setShowTenantDialog(false)} onClick={(event) => {
      if (event.target !== tenantDialogRef.current) return
      const bounds = tenantDialogRef.current.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setShowTenantDialog(false)
    }}>
      <header className="settings-dialog-header"><div><p className="eyebrow">TENANT MODES</p><h2 id="tenant-dialog-title">选择租户模式</h2><span>切换机构特征，即时对比行动队列、聊天辅助与会话洞察。自定义租户可组合六个维度。</span></div><button onClick={() => setShowTenantDialog(false)} aria-label="关闭租户切换弹窗"><X size={18} /></button></header>
      <div className="tenant-dialog-body">
        <div className="tenant-picker">
          <div className="tenant-preset-list" role="group" aria-label="演示租户">
            {tenantProfiles.map((option) => <button key={option.id} className={`tenant-preset tenant-profile-${option.id} ${tenantId === option.id ? 'selected' : ''}`} aria-pressed={tenantId === option.id} onClick={() => changeTenant(option.id)}><strong>{option.name}</strong><span>{option.portrait.archetype}</span></button>)}
            <button className={`tenant-preset tenant-profile-custom ${tenantId === 'custom' ? 'selected' : ''}`} aria-pressed={tenantId === 'custom'} onClick={() => changeTenant('custom')}><strong>自定义租户</strong><span>自由组合六个维度</span></button>
          </div>
          <div className={`tenant-dimensions ${tenantId === 'custom' ? 'is-custom' : 'is-preset'}`}>
            <div className="tenant-dimension-heading"><strong>{tenant.name} · 六维特征</strong><span>{tenantId === 'custom' ? '可编辑 · 即时生效' : '固定预设 · 只读'}</span></div>
            {tenantDimensionDefinitions.map((dimension) => <div className="tenant-dimension-row" key={dimension.key} role="group" aria-label={dimension.label}>
              <strong>{dimension.label}</strong><div className="tenant-level-options">{dimension.options.map((option) => <button key={option.value} className={tenant.dimensions[dimension.key] === option.value ? 'selected' : ''} aria-pressed={tenant.dimensions[dimension.key] === option.value} disabled={tenantId !== 'custom'} onClick={() => updateCustomDimension(dimension.key, option.value)}>{option.label}</button>)}</div>
            </div>)}
            <p className="tenant-dimension-note">{tenantId === 'custom' ? '调整等级后，行动队列、会话排序与右侧洞察会同步更新；消息由人工确认发送。' : '这些等级是预设租户的固定特征。选择“自定义租户”可自由组合。'}</p>
          </div>
        </div>
      </div>
      <footer className="tenant-dialog-footer"><span role="status">当前：{tenant.name} · {configurationMode === 'smart' ? '智能配置' : '手动配置'}</span><div className="tenant-dialog-actions"><button className="demo-data-entry" aria-haspopup="dialog" aria-expanded={showGradingDialog} aria-controls="tenant-grading-dialog" onClick={() => setShowGradingDialog(true)}><BookOpen size={14} />分级规则</button><button className="demo-data-entry" aria-haspopup="dialog" aria-expanded={showDemoDataDialog} aria-controls="demo-data-dialog" onClick={() => { setDemoDataResult(''); setShowDemoDataDialog(true) }}>演示数据管理</button></div></footer>
    </dialog>
    <dialog className="grading-dialog" id="tenant-grading-dialog" ref={gradingDialogRef} aria-labelledby="tenant-grading-title" onClose={() => setShowGradingDialog(false)} onClick={(event) => {
      if (event.target !== gradingDialogRef.current) return
      const bounds = gradingDialogRef.current.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setShowGradingDialog(false)
    }}>
      <header className="settings-dialog-header"><div><p className="eyebrow">PRODUCT LOGIC</p><h2 id="tenant-grading-title">六维分级规则</h2><span>当前演示租户：{tenant.name}。高亮等级是它的当前特征；这些规则驱动三栏的展示与操作。</span></div><button onClick={() => setShowGradingDialog(false)} aria-label="关闭分级规则"><X size={18} /></button></header>
      <div className="grading-dialog-body">
        <div className="grading-flow"><span>识别租户特征</span><b>→</b><span>组合工作策略</span><b>→</b><span>调整用户列表、聊天、洞察</span></div>
        {tenantDimensionDefinitions.map((dimension, index) => <section className="grading-dimension" key={dimension.key} aria-label={`${dimension.label}分级规则`}>
          <div className="grading-dimension-heading"><span className="grading-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{dimension.label}</h3><p>{tenantGradingRules[dimension.key].purpose}</p></div></div>
          <div className="grading-level-grid">{dimension.options.map((option) => {
            const rule = getTenantLevelRule(dimension.key, option.value)
            const selected = tenant.dimensions[dimension.key] === option.value
            return <article className={`grading-level ${selected ? 'current' : ''}`} key={option.value}><div className="grading-level-heading"><strong>{option.label}</strong>{selected && <span>当前租户</span>}</div><small>{rule.criterion}</small><p>{rule.behavior}</p></article>
          })}</div>
        </section>)}
        <div className="grading-priority"><ShieldCheck size={18} /><div><strong>跨维度优先规则</strong><p>已付款待履约优先处理；资料不足先核对来源；AI 可以建议和排序，但消息始终由人工确认发送。</p></div></div>
      </div>
      <footer className="grading-dialog-footer"><span>演示分级阈值，可随产品验证继续校准</span><button onClick={() => setShowGradingDialog(false)}>返回租户切换</button></footer>
    </dialog>
    <dialog className="demo-data-dialog" id="demo-data-dialog" ref={demoDataDialogRef} aria-labelledby="demo-data-dialog-title" onClose={() => setShowDemoDataDialog(false)} onClick={(event) => {
      if (event.target !== demoDataDialogRef.current) return
      const bounds = demoDataDialogRef.current.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setShowDemoDataDialog(false)
    }}>
      <header className="settings-dialog-header"><div><p className="eyebrow">DEMO DATA</p><h2 id="demo-data-dialog-title">演示数据管理</h2><span>仅管理当前租户：{tenant.name}</span></div><button onClick={() => setShowDemoDataDialog(false)} aria-label="关闭演示数据管理"><X size={18} /></button></header>
      <div className="demo-data-body">
        <section className="demo-data-action"><div><span className="demo-data-scope">影响智能推荐</span><h3>清空推荐使用记录</h3><p>清除近期的队列点击、会话切换和发送记录，解除“今天忽略”的建议。</p><p className="demo-data-kept"><strong>保留</strong>聊天消息、待办、草稿和工作台配置</p></div><button onClick={() => { setActivity([]); setIgnoredMode(null); setDemoDataResult('已清空当前租户的推荐使用记录') }}>清空记录</button></section>
        <section className="demo-data-action"><div><span className="demo-data-scope">影响聊天内容</span><h3>恢复演示会话</h3><p>将消息、待办状态、草稿和新增粉丝记忆恢复到初始样例。</p><p className="demo-data-kept"><strong>保留</strong>推荐使用记录和工作台配置</p></div><button onClick={() => { resetDemoConversations(); setDemoDataResult('已恢复当前租户的演示会话') }}>恢复会话</button></section>
        {demoDataResult && <p className="demo-data-result" role="status"><Check size={15} />{demoDataResult}</p>}
      </div>
      <footer className="demo-data-footer"><button className="smart-secondary" onClick={() => setShowDemoDataDialog(false)}>返回租户选择</button></footer>
    </dialog>
    <dialog className="settings-dialog" id="workspace-settings-dialog" ref={settingsDialogRef} aria-labelledby="workspace-settings-title" onClose={() => setShowSettings(false)} onClick={(event) => {
      if (event.target !== settingsDialogRef.current) return
      const bounds = settingsDialogRef.current.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setShowSettings(false)
    }}>
      <header className="settings-dialog-header"><div><p className="eyebrow">WORKSPACE SETTINGS</p><h2 id="workspace-settings-title">工作台配置</h2><span>根据当前租户类型和近期操作推荐显示方式，也可按习惯手动调整。</span></div><button onClick={() => setShowSettings(false)} aria-label="关闭设置"><X size={18} /></button></header>
      <div className="settings-tabs" role="tablist" aria-label="配置方式">{([
        { id: 'smart', label: '智能配置' }, { id: 'manual', label: '手动微调' },
      ] as const).map((view) => <button key={view.id} id={`settings-view-${view.id}`} role="tab" aria-selected={settingsView === view.id} aria-controls="settings-view-panel" className={settingsView === view.id ? 'active' : ''} onClick={() => setSettingsView(view.id)}>{view.label}</button>)}</div>
      <div className="settings-dialog-body" id="settings-view-panel" role="tabpanel" aria-labelledby={`settings-view-${settingsView}`}>
        {settingsView === 'smart' && <div className="smart-config">
          <div className="smart-mode-card"><div className="smart-mode-icon"><Sparkles size={21} /></div><div><span>当前租户 · {tenant.name}</span><h3>{tenant.portrait.archetype}</h3><p className="smart-strategy-name">对应策略：{smartProposal.title}</p><p>{smartProposal.description}</p><small>{smartProposal.activityCount ? '已结合近 7 天操作调整队列' : '按当前租户特征生成推荐'}</small></div></div>
          <p className="smart-policy-note"><ShieldCheck size={15} />AI 只辅助整理与建议，消息发送仍需人工确认。</p>
          <section className="smart-config-section"><h3>判断依据</h3><ul>{smartProposal.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></section>
          <section className="smart-config-section"><div className="smart-section-title"><h3>三栏将如何变化</h3><span>{(configurationMode === 'manual' ? 1 : 0) + (queuesChanged ? 1 : 0) + proposedPreferenceChanges.length} 项变化</span></div>
            <div className="smart-change-list">{smartChanges.map((item) => <div key={item.section}><strong>{item.section}</strong><span>{item.changes.length ? item.changes.join('；') : '保持当前显示'}</span></div>)}</div>
            {!hasSmartChanges && <p className="smart-up-to-date">当前租户已应用推荐配置。</p>}
            {configurationMode === 'manual' && !queuesChanged && proposedPreferenceChanges.length === 0 && <p className="smart-up-to-date">显示内容已符合推荐；应用后将恢复租户智能配置。</p>}
          </section>
          {recommendationIgnored && <p className="smart-ignored">今天已暂缓这条建议。你仍可随时手动调整，或重新查看推荐。</p>}
        </div>}
        {settingsView === 'manual' && <div className="manual-config">
        <div className="manual-tabs" role="tablist" aria-label="手动配置区域">{([
          { id: 'list', label: '用户列表' }, { id: 'chat', label: '聊天区' }, { id: 'sidebar', label: '会话洞察' },
        ] as const).map((tab) => <button key={tab.id} id={`manual-tab-${tab.id}`} role="tab" aria-selected={manualTab === tab.id} aria-controls="manual-tab-panel" className={manualTab === tab.id ? 'active' : ''} onClick={() => setManualTab(tab.id)}>{tab.label}</button>)}</div>
        <div className="manual-settings-content" id="manual-tab-panel" role="tabpanel" aria-labelledby={`manual-tab-${manualTab}`}>
        {manualTab === 'list' && <>
          <section className="config-group"><div className="config-group-heading"><div><h3>行动队列</h3><p>选择要直接显示的分类</p></div><span>{visibleFilterIds.length} / 6</span></div><div className="queue-choice-grid">{inboxFilters.map((option) => {
            const checked = visibleFilterIds.includes(option.id)
            const disabled = checked ? visibleFilterIds.length === 1 : visibleFilterIds.length >= 6
            return <label key={option.id} className={`queue-choice ${checked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}><input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleVisibleFilter(option.id)} /><span>{option.label}</span><small>{queueCount(option.id)}</small></label>
          })}</div><p className="config-hint">{visibleFilterIds.length === 6 ? '已达上限，取消一项后可添加其他分类。' : '至少保留 1 个分类，最多显示 6 个。'}</p></section>
          <section className="config-group"><div className="config-group-heading"><div><h3>列表密度</h3><p>调整每条会话占用的空间</p></div></div><div className="density-options"><button className={!preferences.compactList ? 'active' : ''} aria-pressed={!preferences.compactList} onClick={() => { setPreviousConfig(null); setConfigurationMode('manual'); setPreferences((current) => ({ ...current, compactList: false })) }}>标准</button><button className={preferences.compactList ? 'active' : ''} aria-pressed={preferences.compactList} onClick={() => { setPreviousConfig(null); setConfigurationMode('manual'); setPreferences((current) => ({ ...current, compactList: true })) }}>紧凑</button></div></section>
        </>}
        {manualTab === 'sidebar' ? <>
          <section className="config-group"><div className="config-group-heading"><div><h3>决策辅助</h3><p>当前行动与判断依据</p></div></div><div className="config-options">{decisionOptions.map((option) => {
            const disabled = preferences[option.key] && visibleProfileSections === 1
            return <label key={option.key} className={`config-option ${disabled ? 'disabled' : ''}`}><div><strong>{option.label}</strong><span>{option.description}</span></div><input type="checkbox" checked={preferences[option.key]} disabled={disabled} onChange={() => togglePreference(option.key)} /></label>
          })}</div></section>
          <section className="config-group"><div className="config-group-heading"><div><h3>粉丝信息</h3><p>消费、背景与已确认的记忆</p></div></div><div className="config-options">{fanOptions.map((option) => {
            const disabled = preferences[option.key] && visibleProfileSections === 1
            return <label key={option.key} className={`config-option ${disabled ? 'disabled' : ''}`}><div><strong>{option.label}</strong><span>{option.description}</span></div><input type="checkbox" checked={preferences[option.key]} disabled={disabled} onChange={() => togglePreference(option.key)} /></label>
          })}</div><p className="config-hint">侧栏至少保留 1 项内容。</p></section>
        </> : <section className="config-group"><div className="config-group-heading"><div><h3>{manualTab === 'list' ? '会话信息' : '聊天辅助信息'}</h3><p>选择页面上要显示的内容</p></div></div><div className="config-options">{currentSettingsOptions.map((option) => <label key={option.key} className="config-option"><div><strong>{option.label}</strong><span>{option.description}</span></div><input type="checkbox" checked={preferences[option.key]} onChange={() => togglePreference(option.key)} /></label>)}</div></section>}
        </div>
        </div>}
      </div>
      <footer className="settings-dialog-footer">{settingsView === 'smart' ? <>
        <button className="settings-reset" onClick={() => setSettingsView('manual')}>手动微调</button><span>配置仅保存在本机</span>
        {previousConfig && <button className="smart-secondary" onClick={undoSmartProposal}>撤销上次应用</button>}
        {recommendationIgnored ? <button className="smart-secondary" onClick={() => setIgnoredMode(null)}>重新查看建议</button> : <><button className="smart-secondary" onClick={ignoreSmartProposal}>今天忽略</button><button className="smart-primary" disabled={!hasSmartChanges} onClick={applySmartProposal}><Sparkles size={15} />应用推荐</button></>}
      </> : <><button className="settings-reset" onClick={resetSettings}>恢复租户推荐</button><span>仅保存在当前浏览器</span><button className="settings-done" onClick={() => setShowSettings(false)}>完成</button></>}</footer>
    </dialog>
    {toast && <div className="toast"><Check size={15} />{toast}</div>}
  </main>
}

createRoot(document.getElementById('root')!).render(<App />)
