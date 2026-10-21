import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { SetStateAction } from 'react'
import { createRoot } from 'react-dom/client'
import { create } from 'zustand'
import { BookOpen, BrainCircuit, Building2, Check, ChevronDown, Clock3, FileText, Image as ImageIcon, Languages, Lightbulb, MoreHorizontal, Play, Search, Send, Settings2, ShieldCheck, Sparkles, Tag, WandSparkles, X } from 'lucide-react'
import { conversationActions, conversations, fanFacts, fanIntelligence } from './data'
import { conversationFocus, defaultPreferences, defaultVisibleFilters, inferSmartMode } from './smartConfig'
import type { ActivityEvent, DisplayPreferences, InboxFilter, SmartModeId } from './smartConfig'
import { defaultCustomDimensions, defaultTenantId, dimensionLabel, getTenantProfile, tenantDimensionDefinitions, tenantProfiles } from './tenantProfiles'
import type { TenantDimensions, TenantId } from './tenantProfiles'
import { getTenantWorkspaceRule } from './tenantWorkspaceRules'
import { getTenantLevelRule, tenantGradingRules } from './tenantGradingRules'
import type { ActionStatus, Conversation, ConversationWorkflow, Message, WorkflowEvent, WorkflowEventType } from './types'
import { resolveWorkflow } from './workflow'
import { composeWorkspace } from './workspaceEngine'
import type { Assignment } from './workspaceEngine'
import { ActionTray } from './ActionTray'
import { buildWorkPlan } from './workPlan'
import { presentConversation } from './conversationPresentation'
import { DemoTour, getDemoTourSteps } from './DemoTour'
import type { DemoTourStep } from './DemoTour'
import { initialContentRequests, initialPpvRecords, mediaAssets, ppvFollowUpLabel, ppvStatusLabel, requestStatusLabel, restoreContentRequests, restoreHandoffNotes, restorePpvRecords, restoreReminders, scriptTemplates } from './operationalDemo'
import type { ContentRequest, FollowUpReminder, HandoffNote, PpvRecord } from './operationalDemo'
import { demoTranslation, inspectOutgoing, priceGuide, summarizeConversation } from './workspaceTools'
import { resolveValidationScenario } from './validationScenarios'
import './styles.css'

type AiMode = 'reply' | 'strategy' | 'rewrite' | 'memory'
type ComposerTool = 'scripts' | 'vault' | 'reminder' | 'translate' | null
type InsightView = 'work' | 'fan'
type SettingsView = 'smart' | 'manual'
type ManualTab = 'list' | 'chat' | 'sidebar'
type ConfigurationMode = 'smart' | 'manual'
type PreferenceOption = { key: keyof DisplayPreferences; label: string; description: string }
type TourRestoreState = {
  tenantId: TenantId
  activeId: string
  openFanIds: string[]
  note: string
  filter: InboxFilter
  query: string
  showAi: boolean
  aiMode: AiMode
  showCompactInsights: boolean
  insightView: InsightView
  pendingOnly: boolean
  handoffOnly: boolean
  valueOnly: boolean
  ppvFollowupOnly: boolean
  evidenceReviewedId: string | null
}

function actionStatus(id: string, statuses: Record<string, ActionStatus>): ActionStatus {
  return statuses[id] ?? (conversationActions[id]?.kind === 'manual' ? 'done' : 'pending')
}

function isOpenTask(id: string, statuses: Record<string, ActionStatus>): boolean {
  const status = actionStatus(id, statuses)
  return status === 'pending' || (conversationActions[id]?.kind === 'fulfillment' && status === 'waiting')
}

function matchesFilter(item: Conversation, filter: InboxFilter, statuses: Record<string, ActionStatus>) {
  const status = actionStatus(item.id, statuses)
  return filter === 'all' || (filter === 'waiting'
    ? status === 'waiting' || status === 'scheduled'
    : conversationActions[item.id]?.kind === filter && isOpenTask(item.id, statuses))
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
const workflowEventsKey = 'messages-pro-workflow-events-v1'
const sessionSnapshotKey = 'messages-pro-session-v1'
const conversationSettingsKey = 'messages-pro-demo-conversations'
const memorySettingsKey = 'messages-pro-confirmed-memories'
const configurationModeKey = 'messages-pro-configuration-mode'
const customDimensionsKey = 'messages-pro-custom-tenant-dimensions'
const assignmentSettingsKey = 'messages-pro-assignments'
const reportUrl = `${import.meta.env.BASE_URL}research/value-playbook/`
const validationScenario = resolveValidationScenario(window.location.search)
const tenantKey = (key: string, tenantId: TenantId) => `${key}:${tenantId}`

function defaultAssignments(items: Conversation[], collaboration: TenantDimensions['collaboration']): Record<string, Assignment> {
  return Object.fromEntries(items.map((item, index) => [item.id, {
    owner: collaboration === 'solo' ? '我' : index % 3 === 0 ? 'Alex' : '我',
    handoffPending: collaboration === 'shifts' && (item.id === 'riley' || index % 5 === 0),
    event: collaboration === 'shifts' ? '上一班次已留下交接记录' : '会话已分配',
  }]))
}

function restoreAssignments(items: Conversation[], collaboration: TenantDimensions['collaboration'], saved: unknown): Record<string, Assignment> {
  const baseline = defaultAssignments(items, collaboration)
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return baseline
  for (const item of items) {
    const record = (saved as Record<string, unknown>)[item.id]
    if (record && typeof record === 'object' && !Array.isArray(record)) {
      const value = record as Record<string, unknown>
      if (typeof value.owner === 'string' && typeof value.handoffPending === 'boolean' && typeof value.event === 'string') baseline[item.id] = { owner: value.owner, handoffPending: value.handoffPending, event: value.event }
    }
  }
  return baseline
}

function loadAssignments(tenantId: TenantId, items: Conversation[], collaboration: TenantDimensions['collaboration']): Record<string, Assignment> {
  try { return restoreAssignments(items, collaboration, JSON.parse(localStorage.getItem(tenantKey(assignmentSettingsKey, tenantId)) ?? 'null')) }
  catch { return defaultAssignments(items, collaboration) }
}

function loadSelectedTenant(): TenantId {
  if (validationScenario) return validationScenario.tenantId
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

function restoreWorkflowEvents(saved: unknown): WorkflowEvent[] {
  if (!Array.isArray(saved)) return []
  return saved.filter((event): event is WorkflowEvent => event && typeof event === 'object'
    && typeof event.id === 'string' && event.conversationId in conversationActions
    && ['message_sent', 'review_requested', 'followup_scheduled', 'action_completed', 'delivery_confirmed', 'action_reopened', 'legacy_status'].includes(event.type)
    && typeof event.at === 'number' && Number.isFinite(event.at)
    && (event.type !== 'legacy_status' || ['pending', 'waiting', 'scheduled', 'done'].includes(event.legacyStatus)))
}

function loadWorkflowEvents(tenantId: TenantId): WorkflowEvent[] {
  try {
    const saved = localStorage.getItem(tenantKey(workflowEventsKey, tenantId))
    if (saved !== null) return restoreWorkflowEvents(JSON.parse(saved))
  } catch { /* Recover with the existing demo state. */ }
  return Object.entries(loadActionStatuses(tenantId)).map(([conversationId, legacyStatus]) => ({
    id: `migration-${conversationId}`, conversationId, type: 'legacy_status' as const, at: 0, legacyStatus,
  }))
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

function conversationLimit(scale: TenantDimensions['scale']) {
  return scale === 'surge' ? conversations.length : scale === 'steady' ? 9 : 5
}

function initialConversations(scale: TenantDimensions['scale']) {
  return conversations.slice(0, conversationLimit(scale)).map((item) => item.id === 'mason' ? { ...item, unread: 0 } : item)
}

function restoreConversationItems(baseline: Conversation[], saved: unknown): Conversation[] {
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
}

function loadConversationItems(tenantId: TenantId, customDimensions: TenantDimensions): Conversation[] {
  const baseline = initialConversations(tenantId === 'custom' ? 'surge' : getTenantProfile(tenantId, customDimensions).dimensions.scale)
  try { return restoreConversationItems(baseline, JSON.parse(tenantStorageValue(conversationSettingsKey, tenantId) ?? 'null')) }
  catch { return baseline }
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

type SessionData = {
  items: Conversation[]
  assignments: Record<string, Assignment>
  drafts: Record<string, string>
  workflowEvents: WorkflowEvent[]
  savedMemories: Record<string, string[]>
  ppvRecords: PpvRecord[]
  reminders: FollowUpReminder[]
  contentRequests: ContentRequest[]
  handoffNotes: Record<string, HandoffNote>
}
type SessionStore = SessionData & {
  tenantId: TenantId
  setItems: (next: SetStateAction<Conversation[]>) => void
  setAssignments: (next: SetStateAction<Record<string, Assignment>>) => void
  setDrafts: (next: SetStateAction<Record<string, string>>) => void
  setWorkflowEvents: (next: SetStateAction<WorkflowEvent[]>) => void
  setSavedMemories: (next: SetStateAction<Record<string, string[]>>) => void
  setPpvRecords: (next: SetStateAction<PpvRecord[]>) => void
  setReminders: (next: SetStateAction<FollowUpReminder[]>) => void
  setContentRequests: (next: SetStateAction<ContentRequest[]>) => void
  setHandoffNotes: (next: SetStateAction<Record<string, HandoffNote>>) => void
  switchTenant: (nextId: TenantId, customDimensions: TenantDimensions) => void
}

function loadSession(tenantId: TenantId, customDimensions: TenantDimensions): SessionData {
  const tenant = getTenantProfile(tenantId, customDimensions)
  const legacyItems = loadConversationItems(tenantId, customDimensions)
  const legacy: SessionData = {
    items: legacyItems,
    assignments: loadAssignments(tenantId, legacyItems, tenant.dimensions.collaboration),
    drafts: loadDrafts(tenantId), workflowEvents: loadWorkflowEvents(tenantId), savedMemories: loadMemories(tenantId),
    ppvRecords: restorePpvRecords(undefined, new Set(legacyItems.map((item) => item.id))), reminders: [],
    contentRequests: restoreContentRequests(undefined, new Set(legacyItems.map((item) => item.id))), handoffNotes: {},
  }
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(tenantKey(sessionSnapshotKey, tenantId)) ?? 'null')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return legacy
    const snapshot = saved as Record<string, unknown>
    if (snapshot.version !== 1) return legacy
    const items = restoreConversationItems(initialConversations(tenantId === 'custom' ? 'surge' : tenant.dimensions.scale), snapshot.items)
    return {
      items,
      assignments: restoreAssignments(items, tenant.dimensions.collaboration, snapshot.assignments),
      drafts: snapshot.drafts && typeof snapshot.drafts === 'object' && !Array.isArray(snapshot.drafts)
        ? Object.fromEntries(Object.entries(snapshot.drafts).filter(([id, value]) => id in conversationActions && typeof value === 'string')) as Record<string, string> : legacy.drafts,
      workflowEvents: Array.isArray(snapshot.workflowEvents) ? restoreWorkflowEvents(snapshot.workflowEvents) : legacy.workflowEvents,
      savedMemories: snapshot.savedMemories && typeof snapshot.savedMemories === 'object' && !Array.isArray(snapshot.savedMemories)
        ? Object.fromEntries(Object.entries(snapshot.savedMemories).filter(([id, values]) => id in conversationActions && Array.isArray(values)).map(([id, values]) =>
          [id, (values as unknown[]).filter((value): value is string => typeof value === 'string')])) : legacy.savedMemories,
      ppvRecords: restorePpvRecords(snapshot.ppvRecords, new Set(items.map((item) => item.id))),
      reminders: restoreReminders(snapshot.reminders, new Set(items.map((item) => item.id))),
      contentRequests: restoreContentRequests(snapshot.contentRequests, new Set(items.map((item) => item.id))),
      handoffNotes: restoreHandoffNotes(snapshot.handoffNotes, new Set(items.map((item) => item.id))),
    }
  } catch { return legacy }
}

function persistSession(state: Pick<SessionStore, 'tenantId' | keyof SessionData>) {
  localStorage.setItem(tenantKey(sessionSnapshotKey, state.tenantId), JSON.stringify({
    version: 1, items: state.items, assignments: state.assignments, drafts: state.drafts,
    workflowEvents: state.workflowEvents, savedMemories: state.savedMemories,
    ppvRecords: state.ppvRecords, reminders: state.reminders,
    contentRequests: state.contentRequests, handoffNotes: state.handoffNotes,
  }))
}

function resolveUpdate<T>(current: T, next: SetStateAction<T>): T {
  return typeof next === 'function' ? (next as (previous: T) => T)(current) : next
}

const initialSessionTenantId = loadSelectedTenant()
const useSessionStore = create<SessionStore>((set, get) => ({
  tenantId: initialSessionTenantId,
  ...loadSession(initialSessionTenantId, loadCustomDimensions()),
  setItems: (next) => set((state) => ({ items: resolveUpdate(state.items, next) })),
  setAssignments: (next) => set((state) => ({ assignments: resolveUpdate(state.assignments, next) })),
  setDrafts: (next) => set((state) => ({ drafts: resolveUpdate(state.drafts, next) })),
  setWorkflowEvents: (next) => set((state) => ({ workflowEvents: resolveUpdate(state.workflowEvents, next) })),
  setSavedMemories: (next) => set((state) => ({ savedMemories: resolveUpdate(state.savedMemories, next) })),
  setPpvRecords: (next) => set((state) => ({ ppvRecords: resolveUpdate(state.ppvRecords, next) })),
  setReminders: (next) => set((state) => ({ reminders: resolveUpdate(state.reminders, next) })),
  setContentRequests: (next) => set((state) => ({ contentRequests: resolveUpdate(state.contentRequests, next) })),
  setHandoffNotes: (next) => set((state) => ({ handoffNotes: resolveUpdate(state.handoffNotes, next) })),
  switchTenant: (nextId, customDimensions) => {
    persistSession(get())
    set({ tenantId: nextId, ...loadSession(nextId, customDimensions) })
  },
}))
useSessionStore.subscribe((state) => persistSession(state))

function loadWorkspaceConfig(tenantId: TenantId, customDimensions: TenantDimensions) {
  const mode = loadConfigurationMode(tenantId)
  if (mode === 'manual') return { mode, queues: loadVisibleFilters(tenantId), preferences: loadPreferences(tenantId) }
  const tenant = getTenantProfile(tenantId, customDimensions)
  const session = loadSession(tenantId, customDimensions)
  const visibleItems = session.items
  const statuses = Object.fromEntries(visibleItems.map((item) => [item.id, resolveWorkflow(
    conversationActions[item.id].kind, session.workflowEvents.filter((event) => event.conversationId === item.id),
  ).actionStatus])) as Record<string, ActionStatus>
  const proposal = inferSmartMode(visibleItems, loadActivity(tenantId), 'all', tenant, statuses)
  return { mode, queues: proposal.queues, preferences: { ...defaultPreferences, ...proposal.preferences } }
}

function matchesQuery(item: Conversation, query: string) {
  const term = query.trim().toLowerCase()
  return !term || [item.name, item.handle, item.preview, conversationActions[item.id]?.title ?? ''].some((value) => value.toLowerCase().includes(term))
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
  const selectedConversationRef = useRef<HTMLButtonElement>(null)
  const scoreDetailsRef = useRef<HTMLDetailsElement>(null)
  const factsSectionRef = useRef<HTMLElement>(null)
  const settingsDialogRef = useRef<HTMLDialogElement>(null)
  const tenantDialogRef = useRef<HTMLDialogElement>(null)
  const gradingDialogRef = useRef<HTMLDialogElement>(null)
  const demoDataDialogRef = useRef<HTMLDialogElement>(null)
  const tourRestoreRef = useRef<TourRestoreState | null>(null)
  const tourTriggerRef = useRef<HTMLButtonElement>(null)
  const tenantId = useSessionStore((state) => state.tenantId)
  const switchSessionTenant = useSessionStore((state) => state.switchTenant)
  const [customDimensions, setCustomDimensions] = useState<TenantDimensions>(loadCustomDimensions)
  const tenant = useMemo(() => getTenantProfile(tenantId, customDimensions), [tenantId, customDimensions])
  const workspaceRule = useMemo(() => getTenantWorkspaceRule(tenant), [tenant])
  const [initialWorkspace] = useState(() => loadWorkspaceConfig(tenantId, customDimensions))
  const [showTenantDialog, setShowTenantDialog] = useState(false)
  const [showScenarioInbox, setShowScenarioInbox] = useState(false)
  const [showGradingDialog, setShowGradingDialog] = useState(false)
  const [showDemoDataDialog, setShowDemoDataDialog] = useState(false)
  const [tourStep, setTourStep] = useState<number | null>(null)
  const [tourStartTenantId, setTourStartTenantId] = useState<TenantId>(tenantId)
  const tourSteps = useMemo(() => getDemoTourSteps(tourStartTenantId, customDimensions), [tourStartTenantId, customDimensions])
  const currentTourStep = tourStep === null ? null : tourSteps[tourStep]
  const [demoDataResult, setDemoDataResult] = useState('')
  const storedItems = useSessionStore((state) => state.items)
  const items = storedItems
  const setItems = useSessionStore((state) => state.setItems)
  const assignments = useSessionStore((state) => state.assignments)
  const setAssignments = useSessionStore((state) => state.setAssignments)
  const [handoffOnly, setHandoffOnly] = useState(false)
  const [valueOnly, setValueOnly] = useState(false)
  const [pendingOnly, setPendingOnly] = useState(() => tenant.dimensions.scale === 'surge')
  const [showCompactInsights, setShowCompactInsights] = useState(false)
  const [insightView, setInsightView] = useState<InsightView>('work')
  const [evidenceReviewedId, setEvidenceReviewedId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState(() => validationScenario?.conversationId ?? workspaceRule.landingConversationId)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<InboxFilter>('all')
  const [configurationMode, setConfigurationMode] = useState<ConfigurationMode>(initialWorkspace.mode)
  const [visibleFilterIds, setVisibleFilterIds] = useState<InboxFilter[]>(initialWorkspace.queues)
  const [preferences, setPreferences] = useState<DisplayPreferences>(initialWorkspace.preferences)
  const viewPreferences = tourStep === null ? preferences : workspaceRule.preferences
  const [activity, setActivity] = useState<ActivityEvent[]>(() => loadActivity(tenantId))
  const [ignoredMode, setIgnoredMode] = useState<IgnoredMode | null>(() => loadIgnoredMode(tenantId))
  const [previousConfig, setPreviousConfig] = useState<{ queues: InboxFilter[]; preferences: DisplayPreferences; filter: InboxFilter; mode: ConfigurationMode } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsView, setSettingsView] = useState<SettingsView>('smart')
  const [manualTab, setManualTab] = useState<ManualTab>('list')
  const drafts = useSessionStore((state) => state.drafts)
  const setDrafts = useSessionStore((state) => state.setDrafts)
  const workflowEvents = useSessionStore((state) => state.workflowEvents)
  const setWorkflowEvents = useSessionStore((state) => state.setWorkflowEvents)
  const workflows = useMemo(() => Object.fromEntries(items.map((item) => [item.id, resolveWorkflow(
    conversationActions[item.id].kind, workflowEvents.filter((event) => event.conversationId === item.id),
  )])) as Record<string, ConversationWorkflow>, [items, workflowEvents])
  const actionStatuses = useMemo(() => Object.fromEntries(Object.entries(workflows).map(([id, state]) => [id, state.actionStatus])) as Record<string, ActionStatus>, [workflows])
  const [openFanIds, setOpenFanIds] = useState(() => [validationScenario?.conversationId ?? workspaceRule.landingConversationId])
  const [note, setNote] = useState(() => conversations.find((item) => item.id === (validationScenario?.conversationId ?? workspaceRule.landingConversationId))?.note ?? conversations[0].note)
  const [showAi, setShowAi] = useState(false)
  const [composerTool, setComposerTool] = useState<ComposerTool>(null)
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
  const [ppvPrice, setPpvPrice] = useState(0)
  const [showSendReview, setShowSendReview] = useState(false)
  const [showMoreTools, setShowMoreTools] = useState(false)
  const [translationLanguage, setTranslationLanguage] = useState<'zh' | 'en'>('en')
  const [translationDraft, setTranslationDraft] = useState('')
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, boolean>>({})
  const [showChatSearch, setShowChatSearch] = useState(false)
  const [chatSearch, setChatSearch] = useState('')
  const [ppvFollowupOnly, setPpvFollowupOnly] = useState(false)
  const [requestTitle, setRequestTitle] = useState('')
  const [requestPrice, setRequestPrice] = useState(20)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [quoteRequestId, setQuoteRequestId] = useState<string | null>(null)
  const [handoffDrafts, setHandoffDrafts] = useState<Record<string, string>>({})
  const [reminderText, setReminderText] = useState('')
  const [reminderDelay, setReminderDelay] = useState(24)
  const [aiMode, setAiMode] = useState<AiMode>('reply')
  const savedMemories = useSessionStore((state) => state.savedMemories)
  const setSavedMemories = useSessionStore((state) => state.setSavedMemories)
  const ppvRecords = useSessionStore((state) => state.ppvRecords)
  const setPpvRecords = useSessionStore((state) => state.setPpvRecords)
  const reminders = useSessionStore((state) => state.reminders)
  const setReminders = useSessionStore((state) => state.setReminders)
  const contentRequests = useSessionStore((state) => state.contentRequests)
  const setContentRequests = useSessionStore((state) => state.setContentRequests)
  const handoffNotes = useSessionStore((state) => state.handoffNotes)
  const setHandoffNotes = useSessionStore((state) => state.setHandoffNotes)
  const [toast, setToast] = useState('')
  const active = items.find((item) => item.id === activeId) ?? items[0]
  const activePpvRecords = ppvRecords.filter((record) => record.conversationId === active.id)
  const activeReminders = reminders.filter((reminder) => reminder.conversationId === active.id)
  const activeRequests = contentRequests.filter((request) => request.conversationId === active.id)
  const chatMatches = chatSearch.trim() ? active.messages.filter((message) => message.text.toLowerCase().includes(chatSearch.trim().toLowerCase())) : []
  const selectedMedia = mediaAssets.find((media) => media.id === selectedMediaId)
  const composition = useMemo(() => composeWorkspace({
    tenant, conversations: items, actions: conversationActions, workflows,
    intelligence: fanIntelligence, facts: fanFacts, assignments, activity,
    reviewedEvidenceId: evidenceReviewedId,
  }), [tenant, items, workflows, assignments, activity, evidenceReviewedId])
  const intelligence = fanIntelligence[active.id]
  const action = conversationActions[active.id]
  const activeActionStatus = actionStatus(active.id, actionStatuses)
  const draft = drafts[active.id] ?? ''
  const activeMemories = savedMemories[active.id] ?? []
  const activeAssignment = assignments[active.id] ?? { owner: '我', handoffPending: false, event: '会话已分配' }
  const needsEvidence = composition.decisions[active.id].needsVerification
  const activePriceGuide = selectedMedia ? priceGuide(selectedMedia, activePpvRecords) : null
  const sendIssues = inspectOutgoing({ text: draft, media: selectedMedia, price: ppvPrice, records: activePpvRecords, unverifiedFact: fanFacts[active.id].some((fact) => fact.kind === 'inferred'), unconfirmedDelivery: action.kind === 'fulfillment' && workflows[active.id].fulfillmentStatus !== 'delivered' })
  const handoffDraftKey = `${tenantId}:${active.id}`
  const handoffText = handoffDrafts[handoffDraftKey] ?? handoffNotes[active.id]?.text ?? ''
  const followupIds = new Set(ppvRecords.filter((record) => ppvFollowUpLabel(record)).map((record) => record.conversationId))
  const handoffCount = items.filter((item) => assignments[item.id]?.handoffPending).length
  const pendingCount = items.filter((item) => isOpenTask(item.id, actionStatuses)).length
  const tenantInsight = action.kind === 'fulfillment'
    ? `${action.reason} · ${workflows[active.id].fulfillmentStatus === 'delivered' ? '交付已确认' : workflows[active.id].fulfillmentStatus === 'reviewing' ? '团队核对中' : '交付待核对'}`
    : tenant.dimensions.data === 'sparse'
    ? `${fanFacts[active.id].filter((fact) => fact.kind === 'recorded').length} 条平台记录 · 先核对建议所引资料`
    : tenant.dimensions.tasks === 'purchase'
        ? `先回应购买反馈 · ${intelligence.signal}`
        : tenant.dimensions.fans === 'high' ? active.summary
          : `${pendingCount} 项待处理 · ${intelligence.signal}`
  const viewFilterIds = tourStep === null ? visibleFilterIds : composition.queueOrder
  const visibleFilters = viewFilterIds.map((id) => inboxFilters.find((option) => option.id === id)).filter((option): option is { id: InboxFilter; label: string } => Boolean(option))
  const currentSettingsOptions = manualTab === 'list' ? listOptions : chatOptions
  const visibleProfileSections = profilePreferenceKeys.filter((key) => preferences[key]).length
  const queueCount = (id: InboxFilter) => items.filter((item) => matchesQuery(item, query) && matchesFilter(item, id, actionStatuses)).length
  const insightMetrics = tenant.dimensions.data === 'sparse'
    ? [{ label: '资料覆盖', value: `${Math.round(tenant.signals.dataCoverage * 100)}%` }, { label: '待核对线索', value: String(fanFacts[active.id].filter((fact) => fact.kind === 'inferred').length) }]
    : tenant.dimensions.tasks === 'fulfillment'
      ? [{ label: '当前付款', value: workflows[active.id].paymentStatus === 'paid' ? '已记录' : '未记录' }, { label: '交付状态', value: workflows[active.id].fulfillmentStatus === 'delivered' ? '已确认' : workflows[active.id].fulfillmentStatus === 'reviewing' ? '核对中' : '待核对' }]
      : tenant.dimensions.tasks === 'purchase'
        ? [{ label: 'PPV 状态', value: activePpvRecords[0] ? ppvStatusLabel(activePpvRecords[0].status) : '暂无记录' }, { label: '当前消费', value: active.spend }]
        : [{ label: '当前消费', value: active.spend }, { label: '已确认记忆', value: String(activeMemories.length) }]
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
  const scopedConversations = useMemo(() => [...items]
    .filter((item) => matchesFilter(item, filter, actionStatuses) && matchesQuery(item, query)
      && (!handoffOnly || assignments[item.id]?.handoffPending) && (!valueOnly || isHighValue(item))
      && (!ppvFollowupOnly || followupIds.has(item.id)))
    .sort((a, b) => composition.decisions[b.id].priority - composition.decisions[a.id].priority || a.id.localeCompare(b.id)), [filter, items, query, actionStatuses, assignments, handoffOnly, valueOnly, ppvFollowupOnly, ppvRecords, composition])
  const scopedPendingCount = scopedConversations.filter((item) => isOpenTask(item.id, actionStatuses) || assignments[item.id]?.handoffPending).length
  const visibleConversations = tenant.dimensions.scale !== 'low' && filter === 'all' && pendingOnly && !ppvFollowupOnly
    ? scopedConversations.filter((item) => isOpenTask(item.id, actionStatuses) || assignments[item.id]?.handoffPending)
    : scopedConversations
  const hasNextPending = visibleConversations.some((item) => item.id !== active.id && (isOpenTask(item.id, actionStatuses) || assignments[item.id]?.handoffPending))
  const recommendedNext = tenant.dimensions.ai === 'triage'
    ? visibleConversations.find((item) => item.id !== active.id && (isOpenTask(item.id, actionStatuses) || assignments[item.id]?.handoffPending))
    : undefined

  useEffect(() => {
    if (configurationMode !== 'smart') return
    setVisibleFilterIds((current) => current.join(',') === smartProposal.queues.join(',') ? current : smartProposal.queues)
    setPreferences((current) => {
      const next = { ...defaultPreferences, ...smartProposal.preferences }
      return (Object.keys(next) as Array<keyof DisplayPreferences>).every((key) => current[key] === next[key]) ? current : next
    })
  }, [configurationMode, smartProposal])

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
    if (!viewPreferences.chatCopilot) setShowAi(false)
  }, [viewPreferences.chatCopilot])

  useLayoutEffect(() => {
    const area = messageAreaRef.current
    if (area) area.scrollTop = area.scrollHeight
  }, [active.id, active.messages.length, showAi])

  useLayoutEffect(() => {
    selectedConversationRef.current?.scrollIntoView({ block: 'nearest' })
  }, [active.id, tenantId, filter, pendingOnly, handoffOnly])

  useLayoutEffect(() => {
    if (tourStep === null) return
    const frame = requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-tour-highlight="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
    return () => cancelAnimationFrame(frame)
  }, [tourStep, tenantId, active.id, showAi])

  useEffect(() => {
    if (tourStep === null) return
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); finishDemoTour() }
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [tourStep, tenantId])

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

  function recordWorkflowEvent(type: WorkflowEventType) {
    setWorkflowEvents((current) => [...current, {
      id: crypto.randomUUID(), conversationId: active.id, type, at: Date.now(),
    }])
  }

  function changeTenant(nextId: TenantId) {
    if (nextId === tenantId) return
    localStorage.setItem(tenantKey(queueSettingsKey, tenantId), JSON.stringify(visibleFilterIds))
    localStorage.setItem(tenantKey(displaySettingsKey, tenantId), JSON.stringify(preferences))
    localStorage.setItem(tenantKey(configurationModeKey, tenantId), configurationMode)
    localStorage.setItem(tenantKey(activitySettingsKey, tenantId), JSON.stringify(activity))
    if (ignoredMode) localStorage.setItem(tenantKey(ignoredModeKey, tenantId), JSON.stringify(ignoredMode))
    else localStorage.removeItem(tenantKey(ignoredModeKey, tenantId))
    const nextWorkspace = loadWorkspaceConfig(nextId, customDimensions)
    switchSessionTenant(nextId, customDimensions)
    setConfigurationMode(nextWorkspace.mode)
    setVisibleFilterIds(nextWorkspace.queues)
    setPreferences(nextWorkspace.preferences)
    setActivity(loadActivity(nextId))
    setIgnoredMode(loadIgnoredMode(nextId))
    setHandoffOnly(false)
    setValueOnly(false)
    setPendingOnly(getTenantProfile(nextId, customDimensions).dimensions.scale === 'surge')
    setShowCompactInsights(false)
    setInsightView('work')
    setEvidenceReviewedId(null)
    const landingId = getTenantWorkspaceRule(getTenantProfile(nextId, customDimensions)).landingConversationId
    setActiveId(landingId)
    setOpenFanIds([landingId])
    setNote(conversations.find((item) => item.id === landingId)?.note ?? conversations[0].note)
    setFilter('all')
    setQuery('')
    setShowAi(false)
    setPreviousConfig(null)
    setComposerTool(null)
    setSelectedMediaId(null)
    setShowSendReview(false)
    setQuoteRequestId(null)
    setPpvFollowupOnly(false)
    setChatSearch('')
    setShowRequestForm(false)
  }

  function applyDemoTourStep(step: DemoTourStep) {
    if (step.tenantId !== tenantId) changeTenant(step.tenantId)
    setComposerTool(null)
    setSelectedMediaId(null)
    setShowSendReview(false)
    setQuoteRequestId(null)
    setPpvFollowupOnly(false)
    setChatSearch('')
    setActiveId(step.conversationId)
    setOpenFanIds([step.conversationId])
    setNote(conversations.find((item) => item.id === step.conversationId)?.note ?? conversations[0].note)
    setFilter('all')
    setQuery('')
    setHandoffOnly(false)
    setValueOnly(false)
    setPendingOnly(getTenantProfile(step.tenantId, customDimensions).dimensions.scale === 'surge')
    setEvidenceReviewedId(null)
    setShowAi(Boolean(step.showAi))
    setAiMode('reply')
    setShowCompactInsights(window.innerWidth <= 1000 && ['memory', 'purchase', 'collaboration', 'coverage', 'insight'].includes(step.highlight))
    setInsightView(step.highlight === 'memory' ? 'fan' : 'work')
  }

  function startDemoTour() {
    if (tourStep !== null) return
    tourRestoreRef.current = { tenantId, activeId, openFanIds, note, filter, query, showAi, aiMode,
      showCompactInsights, insightView, pendingOnly, handoffOnly, valueOnly, ppvFollowupOnly, evidenceReviewedId }
    setShowTenantDialog(false)
    setShowSettings(false)
    setTourStartTenantId(tenantId)
    applyDemoTourStep(getDemoTourSteps(tenantId, customDimensions)[0])
    setTourStep(0)
  }

  function finishDemoTour() {
    const previous = tourRestoreRef.current
    tourRestoreRef.current = null
    setTourStep(null)
    if (!previous) return
    if (previous.tenantId !== tenantId) changeTenant(previous.tenantId)
    setActiveId(previous.activeId)
    setOpenFanIds(previous.openFanIds)
    setNote(previous.note)
    setFilter(previous.filter)
    setQuery(previous.query)
    setShowAi(previous.showAi)
    setAiMode(previous.aiMode)
    setShowCompactInsights(previous.showCompactInsights)
    setInsightView(previous.insightView)
    setPendingOnly(previous.pendingOnly)
    setHandoffOnly(previous.handoffOnly)
    setValueOnly(previous.valueOnly)
    setPpvFollowupOnly(previous.ppvFollowupOnly)
    setEvidenceReviewedId(previous.evidenceReviewedId)
    requestAnimationFrame(() => tourTriggerRef.current?.focus())
  }

  function moveDemoTour(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= tourSteps.length) return
    applyDemoTourStep(tourSteps[nextIndex])
    setTourStep(nextIndex)
  }

  function updateCustomDimension<K extends keyof TenantDimensions>(key: K, value: TenantDimensions[K]) {
    if (customDimensions[key] === value) return
    const next = { ...customDimensions, [key]: value }
    setCustomDimensions(next)
    if (tenantId === 'custom') {
      if (key === 'scale' && next.scale === 'low') setPendingOnly(false)
      if (key === 'fans' && next.fans === 'low') setValueOnly(false)
      if (key === 'collaboration' && next.collaboration === 'solo') setHandoffOnly(false)
      if (key === 'data') setEvidenceReviewedId(null)
      const proposal = inferSmartMode(storedItems, activity, filter, getTenantProfile('custom', next), actionStatuses)
      setConfigurationMode('smart')
      setVisibleFilterIds(proposal.queues)
      setPreferences({ ...defaultPreferences, ...proposal.preferences })
      setPreviousConfig(null)
    }
  }

  function selectConversation(id: string) {
    setShowScenarioInbox(false)
    const next = items.find((item) => item.id === id)
    if (!next) return
    if (id !== activeId) recordActivity('conversation', conversationFocus(id))
    setActiveId(id)
    setOpenFanIds((current) => current.includes(id) ? current : [...current, id])
    setNote(next.note)
    setShowAi(false)
    setComposerTool(null)
    setSelectedMediaId(null)
    setShowSendReview(false)
    setQuoteRequestId(null)
    setChatSearch('')
    setShowRequestForm(false)
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
        setComposerTool(null)
        setSelectedMediaId(null)
        setShowSendReview(false)
        setQuoteRequestId(null)
        setItems((current) => current.map((item) => item.id === nextId ? { ...item, unread: 0 } : item))
      }
    }
  }

  function updateDraft(value: string) {
    setDrafts((current) => ({ ...current, [active.id]: value }))
  }

  function setInboxFilter(next: InboxFilter) {
    setFilter(next)
    setPpvFollowupOnly(false)
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
    const resetItems = initialConversations(tenantId === 'custom' ? 'surge' : tenant.dimensions.scale)
    setItems(resetItems)
    setAssignments(defaultAssignments(resetItems, tenant.dimensions.collaboration))
    setHandoffOnly(false)
    setEvidenceReviewedId(null)
    setWorkflowEvents([])
    setDrafts({})
    setActiveId(workspaceRule.landingConversationId)
    setOpenFanIds([workspaceRule.landingConversationId])
    setNote(conversations.find((item) => item.id === workspaceRule.landingConversationId)?.note ?? conversations[0].note)
    setSavedMemories({})
    setPpvRecords(initialPpvRecords().filter((record) => resetItems.some((item) => item.id === record.conversationId)))
    setReminders([])
    setContentRequests(initialContentRequests().filter((request) => resetItems.some((item) => item.id === request.conversationId)))
    setHandoffNotes({})
    setHandoffDrafts({})
    setComposerTool(null)
    setSelectedMediaId(null)
    setShowSendReview(false)
    setQuoteRequestId(null)
    setPpvFollowupOnly(false)
    setFilter('all')
    setShowAi(false)
  }

  function showRecommendationEvidence() {
    const target: InsightView = tenant.dimensions.data === 'sparse' ? 'fan' : 'work'
    setInsightView(target)
    if (window.innerWidth <= 1000) setShowCompactInsights(true)
    requestAnimationFrame(() => {
      if (target === 'work' && scoreDetailsRef.current) {
        scoreDetailsRef.current.open = true
        scoreDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      } else if (factsSectionRef.current) factsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  function commitMessage() {
    if (!draft.trim() && !selectedMedia) return
    const ppvId = selectedMedia ? crypto.randomUUID() : undefined
    const text = draft.trim() || selectedMedia?.title || ''
    const message: Message = { id: crypto.randomUUID(), text, sentAt: '现在', direction: 'outbound', status: 'sent', ...(ppvId ? { ppvId } : {}) }
    if (selectedMedia && ppvId) {
      setPpvRecords((current) => [{ id: ppvId, conversationId: active.id, mediaId: selectedMedia.id, caption: text, price: ppvPrice, status: 'sent', sentAt: '刚刚', source: 'demo' }, ...current])
      setSelectedMediaId(null)
      setComposerTool(null)
    }
    if (quoteRequestId) {
      setContentRequests((current) => current.map((request) => request.id === quoteRequestId && request.conversationId === active.id ? { ...request, status: 'quoted', updatedAt: '刚刚' } : request))
      setQuoteRequestId(null)
    }
    setItems((current) => current.map((item) => item.id === active.id ? { ...item, messages: [...item.messages, message], preview: message.text, updatedAt: '刚刚' } : item))
    recordWorkflowEvent('message_sent')
    recordActivity('sent', conversationFocus(active.id))
    updateDraft('')
    setShowSendReview(false)
    notify(ppvId ? '演示 PPV 已发送，可在粉丝资料中模拟查看或购买' : action.kind === 'fulfillment' ? '消息已发送 · 付款请求仍待确认交付' : `消息已发送 · ${action.afterSend}`)
  }

  function sendMessage() {
    if (!draft.trim() && !selectedMedia) return
    if (sendIssues.length) { setComposerTool(null); setShowMoreTools(false); setShowSendReview(true); return }
    commitMessage()
  }

  function createContentRequest() {
    const title = requestTitle.trim()
    if (!title) return
    setContentRequests((current) => [{ id: crypto.randomUUID(), conversationId: active.id, title, price: requestPrice, status: 'new', owner: activeAssignment.owner, updatedAt: '刚刚', source: 'demo' }, ...current])
    setRequestTitle('')
    notify('已登记内容请求，下一步可准备报价')
  }

  function prepareQuote(request: ContentRequest) {
    if (request.price === null) return
    setQuoteRequestId(request.id)
    updateDraft(`关于${request.title}，报价是 $${request.price}。如果你确认，我再安排下一步。`)
    setShowCompactInsights(false)
    notify('报价已写入草稿；发送后才会记录为已报价')
  }

  function saveHandoff() {
    if (!handoffText.trim()) return
    setHandoffNotes((current) => ({ ...current, [active.id]: { text: handoffText.trim(), savedAt: Date.now() } }))
    notify('会话摘要已保存到当前租户')
  }

  function prepareTranslation() {
    setComposerTool('translate')
    setShowMoreTools(false)
    setTranslationDraft(demoTranslation(draft, translationLanguage) ?? '')
  }

  function chooseMedia(id: string) {
    const media = mediaAssets.find((asset) => asset.id === id)
    if (!media) return
    setSelectedMediaId(id)
    setPpvPrice(media.suggestedPrice)
  }

  function scheduleReminder() {
    const text = reminderText.trim()
    if (!text) return
    setReminders((current) => [{ id: crypto.randomUUID(), conversationId: active.id, text, dueAt: Date.now() + reminderDelay * 60 * 60 * 1000, status: 'scheduled' }, ...current])
    setReminderText('')
    setComposerTool(null)
    notify('已加入当前粉丝的跟进提醒')
  }

  function rewriteDraft() {
    const options = draftOptions(active)
    const example = options.find((option) => !needsEvidence || !option.requiresVerification)
    if (example) updateDraft(example.text)
  }

  function confirmMemory(memory: string) {
    if (activeMemories.includes(memory)) return
    setSavedMemories((current) => ({ ...current, [active.id]: [...(current[active.id] ?? []), memory] }))
    notify('已写入粉丝记忆')
  }

  function createSmartTask() {
    if (!intelligence.strategy.taskAction || activeActionStatus === 'scheduled') return
    recordWorkflowEvent(action.kind === 'fulfillment' ? 'review_requested' : 'followup_scheduled')
    notify(action.kind === 'fulfillment' ? '已请求团队核对 · 交付前仍需确认' : `已安排：${intelligence.strategy.taskAction}`)
  }

  function completeAction() {
    recordWorkflowEvent(action.kind === 'fulfillment' ? 'delivery_confirmed' : 'action_completed')
    notify(action.kind === 'fulfillment' ? '已确认交付完成' : '已完成当前行动')
  }

  function updateAssignment(owner: string, handoffPending: boolean, event: string) {
    setAssignments((current) => ({ ...current, [active.id]: { owner, handoffPending, event } }))
    notify(event)
  }

  function openNextPending() {
    const next = visibleConversations.find((item) => item.id !== active.id && (isOpenTask(item.id, actionStatuses) || assignments[item.id]?.handoffPending))
    if (next) selectConversation(next.id)
    else notify('当前筛选中没有下一条待处理会话')
  }

  function reopenAction() {
    recordWorkflowEvent('action_reopened')
    notify('已恢复待办行动')
  }

  const profilePanels = {
    recommendation: viewPreferences.profileRecommendation ? <section className="detail-section priority-section">
      <div className="section-title"><h3><Sparkles size={17} />当前行动</h3><span className={`task-status ${activeActionStatus}`}>{activeActionStatus === 'pending' ? '待处理' : activeActionStatus === 'waiting' ? action.kind === 'fulfillment' ? '团队核对中' : '等待回复' : activeActionStatus === 'scheduled' ? '已安排' : '已完成'}</span></div>
      <p className="priority-context">{action.reason}</p>
      {(workflows[active.id].paymentStatus === 'paid' || workflows[active.id].lastOutboundAt !== null) && <div className="workflow-facts" aria-label="当前业务状态">
        {workflows[active.id].paymentStatus === 'paid' && <span>付款：已记录</span>}
        {activePpvRecords[0] && <span>PPV：{ppvStatusLabel(activePpvRecords[0].status)}</span>}
        {workflows[active.id].lastOutboundAt !== null && <span>回复：已发送</span>}
        {action.kind === 'fulfillment' && <span className={workflows[active.id].fulfillmentStatus === 'delivered' ? 'complete' : 'open'}>交付：{workflows[active.id].fulfillmentStatus === 'delivered' ? '已确认' : workflows[active.id].fulfillmentStatus === 'reviewing' ? '团队核对中' : '待核对'}</span>}
      </div>}
      <h4>{activeActionStatus === 'pending' ? action.title : activeActionStatus === 'waiting' ? action.afterSend : activeActionStatus === 'scheduled' ? '按计划跟进' : action.kind === 'fulfillment' ? '交付已确认' : '当前无需主动处理'}</h4>
      <p className="priority-next">{activeActionStatus === 'pending' ? intelligence.strategy.nextAction : activeActionStatus === 'waiting' ? action.kind === 'fulfillment' ? '收到团队确认后，再向粉丝给出准确交付时间；完成交付后手动确认。' : '新消息到来后可恢复处理；也可以手动恢复待办。' : activeActionStatus === 'scheduled' ? '跟进已记录，届时核对最新对话再处理。' : '等待下一次消息或新的业务事件。'}</p>
      <div className="action-meta"><span>处理时间</span><strong>{activeActionStatus === 'pending' ? action.due : activeActionStatus === 'waiting' ? action.kind === 'fulfillment' ? '等待团队确认' : '等待粉丝' : activeActionStatus === 'scheduled' ? '已安排' : '暂无'}</strong></div>
      <div className="task-controls">{activeActionStatus === 'pending' && intelligence.strategy.taskAction && <button className="priority-action" onClick={createSmartTask}>{action.kind === 'fulfillment' ? '请求团队核对' : intelligence.strategy.taskAction}</button>}{activeActionStatus === 'pending' ? action.kind !== 'fulfillment' && <button className="task-secondary" onClick={completeAction}>标记完成</button> : <>{!(action.kind === 'fulfillment' && activeActionStatus === 'done') && <button className="task-secondary" onClick={reopenAction}>恢复待办</button>}{activeActionStatus !== 'done' && <button className="task-secondary" onClick={completeAction}>{action.kind === 'fulfillment' ? '确认已交付' : '标记完成'}</button>}</>}</div>
      {activeActionStatus !== 'done' && <p className="strategy-boundary">沟通边界：{intelligence.strategy.guardrail}</p>}
      <details className="score-details" ref={scoreDetailsRef}><summary>查看建议依据与来源 <span>样例数据</span></summary><p className="score-explanation">{intelligence.reason}</p>{intelligence.scoreBreakdown.map((factor) => <div className="score-factor" key={factor.label}><div className="factor-line"><span>{factor.label}</span></div><small>{factor.source} · {factor.updatedAt}</small></div>)}<p className="data-updated">更新：{intelligence.updatedAt}</p></details>
    </section> : null,
    metrics: viewPreferences.profileMetrics ? <div className="fan-summary"><span>{active.name} · {active.handle} <small>演示资料</small></span><strong>累计消费 {active.spend}</strong></div> : null,
    facts: viewPreferences.profileKnown ? <section className="detail-section facts-section" ref={factsSectionRef}><div className="section-title"><h3><Tag size={17} />关键事实与线索</h3>{tenant.dimensions.data === 'sparse' && (needsEvidence || evidenceReviewedId === active.id) && <button className="source-confirm" onClick={() => { setEvidenceReviewedId(active.id); notify('已核对当前会话来源') }}>{evidenceReviewedId === active.id ? '已核对' : '确认已核对'}</button>}</div>{tenant.dimensions.data === 'sparse' && <p className="source-caution">资料较少，优先依据平台和团队记录；未确认偏好不能当成事实。</p>}{fanFacts[active.id].map((fact) => {
      const deliveryFact = action.kind === 'fulfillment' && fact.label === '交付安排'
      const state = workflows[active.id].fulfillmentStatus
      return <div className="fact-row" key={fact.label}><div><strong>{fact.label}</strong><span className={`fact-kind ${fact.kind}`}>{fact.kind === 'recorded' ? '平台记录' : fact.kind === 'team' ? '团队记录' : 'AI 推断'}</span></div><p>{deliveryFact ? state === 'delivered' ? '已由操作员确认交付' : state === 'reviewing' ? '团队核对中，交付时间未确认' : fact.value : fact.value}</p><small>{deliveryFact && state !== 'awaiting-review' ? '本次演示操作 · 刚刚' : `${fact.source} · ${fact.updatedAt}`}</small></div>
    })}</section> : null,
    memory: viewPreferences.profileMemory ? <section className="detail-section" data-tour-highlight={currentTourStep?.highlight === 'memory'}><div className="section-title"><h3><BrainCircuit size={17} />团队记录</h3><span className="memory-count">新增确认 {activeMemories.length}</span></div><p className="record-label">团队备注</p><p className="profile-note">{action.kind === 'fulfillment' && workflows[active.id].fulfillmentStatus === 'delivered' ? '已确认交付。原备注记录的是交付前的待核对情况。' : note}</p>{activeMemories.map((memory) => <p className="confirmed-memory" key={memory}><Check size={13} />{memory}<small>已由操作员确认</small></p>)}</section> : null,
  }

  return <div className={validationScenario ? 'validation-workspace' : undefined}>{validationScenario && <aside className="validation-context"><div><strong>场景验证 · {validationScenario.title}</strong><span>{validationScenario.goal} 当前使用本地模拟数据，并保留已有进度。</span><button className="validation-inbox-toggle" aria-expanded={showScenarioInbox} aria-controls="validation-conversations" onClick={() => setShowScenarioInbox((current) => !current)}>{showScenarioInbox ? '返回当前会话' : '切换到会话列表'}</button></div><a href={reportUrl}>查看价值分析报告 →</a></aside>}<main className={`${validationScenario ? 'with-validation-context' : ''} ${showScenarioInbox ? 'validation-show-inbox' : ''} app-shell workspace-${tenantId} ${tourStep !== null ? 'demo-tour-active' : ''}`}>
    <aside id="validation-conversations" className={`inbox-panel ${viewPreferences.compactList ? 'compact-list' : ''}`} aria-label="用户列表">
      <header className="inbox-header"><div className="brand-mark" aria-label="Messages Pro">M</div><div className="search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索用户或对话" aria-label="搜索用户或对话" />{query && <button onClick={() => setQuery('')} aria-label="清除搜索"><X size={15} /></button>}</div></header>
      <div className="inbox-controls">
        <div className="queue-heading"><strong>行动分类</strong><span>按当前任务筛选</span></div>
        <div className="queue-grid" role="group" aria-label="行动队列" data-tour-highlight={currentTourStep?.highlight === 'queue'}>{visibleFilters.map((option) => <button key={option.id} className={`queue-button ${filter === option.id && !ppvFollowupOnly ? 'active' : ''}`} aria-pressed={filter === option.id && !ppvFollowupOnly} onClick={() => setInboxFilter(option.id)}><span>{option.label}</span><b>{queueCount(option.id)}</b></button>)}</div>
        <button className={`ppv-followup-filter ${ppvFollowupOnly ? 'active' : ''}`} aria-pressed={ppvFollowupOnly} onClick={() => { setPpvFollowupOnly((current) => !current); setFilter('all'); setPendingOnly(false); setHandoffOnly(false); setValueOnly(false); setQuery('') }}><span>PPV 待跟进</span><b>{followupIds.size}</b><small>已查看未购买 · 已购买待回应</small></button>
        <div className="list-toolbar"><strong>会话列表</strong><span>{visibleConversations.length} 位 · 按{workspaceRule.sortLabel}排序</span></div>
        {(tenant.dimensions.scale !== 'low' || tenant.dimensions.fans !== 'low' || tenant.dimensions.collaboration === 'shifts' || tenant.dimensions.ai === 'triage') && <div className={`load-action-bar ${tenant.dimensions.scale}`} data-tour-highlight={currentTourStep?.highlight === 'load'} data-recommended-next={recommendedNext?.name ?? ''}>
          <div className="processing-context"><strong>{pendingOnly && filter === 'all' && tenant.dimensions.scale !== 'low' ? '待处理会话' : '当前处理视图'}</strong><span>{scopedPendingCount} 项待处理 · 共 {scopedConversations.length} 位{recommendedNext ? ' · 列表中已标出建议下一条' : ''}</span></div>
          <div className="load-actions">{tenant.dimensions.scale !== 'low' && filter === 'all' && <button className={pendingOnly ? 'active' : ''} onClick={() => setPendingOnly((value) => !value)}>{pendingOnly ? '查看全部' : '只看待处理'}</button>}{tenant.dimensions.fans !== 'low' && <button className={valueOnly ? 'active' : ''} onClick={() => setValueOnly((value) => !value)}>{valueOnly ? '查看全部粉丝' : '重点粉丝'}</button>}{tenant.dimensions.collaboration === 'shifts' && <button className={handoffOnly ? 'active' : ''} onClick={() => setHandoffOnly((value) => !value)}>{handoffOnly ? '全部交接' : `待交接 ${handoffCount}`}</button>}{tenant.dimensions.scale !== 'low' || tenant.dimensions.ai === 'triage' ? <button className="next-conversation" onClick={openNextPending} disabled={!hasNextPending}>下一条</button> : null}</div>
        </div>}</div>
      {!visibleConversations.some((item) => item.id === active.id) && <div className="filtered-active"><span>当前聊天 {active.name} 不在筛选结果中</span><button onClick={() => { setQuery(''); setFilter('all'); setPendingOnly(false); setHandoffOnly(false); setValueOnly(false); setPpvFollowupOnly(false) }}>显示会话</button></div>}
      <div className="conversation-list">{visibleConversations.length ? visibleConversations.map((item) => {
        const itemAction = conversationActions[item.id]
        const itemStatus = actionStatus(item.id, actionStatuses)
        const row = presentConversation({ tenant, item, action: itemAction, workflow: workflows[item.id], facts: fanFacts[item.id], assignment: assignments[item.id], decision: composition.decisions[item.id], recommended: recommendedNext?.id === item.id })
        const latestDemoPpv = ppvRecords.find((record) => record.conversationId === item.id && record.source === 'demo')
        const followUpPpv = ppvRecords.find((record) => record.conversationId === item.id && ppvFollowUpLabel(record))
        return <button ref={item.id === active.id ? selectedConversationRef : undefined} className={`conversation row-${row.emphasis} ${row.recommended ? 'recommended' : ''} ${item.id === active.id ? 'selected' : ''}`} data-tour-highlight={currentTourStep?.highlight === 'list' && item.id === active.id} onClick={() => selectConversation(item.id)} key={item.id}>
          <div className="avatar">{item.avatar}{item.online && <i />}</div><div className="conversation-copy"><div className="conversation-title"><strong>{item.name}</strong><span className="conversation-title-side">{item.unread > 0 && <b className="unread-count" aria-label={`${item.unread} 条未读`}>{item.unread}</b>}<time>{item.updatedAt}</time></span></div>{viewPreferences.listPreview && <p>{item.preview}</p>}{viewPreferences.listPriority && <><div className="conversation-meta"><span title={composition.decisions[item.id].reasons.join(' · ')}>{row.headline}</span><em className={`action-state ${itemStatus}`}>{composition.decisions[item.id].statusLabel}</em></div><div className="conversation-context" title={row.context}>{row.context}</div></>}{(row.badges.length > 0 || latestDemoPpv || followUpPpv || viewPreferences.listSla && row.urgency) && <div className="conversation-foot">{row.badges.length > 0 && <div className="conversation-signals">{row.badges.map((badge) => <span key={badge}>{badge}</span>)}</div>}{followUpPpv && <span className="ppv-followup-signal">{ppvFollowUpLabel(followUpPpv)}</span>}{!followUpPpv && latestDemoPpv && <span className="demo-ppv-signal">PPV {ppvStatusLabel(latestDemoPpv.status)}</span>}{viewPreferences.listSla && row.urgency && <small className="sla-hint">{row.urgency}</small>}</div>}</div>
        </button>
      }) : <div className="empty-list"><Search size={18} /><strong>{valueOnly ? '当前没有符合条件的重点粉丝' : pendingOnly && filter === 'all' ? '当前没有待处理会话' : '没有匹配的用户'}</strong><span>{valueOnly || pendingOnly ? '可切换处理视图浏览其他会话' : '尝试调整搜索或筛选条件'}</span></div>}</div>
      <div className="inbox-settings">
        <div className="user-settings-entry">
          <button className={`${showSettings ? 'active' : ''} ${hasSmartChanges && !recommendationIgnored ? 'has-suggestion' : ''}`} onClick={() => { setSettingsView('smart'); setShowSettings(true) }} aria-label={hasSmartChanges && !recommendationIgnored ? '工作台设置，有智能建议' : '工作台设置'} aria-haspopup="dialog" aria-expanded={showSettings} aria-controls="workspace-settings-dialog" title="配置当前租户的工作台"><Settings2 size={16} /><span><strong>工作台设置</strong><small>调整当前租户的显示方式</small></span></button>
        </div>
      </div>
    </aside>
    <section className="chat-panel" aria-label="聊天模块">
      <header className="chat-header"><div className="chat-identity"><div className="avatar large">{active.avatar}{active.online && <i />}</div><div><h2>{active.name}</h2><p>{active.handle}{tenant.dimensions.collaboration !== 'solo' && ` · ${activeAssignment.owner}负责`}</p></div></div><div className="chat-header-meta"><button className="chat-search-trigger" onClick={() => setShowChatSearch((current) => !current)} aria-label="搜索当前会话" aria-expanded={showChatSearch} title="搜索当前会话消息"><Search size={15} /></button><button ref={tourTriggerRef} className="demo-tour-trigger" onClick={startDemoTour} aria-label="一键演示" title={`从 ${tenant.name} 开始查看各租户的工作台差异`}><Play size={14} fill="currentColor" /><span>一键演示</span></button><a className="report-link chat-report-trigger" href={reportUrl} target="_blank" rel="noopener noreferrer" aria-label="在新窗口打开价值分析报告" title="在新窗口打开价值分析报告"><FileText size={14} /><span>分析报告</span></a><button className="compact-tenant-trigger" onClick={() => setShowTenantDialog(true)} aria-label={`切换演示租户，当前 ${tenant.name}`} aria-haspopup="dialog" aria-expanded={showTenantDialog} aria-controls="tenant-switch-dialog" title={`切换演示租户 · ${tenant.name}`}><Building2 size={14} /><span>{tenant.name}</span></button><button className="compact-insights-trigger" onClick={() => setShowCompactInsights(true)}>会话洞察</button><span className="workspace-mode-badge">{workspaceRule.workStyle}</span><span className="header-presence">{active.online ? '在线' : '离线'}</span></div></header>
      {showChatSearch && <div className="chat-search-bar" role="search"><Search size={14} /><input aria-label="搜索本次聊天内容" value={chatSearch} onChange={(event) => setChatSearch(event.target.value)} placeholder="搜索当前聊天消息" /><span>{chatSearch.trim() ? `${chatMatches.length} 条结果` : '输入关键词'}</span>{chatMatches.map((message) => <button key={message.id} onClick={() => document.querySelector(`[data-message-id="${CSS.escape(message.id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })} title={message.text}>{message.text.slice(0, 14)}</button>)}<button onClick={() => { setShowChatSearch(false); setChatSearch('') }} aria-label="关闭会话搜索"><X size={14} /></button></div>}
      {openFanIds.length > 1 && <div className="fan-tabs" role="tablist" aria-label="已打开的粉丝会话">{openFanIds.map((fanId) => {
        const fan = items.find((item) => item.id === fanId)
        if (!fan) return null
        return <div className={`fan-tab ${fanId === active.id ? 'active' : ''}`} key={fanId}><button role="tab" aria-selected={fanId === active.id} onClick={() => selectConversation(fanId)}><span className="tab-presence" data-online={fan.online} />{fan.name}{drafts[fanId]?.trim() && <i className="draft-indicator" title="有未发送草稿" />}</button><button className="close-tab" aria-label={`关闭 ${fan.name} 会话`} onClick={() => closeFanTab(fanId)}><X size={12} /></button></div>
      })}</div>}
      <div className="message-area" ref={messageAreaRef}><div className="message-thread"><div className="date-pill">今天</div>{active.messages.map((message) => {
        const record = message.ppvId ? ppvRecords.find((item) => item.id === message.ppvId) : undefined
        const media = record ? mediaAssets.find((item) => item.id === record.mediaId) : undefined
        const translationKey = `${tenantId}:${active.id}:${message.id}`
        const targetLanguage = /[\u4e00-\u9fff]/.test(message.text) ? 'en' : 'zh'
        return <div className={`message-row ${message.direction}`} data-message-id={message.id} key={message.id}><div className="bubble">{media && <div className="message-media"><ImageIcon size={17} /><span><strong>{media.title}</strong><small>PPV · ${record?.price} · {record && ppvStatusLabel(record.status)}</small></span></div>}{message.text}</div><div className="message-meta">{viewPreferences.chatTimestamps && <small>{message.sentAt}{message.status === 'read' ? ' · 已读' : ''}</small>}<button onClick={() => setTranslatedMessages((current) => ({ ...current, [translationKey]: !current[translationKey] }))} aria-label={`翻译消息 ${message.id}`}><Languages size={12} />{translatedMessages[translationKey] ? '收起译文' : '翻译'}</button></div>{translatedMessages[translationKey] && <div className="message-translation">{demoTranslation(message.text, targetLanguage) ?? '这条消息暂无演示译文，请人工核对后翻译。'}<small>演示译文 · {targetLanguage === 'zh' ? '中文' : 'English'}</small></div>}</div>
      })}</div></div>
      <footer className="composer">
        {(viewPreferences.chatNextStep || (action.kind === 'fulfillment' && activeActionStatus !== 'done')) && <ActionTray
          action={action} workflow={workflows[active.id]} decision={composition.decisions[active.id]}
          steps={buildWorkPlan(action, workflows[active.id], activeAssignment, tenant.dimensions.collaboration, needsEvidence)}
          aiEnabled={viewPreferences.chatCopilot && tenant.dimensions.ai !== 'advisory'} showEvidence={viewPreferences.profileRecommendation} highlighted={currentTourStep?.highlight === 'action' || currentTourStep?.highlight === 'fulfillment'}
          onOpenAi={() => { setAiMode('reply'); setShowAi(true) }} onReview={createSmartTask}
          onComplete={completeAction} onSchedule={createSmartTask} onShowEvidence={showRecommendationEvidence}
        />}
        {viewPreferences.chatCopilot && <div className="quick-actions" data-tour-highlight={currentTourStep?.highlight === 'copilot'}><button onClick={() => { setShowAi((current) => !current); setAiMode(workspaceRule.copilotStart) }} className={`ai-button ${showAi ? 'active' : ''}`}><BrainCircuit size={16} />{workspaceRule.copilotLabel}</button><span>{workspaceRule.chatHint}</span></div>}
        {viewPreferences.chatCopilot && showAi && <section className="ai-workbench" data-tour-surface={currentTourStep?.highlight === 'verification'}>
          <div className="ai-workbench-header"><div><span className="ai-orb"><Sparkles size={15} /></span><div><strong>AI Copilot</strong><p>所有建议都可编辑，确认后才会发送或写入资料。</p></div></div><button onClick={() => setShowAi(false)} aria-label="关闭 AI Copilot"><X size={16} /></button></div>
          <div className="ai-tabs"><button className={aiMode === 'reply' ? 'active' : ''} onClick={() => setAiMode('reply')}>回复</button><button className={aiMode === 'strategy' ? 'active' : ''} onClick={() => setAiMode('strategy')}>策略</button><button className={aiMode === 'rewrite' ? 'active' : ''} onClick={() => setAiMode('rewrite')}>改写</button><button className={aiMode === 'memory' ? 'active' : ''} onClick={() => setAiMode('memory')}>记忆</button></div>
          {aiMode === 'reply' && <div className="ai-content"><div className="ai-assessment"><div><span>回复目标</span><strong>{intelligence.strategy.goal}</strong></div><div><span>安全等级</span><strong className={`risk-${intelligence.risk}`}><ShieldCheck size={13} />{intelligence.risk}风险</strong></div></div><p className="ai-strategy"><Lightbulb size={14} />{intelligence.strategy.nextAction}</p><p className="ai-guardrail">沟通边界：{intelligence.strategy.guardrail}</p>{needsEvidence && <div className="ai-evidence-gate" data-tour-highlight={currentTourStep?.highlight === 'verification'}><span>涉及未确认偏好的草稿需先核对来源；普通回复仍可使用。</span><button onClick={showRecommendationEvidence}>查看来源</button></div>}<div className="ai-drafts">{draftOptions(active).map((option) => <article key={option.tone}><div><strong>{option.tone}</strong>{needsEvidence && option.requiresVerification && <small className="draft-source-tag">需核对来源</small>}<p>{option.text}</p></div><button disabled={needsEvidence && Boolean(option.requiresVerification)} onClick={() => updateDraft(option.text)}>插入</button></article>)}</div></div>}
          {aiMode === 'strategy' && <div className="ai-content strategy-card"><p className="strategy-title">{intelligence.strategy.goal}</p><div><span>下一步</span><strong>{intelligence.strategy.nextAction}</strong></div><div><span>关键意图</span><strong>{intelligence.signal}</strong></div><div><span>最佳触达</span><strong>{intelligence.bestTime}</strong></div><p className="ai-guardrail">沟通边界：{intelligence.strategy.guardrail}</p><p className="ai-warning">{tenant.dimensions.data === 'sparse' ? '资料不足，请核对事实与来源后再采用建议。' : `置信度 ${intelligence.confidence}% · ${intelligence.reason}`}</p></div>}
          {aiMode === 'rewrite' && <div className="ai-content rewrite-card"><p>当前为演示版，可插入一条符合此粉丝阶段的示例回复，再自行编辑。</p>{needsEvidence && <p className="ai-guardrail">涉及未确认偏好的示例需先核对；这里仍可插入普通回复。</p>}<button className="primary-ai-action" onClick={rewriteDraft}><WandSparkles size={15} />插入阶段示例</button></div>}
          {aiMode === 'memory' && <div className="ai-content memory-card"><p>仅从已记录的信息提取候选记忆，确认后写入粉丝画像。</p>{memoryCandidates(active).map((memory) => <div className="memory-item" key={memory.text}><span>{memory.text}<small>来源：{memory.source}</small></span><button className={activeMemories.includes(memory.text) ? 'confirmed' : ''} onClick={() => confirmMemory(memory.text)}>{activeMemories.includes(memory.text) ? <><Check size={13} />已确认</> : '确认保存'}</button></div>)}</div>}
        </section>}
        <div className="composer-tools" role="group" aria-label="聊天工具"><button className={composerTool === 'scripts' ? 'active' : ''} onClick={() => setComposerTool(composerTool === 'scripts' ? null : 'scripts')} aria-expanded={composerTool === 'scripts'}><BookOpen size={14} />话术</button><button className={composerTool === 'vault' ? 'active' : ''} onClick={() => setComposerTool(composerTool === 'vault' ? null : 'vault')} aria-expanded={composerTool === 'vault'}><ImageIcon size={14} />素材 / PPV</button><button className={composerTool === 'reminder' ? 'active' : ''} onClick={() => setComposerTool(composerTool === 'reminder' ? null : 'reminder')} aria-expanded={composerTool === 'reminder'}><Clock3 size={14} />提醒</button><button className={showMoreTools ? 'active' : ''} onClick={() => setShowMoreTools((current) => !current)} aria-expanded={showMoreTools}><MoreHorizontal size={14} />更多</button></div>
        {showMoreTools && <div className="more-tools-menu" role="group" aria-label="更多聊天工具"><button onClick={prepareTranslation}><Languages size={14} />翻译草稿</button><button onClick={() => { setShowSendReview(true); setShowMoreTools(false) }}><ShieldCheck size={14} />发送检查</button></div>}
        {composerTool === 'scripts' && <section className="composer-tool-panel" aria-label="话术选择"><div className="tool-panel-heading"><strong>常用话术</strong><span>插入草稿后可编辑，不会自动发送</span></div><div className="script-grid">{scriptTemplates.map((script) => <button key={script.id} onClick={() => { updateDraft(script.text); setComposerTool(null) }}><strong>{script.title}</strong><span>{script.purpose}</span></button>)}</div></section>}
        {composerTool === 'vault' && <section className="composer-tool-panel" aria-label="素材与 PPV"><div className="tool-panel-heading"><strong>素材库</strong><span>演示素材 · 发送前请确认价格和文案</span></div><div className="media-grid">{mediaAssets.map((media) => { const previous = activePpvRecords.find((record) => record.mediaId === media.id); return <button className={selectedMediaId === media.id ? 'selected' : ''} key={media.id} onClick={() => chooseMedia(media.id)}><ImageIcon size={16} /><span><strong>{media.title}</strong><small>{media.category} · 建议 ${media.suggestedPrice}{previous ? ` · 曾${ppvStatusLabel(previous.status)}` : ''}</small></span></button> })}</div>{selectedMedia && <div className="ppv-config"><label>PPV 价格 <span>$</span><input aria-label="PPV 价格" type="number" min="0" max="999" value={ppvPrice} onChange={(event) => setPpvPrice(Math.min(999, Math.max(0, Number(event.target.value) || 0)))} /></label><span>{selectedMedia.description}</span><button onClick={() => setSelectedMediaId(null)}>移除素材</button>{activePriceGuide && <div className="price-guide" aria-label="报价参考"><strong>报价参考 ${activePriceGuide.low}–${activePriceGuide.high}</strong><span>{activePriceGuide.basis}{activePriceGuide.average !== null ? ` · 历史均价 $${Math.round(activePriceGuide.average)}` : ''}</span></div>}{activePpvRecords.some((record) => record.mediaId === selectedMedia.id) && <p className="duplicate-warning">这位粉丝已有该素材的发送记录，请核对后再发送。</p>}</div>}</section>}
        {composerTool === 'reminder' && <section className="composer-tool-panel" aria-label="创建跟进提醒"><div className="tool-panel-heading"><strong>安排跟进</strong><span>仅记录在当前租户的演示工作台</span></div><div className="reminder-editor"><input aria-label="提醒内容" value={reminderText} onChange={(event) => setReminderText(event.target.value)} placeholder="例如：明天确认是否看过新照片集" /><select aria-label="提醒时间" value={reminderDelay} onChange={(event) => setReminderDelay(Number(event.target.value))}><option value={2}>2 小时后</option><option value={24}>明天</option><option value={72}>3 天后</option></select><button onClick={scheduleReminder} disabled={!reminderText.trim()}>添加提醒</button></div></section>}
        {composerTool === 'translate' && <section className="composer-tool-panel" aria-label="翻译草稿"><div className="tool-panel-heading"><strong>双向翻译</strong><span>样例译文可编辑；未覆盖的内容请人工翻译</span></div><div className="translation-editor"><select aria-label="译文语言" value={translationLanguage} onChange={(event) => { const language = event.target.value as 'zh' | 'en'; setTranslationLanguage(language); setTranslationDraft(demoTranslation(draft, language) ?? '') }}><option value="en">English</option><option value="zh">中文</option></select><button onClick={() => setTranslationDraft(demoTranslation(draft, translationLanguage) ?? '')}>生成演示译文</button><textarea aria-label="译文草稿" value={translationDraft} onChange={(event) => setTranslationDraft(event.target.value)} placeholder="暂无演示译文，可在这里输入并核对译文" rows={2} /><button className="translation-apply" disabled={!translationDraft.trim()} onClick={() => { updateDraft(translationDraft); setComposerTool(null) }}>替换发送草稿</button></div></section>}
        {showSendReview && <section className="send-review-panel" aria-label="发送前检查"><div className="tool-panel-heading"><strong>发送前检查</strong><button onClick={() => setShowSendReview(false)} aria-label="关闭发送检查"><X size={14} /></button></div>{sendIssues.length ? <ul>{sendIssues.map((issue) => <li className={issue.severity} key={issue.code}><strong>{issue.title}</strong><span>{issue.detail}</span></li>)}</ul> : <p>未发现当前演示规则覆盖的问题。仍请人工核对内容与价格。</p>}<div className="send-review-actions"><button onClick={() => setShowSendReview(false)}>返回修改</button><button disabled={sendIssues.some((issue) => issue.severity === 'block') || (!draft.trim() && !selectedMedia)} onClick={commitMessage}>确认并发送</button></div></section>}
        {selectedMedia && <div className="selected-media-chip"><ImageIcon size={14} /><span>{selectedMedia.title} · PPV ${ppvPrice}</span><button onClick={() => setSelectedMediaId(null)} aria-label="移除已选素材"><X size={14} /></button></div>}
        {quoteRequestId && <div className="selected-media-chip quote-chip"><FileText size={14} /><span>报价草稿 · 发送后记录为已报价</span><button onClick={() => setQuoteRequestId(null)} aria-label="取消报价关联"><X size={14} /></button></div>}
        <div className="composer-box"><textarea value={draft} onChange={(event) => updateDraft(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); sendMessage() } }} placeholder={selectedMedia ? `为 ${selectedMedia.title} 添加说明（可选）…` : `回复 ${active.name}…`} rows={1} aria-label={`回复 ${active.name}`} /><button onClick={sendMessage} className="send-button" aria-label="发送" disabled={!draft.trim() && !selectedMedia}><Send size={18} /></button></div>{viewPreferences.chatHelp && <p className="composer-help"><span>⌘ / Ctrl + Enter 发送</span><span>草稿自动保存 · 演示发送需人工确认</span></p>}
      </footer>
    </section>
    {showCompactInsights && <button className="compact-insights-backdrop" aria-label="关闭会话洞察" onClick={() => setShowCompactInsights(false)} />}
    <aside className={`detail-panel ${showCompactInsights ? 'mobile-open' : ''}`} aria-label="会话洞察">
      <header><h2>会话洞察</h2><div className="detail-header-actions"><a className="report-link" href={reportUrl} target="_blank" rel="noopener noreferrer" aria-label="在新窗口打开价值分析报告" title="在新窗口打开价值分析报告"><FileText size={14} /><span>分析报告</span></a><button className={`tenant-switch-trigger ${showTenantDialog ? 'active' : ''}`} onClick={() => setShowTenantDialog(true)} aria-label={`切换演示租户，当前 ${tenant.name}`} aria-haspopup="dialog" aria-expanded={showTenantDialog} aria-controls="tenant-switch-dialog" title="切换演示租户，查看不同机构的工作台模式"><Building2 size={14} /><span>{tenant.name}</span><ChevronDown size={13} /></button><button className="compact-insights-close" onClick={() => setShowCompactInsights(false)} aria-label="关闭会话洞察"><X size={16} /></button></div></header>
      <div className="insight-tabs" role="tablist" aria-label="会话洞察分类"><button role="tab" aria-selected={insightView === 'work'} className={insightView === 'work' ? 'active' : ''} onClick={() => setInsightView('work')}>当前处理</button><button role="tab" aria-selected={insightView === 'fan'} className={insightView === 'fan' ? 'active' : ''} onClick={() => setInsightView('fan')}>粉丝资料</button></div>
      {insightView === 'work' && <>
      <div className="tenant-insight-brief" data-tour-highlight={currentTourStep?.highlight === 'purchase' || currentTourStep?.highlight === 'insight'}><span>{workspaceRule.insightTitle}</span><strong>{tenantInsight}</strong><div className="tenant-insight-metrics">{insightMetrics.map((metric) => <div key={metric.label}><small>{metric.label}</small><b>{metric.value}</b></div>)}</div>{tenantId === 'custom' && <div className="tenant-custom-signals"><span>{dimensionLabel('collaboration', customDimensions.collaboration)}</span><span>AI：{dimensionLabel('ai', customDimensions.ai)}</span></div>}</div>
      {tenant.dimensions.data === 'sparse' && <div className="coverage-warning" data-tour-highlight={currentTourStep?.highlight === 'coverage'}><ShieldCheck size={14} /><span>资料覆盖率 {Math.round(tenant.signals.dataCoverage * 100)}%；AI 推断请先核对来源。</span><button onClick={showRecommendationEvidence}>查看来源</button></div>}
      {tenant.dimensions.data === 'partial' && <div className="data-quality-note"><ShieldCheck size={14} /><span>资料覆盖率 {Math.round(tenant.signals.dataCoverage * 100)}%；购买与偏好线索请留意来源和更新时间。</span></div>}
      {tenant.dimensions.data === 'complete' && <div className="data-quality-note complete"><ShieldCheck size={14} /><span>资料较充分，可参考已记录偏好；新推断仍需确认。</span></div>}
      {tenant.dimensions.collaboration !== 'solo' && <section className="collaboration-panel" data-tour-highlight={currentTourStep?.highlight === 'collaboration'}><div><strong>{tenant.dimensions.collaboration === 'shifts' ? '轮班交接' : '小组协作'}</strong><span>{activeAssignment.handoffPending ? '待确认交接' : `负责人：${activeAssignment.owner}`}</span></div><p>{activeAssignment.event} · {action.kind === 'fulfillment' ? '付款与交付状态需一起移交。' : `最近消息：${active.preview}`}</p><div className="collaboration-actions">{activeAssignment.owner !== '我' && !activeAssignment.handoffPending && <button onClick={() => updateAssignment('我', false, '已认领当前会话')}>认领会话</button>}{tenant.dimensions.collaboration === 'shifts' && activeAssignment.handoffPending && <button onClick={() => updateAssignment('我', false, '已确认本班次接手')}>确认交接</button>}{activeAssignment.owner === '我' && !activeAssignment.handoffPending && <button onClick={() => updateAssignment('Alex', tenant.dimensions.collaboration === 'shifts', tenant.dimensions.collaboration === 'shifts' ? '已发起交接，待下一班次确认' : '已转交 Alex')}>{tenant.dimensions.collaboration === 'shifts' ? '发起交接' : '转交 Alex'}</button>}</div></section>}
      {profilePanels.recommendation}
      <section className="detail-section operational-section" aria-label="跟进提醒"><div className="section-title"><h3><Clock3 size={16} />跟进提醒</h3><button onClick={() => { setComposerTool('reminder'); setShowCompactInsights(false) }}>新建</button></div>{activeReminders.length ? activeReminders.map((reminder) => <div className={`reminder-item ${reminder.status}`} key={reminder.id}><div><strong>{reminder.text}</strong><small>{reminder.status === 'done' ? '已完成' : new Date(reminder.dueAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></div>{reminder.status === 'scheduled' && <button onClick={() => setReminders((current) => current.map((item) => item.id === reminder.id ? { ...item, status: 'done' } : item))}>完成</button>}</div>) : <p className="operational-empty">暂无提醒，可在聊天区安排后续跟进。</p>}</section>
      <details className="detail-section operational-section work-tool-details" aria-label="内容请求"><summary><FileText size={15} />内容请求 <span>{activeRequests.filter((request) => request.status !== 'delivered').length} 项进行中</span></summary><div className="work-tool-body">{activeRequests.map((request) => {
        const status = request.source === 'sample' && workflows[active.id].fulfillmentStatus === 'delivered' ? 'delivered' : request.status
        return <article className="request-card" key={request.id}><div className="ppv-record-heading"><strong>{request.title}</strong><span className={`ppv-status ${status}`}>{requestStatusLabel(status)}</span></div><p>{request.price === null ? '金额来自平台付款记录' : `报价 $${request.price}`} · {request.updatedAt}</p><label>负责人 <select aria-label={`${request.title}负责人`} value={request.owner} onChange={(event) => setContentRequests((current) => current.map((item) => item.id === request.id ? { ...item, owner: event.target.value } : item))}><option value={request.owner}>{request.owner}</option>{request.owner !== '我' && <option value="我">我</option>}{request.owner !== 'Alex' && <option value="Alex">Alex</option>}</select></label><div className="record-actions">{status === 'new' && <button onClick={() => prepareQuote(request)}>准备报价</button>}{status === 'quoted' && <button onClick={() => setContentRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: 'paid', updatedAt: '刚刚' } : item))}>模拟已付款</button>}{status === 'paid' && <button onClick={() => request.source === 'sample' ? completeAction() : setContentRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: 'delivered', updatedAt: '刚刚' } : item))}>确认已交付</button>}</div>{status === 'paid' && <small>付款已记录，交付仍需单独确认。</small>}</article>
      })}{showRequestForm ? <div className="request-form"><input aria-label="请求内容" value={requestTitle} onChange={(event) => setRequestTitle(event.target.value)} placeholder="请求内容，例如定制照片集" /><label>拟报价 $<input aria-label="请求报价" type="number" min="1" max="999" value={requestPrice} onChange={(event) => setRequestPrice(Math.min(999, Math.max(1, Number(event.target.value) || 1)))} /></label><div><button onClick={() => setShowRequestForm(false)}>取消</button><button disabled={!requestTitle.trim()} onClick={() => { createContentRequest(); setShowRequestForm(false) }}>登记请求</button></div></div> : <button className="add-request" onClick={() => setShowRequestForm(true)}>+ 登记新请求</button>}</div></details>
      <details className="detail-section operational-section work-tool-details" aria-label="会话摘要与交接"><summary><BrainCircuit size={15} />会话摘要与交接 <span>{handoffNotes[active.id] ? '已保存' : '按需生成'}</span></summary><div className="work-tool-body"><p className="operational-empty">汇总现有演示消息与业务记录；保存前可编辑核对。</p><button className="add-request" onClick={() => setHandoffDrafts((current) => ({ ...current, [handoffDraftKey]: summarizeConversation({ conversation: active, workflow: workflows[active.id], ppvRecords: activePpvRecords, requests: activeRequests, owner: activeAssignment.owner }) }))}>生成会话摘要</button><textarea aria-label="交接摘要" rows={7} value={handoffText} onChange={(event) => setHandoffDrafts((current) => ({ ...current, [handoffDraftKey]: event.target.value }))} placeholder="点击生成，或手动写下交接重点" /><button className="save-handoff" disabled={!handoffText.trim()} onClick={saveHandoff}>保存交接摘要</button></div></details></>}
      {insightView === 'fan' && <>{profilePanels.metrics}<section className="detail-section operational-section" aria-label="PPV 记录"><div className="section-title"><h3><ImageIcon size={16} />PPV 记录</h3><span className="record-label">演示数据</span></div>{activePpvRecords.length ? activePpvRecords.map((record) => { const media = mediaAssets.find((item) => item.id === record.mediaId); return <div className="ppv-record" key={record.id}><div className="ppv-record-heading"><strong>{media?.title ?? '素材'}</strong><span className={`ppv-status ${record.status}`}>{ppvStatusLabel(record.status)}</span></div><p>{record.caption}</p><small>${record.price} · {record.sentAt}{record.source === 'sample' ? ' · 初始样例' : ''}</small><div className="record-actions"><button onClick={() => { updateDraft(record.caption); notify('已复制到草稿，请核对后发送') }}>复制为草稿</button>{record.source === 'demo' && record.status === 'sent' && <button onClick={() => setPpvRecords((current) => current.map((item) => item.id === record.id ? { ...item, status: 'viewed' } : item))}>模拟已查看</button>}{record.source === 'demo' && record.status === 'viewed' && <button onClick={() => setPpvRecords((current) => current.map((item) => item.id === record.id ? { ...item, status: 'purchased' } : item))}>模拟已购买</button>}{ppvFollowUpLabel(record) && <button onClick={() => setPpvRecords((current) => current.map((item) => item.id === record.id ? { ...item, followUpDone: true } : item))}>标记已跟进</button>}</div>{ppvFollowUpLabel(record) && <small className="followup-reason">{ppvFollowUpLabel(record)} · 可从左侧 PPV 待跟进直达</small>}</div> }) : <p className="operational-empty">暂无 PPV 发送记录。</p>}</section>{composition.presentation.detailOrder.filter((section) => section !== 'recommendation' && section !== 'metrics').map((section) => <Fragment key={section}>{profilePanels[section]}</Fragment>)}</>}
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
            <p className="tenant-dimension-note">{tenantId === 'custom' ? '调整后即时改变处理节奏、会话路径和信息侧栏；当前聊天与已有记录不会丢失。' : '这些等级是预设租户的固定特征。选择“自定义租户”可自由组合。'}</p>
          </div>
        </div>
      </div>
      <footer className="tenant-dialog-footer"><span role="status">当前：{tenant.name} · {configurationMode === 'smart' ? '智能配置' : '手动配置'}</span><div className="tenant-dialog-actions"><button className="demo-data-entry" aria-haspopup="dialog" aria-expanded={showGradingDialog} aria-controls="tenant-grading-dialog" onClick={() => setShowGradingDialog(true)}><BookOpen size={14} />分级规则</button><button className="demo-data-entry" aria-haspopup="dialog" aria-expanded={showDemoDataDialog} aria-controls="demo-data-dialog" onClick={() => { setDemoDataResult(''); setShowDemoDataDialog(true) }}>演示数据管理</button><button className="demo-data-entry tenant-tour-entry" onClick={startDemoTour}><Play size={13} fill="currentColor" />导览当前租户</button></div></footer>
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
        <section className="demo-data-action"><div><span className="demo-data-scope">影响聊天内容</span><h3>恢复演示会话</h3><p>将消息、待办状态、草稿、PPV 记录、跟进提醒、内容请求和交接摘要恢复到初始样例。</p><p className="demo-data-kept"><strong>保留</strong>推荐使用记录和工作台配置</p></div><button onClick={() => { resetDemoConversations(); setDemoDataResult('已恢复当前租户的演示会话') }}>恢复会话</button></section>
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
    {tourStep !== null && <DemoTour steps={tourSteps} stepIndex={tourStep} onPrevious={() => moveDemoTour(tourStep - 1)} onNext={() => tourStep === tourSteps.length - 1 ? finishDemoTour() : moveDemoTour(tourStep + 1)} onSelectTenant={(id) => moveDemoTour(tourSteps.findIndex((step) => step.tenantId === id))} onClose={finishDemoTour} />}
    {toast && <div className="toast"><Check size={15} />{toast}</div>}
  </main></div>
}

createRoot(document.getElementById('root')!).render(<App />)
