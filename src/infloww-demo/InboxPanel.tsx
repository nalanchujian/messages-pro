import { displaySample, displayScriptTitle, getLocale, mediaTypeLabel, messageStatusLabel, subscriptionStatusLabel, t } from './i18n'
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { ArrowUpRight, BadgeCheck, Bot, BarChart3, Bell, BellOff, Check, ChevronDown, Clock3, Flame, Inbox, ListFilter, MessageSquare, Pencil, Plus, RefreshCw, Search, Settings, Snowflake, Trash2, UserRound, Users, X } from 'lucide-react'
import { useDemo, selectFans, canWithdrawMessage, fanMetrics, fanSignals, normalizeAudience, selectOnlineFans, messagesFor, money, relativeTime, displayName } from './store'
import { Modal, AnchoredPopover, IconButton, Avatar, Tooltip } from './ui'
import FanListsDialog from './FanListsDialog'
import OnlineFansDialog from './OnlineFansDialog'
import NotificationsPopover from './NotificationsPopover'
import OnlineAudienceFields from './OnlineAudienceFields'
import ChatMediaPicker from './ChatMediaPicker'
import CreatorTagsDialog from './CreatorTagsDialog'
import { DateField, SelectField } from './ProfileFields'
import { emptyDraft, key } from './types'
import type { Campaign, Draft, Fan, Media, Message, OnlineAudienceFilter } from './types'
import './inbox.css'
import './message-pro-dialog.css'

type Dialog = 'online' | 'pinnedLists' | 'split' | 'campaign' | 'reports' | 'fanLists' | 'moveInbox' | null
type Confirmation = { kind: 'clear'; fanIds: string[] } | { kind: 'withdraw'; messageIds: string[] }
type CampaignEditor = { type: Campaign['type']; title: string; fanIds: string[]; draft: Draft; scheduled: boolean; scheduledAt: string; audience?: OnlineAudienceFilter }
const campaignNames = (): Record<Campaign['type'], string> => ({ smart: t('ui.086'), mass: t('ui.087'), auto: t('ui.088') })
const signalDescription = (signal: string) => ({ New: t('ui.184'), Expired: t('ui.185'), Off: t('ui.186'), PPV: t('ui.187'), '72h': t('ui.188') })[signal] ?? signal

function localDatetime(timestamp: number) {
  const date = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
function latestMessage(messages: Message[]) { return messages.reduce<Message | undefined>((latest, message) => !latest || message.createdAt > latest.createdAt ? message : latest, undefined) }
function dateLabel(timestamp: number) { return new Date(timestamp).toLocaleString(getLocale()==='zh'?'zh-CN':'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function conversationTime(timestamp: number, now: number) {
  const date = new Date(timestamp)
  return date.toDateString() === new Date(now).toDateString()
    ? date.toLocaleTimeString(getLocale()==='zh'?'zh-CN':'en-US', { hour: 'numeric', minute: '2-digit', hour12: getLocale() !== 'zh' })
    : date.toLocaleDateString(getLocale()==='zh'?'zh-CN':'en-US', { month: getLocale() === 'zh' ? 'numeric' : 'short', day: 'numeric' })
}
const signalLabels = (): Record<string, string> => ({ New: t('fanSignal.new'), Expired: t('ui.092'), Off: t('fanSignal.off'), PPV: t('ui.094'), '72h': t('ui.095') })

export default function InboxPanel() {
  const { state, dispatch, creator, workspace, now, notify } = useDemo()
  const creatorId = creator.id
  const admin = state.role === 'admin'
  const permissionHint = t('ui.096')
  const allFans = state.fans[creatorId] ?? []
  const availableFans = allFans.filter((fan) => !fan.hidden && !fan.cleared)
  const visibleFans = selectFans(state, creatorId)
  const notifications = state.notifications.filter((item) => item.creatorId === creatorId)
  const transactions = state.transactions.filter((item) => item.creatorId === creatorId)
  const unreadNotifications = notifications.filter((item) => item.unread).length
  const listRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const restoredCreator = useRef<string>('')
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [searchOpen, setSearchOpen] = useState(Boolean(workspace.search))
  const [menu, setMenu] = useState<'statistics' | 'campaign' | 'more' | 'inboxes' | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [context, setContext] = useState<{ fanId: string; x: number; y: number } | null>(null)
  const [signalTooltip, setSignalTooltip] = useState<{ fanId: string; anchor: HTMLElement } | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [targetFanId, setTargetFanId] = useState<string | null>(null)
  const [moveInboxId, setMoveInboxId] = useState(1)
  const [newListName, setNewListName] = useState('')
  const [pinnedNewListOpen, setPinnedNewListOpen] = useState(false)
  const [campaignVaultOpen, setCampaignVaultOpen] = useState(false)
  const [campaignVaultIds, setCampaignVaultIds] = useState<string[]>([])
  const [campaignTagsOpen, setCampaignTagsOpen] = useState(false)
  const [splitEnabled, setSplitEnabled] = useState(creator.splitEnabled)
  const [splitCount, setSplitCount] = useState(creator.inboxCount)
  const [splitAnchor, setSplitAnchor] = useState<HTMLElement | null>(null)
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null)
  const [replies, setReplies] = useState<Record<string, string>>({})
  const [reportType, setReportType] = useState<Campaign['type']>('smart')
  const [reportCampaignId, setReportCampaignId] = useState<string | null>(null)
  const [recipientSearch, setRecipientSearch] = useState('')
  const [editor, setEditor] = useState<CampaignEditor>(() => ({ type: 'smart', title: '', fanIds: [], draft: emptyDraft(), scheduled: false, scheduledAt: localDatetime(now + 3_600_000) }))

  useEffect(() => {
    setDialog(null); setConfirmation(null); setMenu(null); setContext(null); setSplitAnchor(null); setNotificationAnchor(null)
    setSelectMode(false); setSelectedIds([]); setReplies({}); setTargetFanId(null)
    setSearchOpen(Boolean(workspace.search)); setReportCampaignId(null); setSignalTooltip(null)
    setPinnedNewListOpen(false); setCampaignVaultOpen(false); setCampaignTagsOpen(false); setCampaignVaultIds([])
    // Workspaces retain their own scroll offsets. Restore once, then let the user scroll freely.
    const frame = requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = workspace.listScroll
      restoredCreator.current = creatorId
    })
    return () => cancelAnimationFrame(frame)
  }, [creatorId])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    if (!menu && !context) return
    const close = () => { setMenu(null); setContext(null) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    document.addEventListener('click', close)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', escape) }
  }, [menu, context])

  useEffect(() => () => { if (refreshTimer.current) clearTimeout(refreshTimer.current) }, [])

  useEffect(() => {
    setSelectedIds((current) => {
      const valid = current.filter((id) => availableFans.some((fan) => fan.id === id))
      return valid.length === current.length ? current : valid
    })
  }, [state.fans, creatorId])

  const pinnedFans = availableFans.filter((fan) => messagesFor(state, creatorId, fan.id).some((message) => message.pinned && message.status !== 'withdrawn'))
  const priorityFans = availableFans.filter((fan) => fan.priority)
  const unreadFans = availableFans.filter((fan) => fan.unread)
  const onlineAudience = normalizeAudience(workspace.onlineAudience)

  const baseViews = [
    { id: 'all', label: t('ui.097'), count: 0, show: true },
    { id: 'pinned', label: t('ui.098'), count: pinnedFans.length, show: true },
    { id: 'priority', label: t('ui.099'), count: priorityFans.length, show: workspace.view === 'priority' },
    { id: 'unread', label: t('ui.100'), count: unreadFans.length, show: workspace.view === 'unread' },
    { id: 'tips', label: t('ui.101'), count: 0, show: true },
  ]
  const targetFan = allFans.find((fan) => fan.id === targetFanId)
  const reportCampaigns = state.campaigns.filter((campaign) => campaign.creatorId === creatorId && campaign.type === reportType).sort((a, b) => b.createdAt - a.createdAt)
  const detailCampaign = state.campaigns.find((campaign) => campaign.id === reportCampaignId && campaign.creatorId === creatorId)
  const campaignFans = (editor.audience ? selectOnlineFans(state, creatorId, editor.audience, now) : availableFans).filter(fan => !fan.blocked && !fan.restricted && (fan.subscriptionStatus !== 'expired' || fan.creatorSubscribed))
  const campaignFanIds = editor.fanIds.filter(id => campaignFans.some(fan => fan.id === id))
  const recipientMatches = campaignFans.filter((fan) => `${fan.name} ${fan.handle}`.toLowerCase().includes(recipientSearch.trim().toLowerCase()))

  function patchWorkspace(payload: Partial<typeof workspace>) {
    const nextView = payload.view ?? workspace.view
    const nextFilter = payload.extraFilter ?? workspace.extraFilter
    const nextSort = payload.sort ?? workspace.sort
    const nextAI = payload.aiFilter ?? workspace.aiFilter ?? 'include'
    const leavesFocus = workspace.focus && (nextView !== 'all' || nextFilter !== 'all' || nextSort !== 'newest' || nextAI !== 'include')
    dispatch({ type: 'PATCH_WORKSPACE', creatorId, payload: leavesFocus ? { ...payload, focus: false } : payload })
    if (leavesFocus) notify(t('ui.102'))
  }
  function openFan(fanId: string, closeDialog = true) {
    dispatch({ type: 'OPEN_FAN', creatorId, fanId })
    setContext(null)
    if (closeDialog) setDialog(null)
  }
  function refreshList() {
    dispatch({ type: 'FLUSH_FOCUS', creatorId })
    setRefreshing(true)
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => setRefreshing(false), 400)
    notify(t('ui.103'))
  }
  function changeView(view: string) { patchWorkspace({ view, extraFilter: 'all', listScroll: 0 }); if (listRef.current) listRef.current.scrollTop = 0 }
  function toggleSelection(id: string) { setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]) }
  function toggleAllVisible() {
    const ids = visibleFans.map((fan) => fan.id)
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id))
    setSelectedIds((current) => allSelected ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])])
  }
  function showContext(event: ReactMouseEvent, fan: Fan) {
    if (selectMode) return
    event.preventDefault(); event.stopPropagation(); setMenu(null)
    setContext({ fanId: fan.id, x: Math.max(8, Math.min(event.clientX, window.innerWidth - 228)), y: Math.max(8, Math.min(event.clientY, window.innerHeight - 246)) })
  }
  function openListMembership(fanId: string) { setTargetFanId(fanId); setContext(null); setDialog('fanLists') }
  function openMoveInbox(fanId: string) { const fan = allFans.find((item) => item.id === fanId); setTargetFanId(fanId); setMoveInboxId(fan?.inboxId ?? 1); setContext(null); setDialog('moveInbox') }
  function openReports(type: Campaign['type']) { setMenu(null); notify(t('inboxCompletion.navigation', [campaignNames()[type]])) }
  function openCampaign(fanIds: string[] = visibleFans.map((fan) => fan.id), title = '', type: Campaign['type'] = 'smart', draft: Draft = emptyDraft(), audience?: OnlineAudienceFilter) {
    setEditor({ type, title, fanIds, audience: audience ? structuredClone(audience) : undefined, draft: { ...draft, attachments: [...draft.attachments], creatorTags: [...draft.creatorTags], releaseFormIds: [...(draft.releaseFormIds ?? [])], format: { ...draft.format }, scheduledAt: undefined }, scheduled: type === 'auto', scheduledAt: localDatetime(now + 3_600_000) })
    setRecipientSearch(''); setMenu(null); setDialog('campaign')
  }
  function updateEditorAudience(audience: OnlineAudienceFilter) { setEditor(current => ({ ...current, audience, fanIds: selectOnlineFans(state, creatorId, audience, now).map(fan => fan.id) })) }
  function selectCampaignMedia(media: Media) {
    const draft = editor.draft
    if (media.type === 'gif' && (draft.attachments.length || draft.price || draft.creatorTags.length || draft.releaseFormIds?.length)) { notify(t('interface.274')); return }
    if (draft.attachments.some(item => state.media.find(entry => entry.id === item.mediaId)?.type === 'gif')) { notify(t('interface.275')); return }
    if (media.type === 'gif') { setCampaignVaultIds(current => current.includes(media.id) ? [] : [media.id]); return }
    setCampaignVaultIds(current => { const compatible = current.filter(id => state.media.find(item => item.id === id)?.type !== 'gif'); if (compatible.includes(media.id)) return compatible.filter(id => id !== media.id); if (compatible.length + draft.attachments.length >= 40) { notify(t('inboxCompletion.mediaLimit')); return compatible }; return [...compatible, media.id] })
  }
  function updateEditorDraft(patch: Partial<Draft>) { setEditor((current) => ({ ...current, draft: { ...current.draft, ...patch } })) }
  function saveCampaign(saveOnly: boolean) {
    if (!admin) { notify(permissionHint); return }
    if (!editor.title.trim()) { notify(t('ui.104')); return }
    if (campaignFanIds.length === 0) { notify(t('ui.105')); return }
    if (!editor.draft.text.trim() && editor.draft.attachments.length === 0) { notify(t('ui.106')); return }
    if (!Number.isFinite(editor.draft.price) || editor.draft.price < 0 || editor.draft.price > 200 || (editor.draft.price > 0 && editor.draft.price < 3)) { notify(t('interface.270')); return }
    if (editor.draft.price > 0 && !editor.draft.lockedText && !editor.draft.attachments.some(item => !item.free)) { notify(t('interface.271')); return }
    if (editor.draft.attachments.length > 40) { notify(t('inboxCompletion.mediaLimit')); return }
    const scheduledAt = editor.scheduled ? new Date(editor.scheduledAt).getTime() : undefined
    if (!saveOnly && scheduledAt !== undefined && (!Number.isFinite(scheduledAt) || scheduledAt <= now)) { notify(t('ui.107')); return }
    if (!saveOnly && editor.type === 'auto' && !editor.scheduled) { notify(t('ui.108')); return }
    dispatch({ type: 'CREATE_CAMPAIGN', creatorId, payload: { title: editor.title.trim(), type: editor.type, fanIds: campaignFanIds, audience: editor.audience, draft: editor.draft, scheduledAt, saveOnly } })
    setDialog('reports'); setReportType(editor.type); setReportCampaignId(null)
    notify(saveOnly ? t('ui.109') : editor.scheduled ? t('ui.110') : state.simulateFailure ? t('ui.111') : t('ui.112'))
  }
  function confirmOperation() {
    if (!confirmation || !admin) return
    if (confirmation.kind === 'clear') {
      dispatch({ type: 'CLEAR_FANS', creatorId, payload: confirmation.fanIds })
      setSelectedIds([]); setSelectMode(false); notify(t('ui.116'))
    } else {
      confirmation.messageIds.forEach((messageId) => {
        const message = allFans.flatMap((fan) => messagesFor(state, creatorId, fan.id)).find((item) => item.id === messageId)
        if (message) dispatch({ type: 'WITHDRAW', creatorId, fanId: message.fanId, messageId })
      })
      notify(t('ui.119'))
    }
    setConfirmation(null)
  }
  function previewFor(fan: Fan, messages: Message[]) {
    const draft = state.drafts[key(creatorId, fan.id)]
    if (fan.id !== workspace.activeFanId && draft && (draft.text.trim() || draft.attachments.length)) return t('ui.120', [draft.text || t('ui.125')])
    const message = latestMessage(messages)
    if (!message) return t('ui.121')
    if (message.status === 'withdrawn') return t('ui.122')
    if (message.status === 'failed') return t('ui.123', [displaySample(message.text) || t('ui.125')])
    if (message.direction === 'inbound' && message.lockedText && message.price > 0 && !message.purchasedAt) return t('ui.124')
    return displaySample(message.text) || (message.attachments.length ? t('ui.125') : t('ui.121'))
  }
  function campaignSummary(campaign: Campaign) {
    const messages = campaign.fanIds.flatMap((fanId) => messagesFor(state, creatorId, fanId)).filter((message) => campaign.messageIds.includes(message.id))
    const sent = messages.filter((message) => message.status === 'sent' || message.status === 'read' || message.status === 'withdrawn').length
    const failed = messages.filter((message) => message.status === 'failed').length
    const skipped = campaign.status === 'sent' ? campaign.fanIds.filter((fanId) => !messages.some((message) => message.fanId === fanId) && !allFans.find((fan) => fan.id === fanId)?.cleared).length : 0
    const viewed = messages.filter((message) => message.viewed || message.status === 'read').length
    const purchased = new Set(transactions.filter((item) => item.kind === 'ppv' && item.messageId && campaign.messageIds.includes(item.messageId)).map((item) => item.messageId)).size
    const revenue = transactions.filter((item) => item.kind === 'ppv' && item.messageId && campaign.messageIds.includes(item.messageId)).reduce((total, item) => total + item.amount, 0)
    return { messages, sent, failed, skipped, viewed, purchased, revenue }
  }

  return <aside className="if-inbox" aria-label={t('ui.126')}>
    <div className="if-inbox-top">
      {selectMode ? <div className="if-inbox-editbar"><IconButton label={t('ui.127')} onClick={() => { setSelectMode(false); setSelectedIds([]) }}><X size={17} /></IconButton><strong>{selectedIds.length ? t('ui.128', [selectedIds.length]) : t('ui.129')}</strong>{creator.splitEnabled && admin && <select aria-label={t('interface.extra.03')} disabled={!selectedIds.length} value="" onChange={event => { const inboxId = Number(event.target.value); if (!inboxId) return; dispatch({ type: 'MOVE_INBOX', creatorId, payload: { fanIds: selectedIds, inboxId } }); setSelectedIds([]); setSelectMode(false); notify(t('ui.217', [inboxId])) }}><option value="">{t('interface.extra.03')}</option>{Array.from({ length: creator.inboxCount }, (_, index) => <option key={index} value={index + 1}>{t('ui.147')} {index + 1}</option>)}</select>}<button className="if-text-button if-danger-text" disabled={!selectedIds.length} onClick={() => setConfirmation({ kind: 'clear', fanIds: selectedIds })}>{t('ui.130')}</button><button className="if-text-button" onClick={toggleAllVisible}>{visibleFans.length > 0 && visibleFans.every((fan) => selectedIds.includes(fan.id)) ? t('ui.131') : t('ui.132')}</button></div>
        : searchOpen ? <div className="if-inbox-search"><IconButton label={t('ui.133')} onClick={() => { setSearchOpen(false); patchWorkspace({ search: '' }) }}><X size={17} /></IconButton><input ref={searchRef} maxLength={30} value={workspace.search} placeholder={t('ui.134')} aria-label={t('ui.135')} onChange={(event) => patchWorkspace({ search: event.target.value })} /><Search size={19} /></div>
          : <div className="if-inbox-titlebar"><strong>{creator.name}</strong><div className="if-inbox-tools" onClick={(event) => event.stopPropagation()}><IconButton label={admin ? t('ui.136') : permissionHint} disabled={!admin} active={menu === 'statistics'} onClick={() => setMenu(menu === 'statistics' ? null : 'statistics')}><BarChart3 size={18} /></IconButton><IconButton label={t('ui.137')} onClick={() => setSearchOpen(true)}><Search size={19} /></IconButton><IconButton label={admin ? t('ui.138') : permissionHint} disabled={!admin} active={menu === 'campaign'} onClick={() => setMenu(menu === 'campaign' ? null : 'campaign')}><Plus size={22} /></IconButton>
            {menu === 'statistics' && <div className="if-inbox-menu if-stat-menu"><small>{t('ui.088')}</small><button onClick={() => openReports('auto')}>{t('ui.088')} <ArrowUpRight size={14} /></button><small>{t('ui.139')}</small><button onClick={() => openReports('smart')}>{t('ui.086')} <ArrowUpRight size={14} /></button><button onClick={() => openReports('mass')}>{t('ui.087')} <ArrowUpRight size={14} /></button></div>}
            {menu === 'campaign' && <div className="if-inbox-menu if-campaign-menu"><small>{t('campaign.menu.automated')}</small><button onClick={() => openCampaign(undefined, '', 'auto')}>{t('campaign.menu.automated')}</button><small>{t('ui.139')}</small><button onClick={() => openCampaign(undefined, '', 'smart')}>{t('campaign.menu.priority')}</button><button onClick={() => openCampaign(undefined, '', 'mass')}>{t('campaign.menu.of')}</button></div>}
          </div></div>}
      <div className="if-inbox-shortcuts"><button className="if-online-button" onClick={() => setDialog('online')}><Users size={18} />{t('ui.140')}</button><button className="if-notifications-button" aria-haspopup="dialog" aria-expanded={!!notificationAnchor} onClick={event => { const anchor=event.currentTarget;setDialog(null);setMenu(null);setContext(null);setNotificationAnchor(value=>value?null:anchor) }}><Bell size={18} />{t('ui.141')}{unreadNotifications > 0 && <b>{unreadNotifications}</b>}</button></div>
      <div className="if-inbox-sortbar" onClick={(event) => event.stopPropagation()}>
        <div className="if-inbox-selector"><button className="if-inbox-scope" disabled={!creator.splitEnabled} title={creator.splitEnabled ? t('ui.142') : t('ui.143')} onClick={() => setMenu(menu === 'inboxes' ? null : 'inboxes')}><Inbox size={17}/><span>{!creator.splitEnabled || workspace.inboxIds.length === 0 ? t('ui.144') : t('ui.145', [workspace.inboxIds.join(', ')])}</span>{creator.splitEnabled && <ChevronDown size={12} />}</button><IconButton label={admin ? t('ui.146') : permissionHint} disabled={!admin} active={dialog === 'split'} onClick={(event) => { if (dialog === 'split') { setDialog(null); setSplitAnchor(null); return } setSplitEnabled(creator.splitEnabled); setSplitCount(Math.max(2, creator.inboxCount)); setSplitAnchor(event.currentTarget.parentElement); setDialog('split'); setMenu(null) }}><Settings size={20} /></IconButton>
          {menu === 'inboxes' && <div className="if-inbox-menu if-inbox-groups"><button onClick={() => patchWorkspace({ inboxIds: [] })}><span className="if-menu-check">{!workspace.inboxIds.length && <Check size={14} />}</span>{t('ui.144')}</button><hr />{Array.from({ length: creator.inboxCount }, (_, index) => index + 1).map((id) => <button key={id} onClick={() => patchWorkspace({ inboxIds: workspace.inboxIds.includes(id) ? workspace.inboxIds.filter((value) => value !== id) : [...workspace.inboxIds, id] })}><span className="if-menu-check">{workspace.inboxIds.includes(id) && <Check size={14} />}</span>{t('ui.147')} {id}<small>{availableFans.filter(fan => fan.inboxId === id).length}</small></button>)}</div>}
        </div><span className="if-sort-label">{workspace.sort === 'oldest' ? t('ui.148') : t('ui.149')}</span>
        <div className="if-more-anchor"><IconButton label={t('ui.150')} active={menu === 'more'} onClick={() => setMenu(menu === 'more' ? null : 'more')}><ListFilter size={18} /></IconButton>
          {menu === 'more' && <div className="if-inbox-menu if-more-menu" role="menu" aria-label={t('ui.150')}>
            {(['all', 'priority', 'unread', 'unread_tips', 'fan_last'] as const).map(value => <label key={value} className="if-filter-option"><input type="radio" name="inbox-extra-filter" checked={workspace.extraFilter === value} onChange={() => patchWorkspace({ extraFilter: value })}/><span>{{ all: t('ui.097'), priority: t('ui.099'), unread: t('ui.100'), unread_tips: t('ui.152'), fan_last: t('inbox.filter.fanLast') }[value]}</span></label>)}
            <hr />
            <label className="if-filter-option"><input type="radio" name="inbox-sort" checked={workspace.sort === 'newest'} onChange={() => patchWorkspace({ sort: 'newest' })}/><span>{t('ui.149')}</span></label>
            <label className="if-filter-focus"><span>{t('ui.154')}<small>{t('ui.155')}</small></span><input type="checkbox" role="switch" checked={workspace.focus} disabled={workspace.view !== 'all' || workspace.extraFilter !== 'all' || workspace.sort !== 'newest' || (workspace.aiFilter ?? 'include') !== 'include'} onChange={event => patchWorkspace({ focus: event.target.checked, focusOrder: visibleFans.map(fan => fan.id) })}/></label>
            <label className="if-filter-option"><input type="radio" name="inbox-sort" checked={workspace.sort === 'oldest'} onChange={() => patchWorkspace({ sort: 'oldest' })}/><span>{t('ui.148')}</span></label>
            <hr />
            <label className="if-filter-option"><input type="checkbox" checked={workspace.hideMuted} onChange={event => patchWorkspace({ hideMuted: event.target.checked })}/><span>{t('inbox.filter.hideMuted')}</span></label>
            <label className="if-filter-option"><input type="checkbox" checked={!!workspace.hideCreators} onChange={event => patchWorkspace({ hideCreators: event.target.checked })}/><span>{t('inbox.filter.hideCreators')}</span></label>
            {creator.autoChatEnabled && <><hr />{(['include', 'only', 'hide'] as const).map(value => <label key={value} className="if-filter-option"><input type="radio" name="inbox-ai-filter" checked={(workspace.aiFilter ?? 'include') === value} onChange={() => patchWorkspace({ aiFilter: value })}/><span>{{ include: t('ui.157'), only: t('ui.158'), hide: t('ui.159') }[value]}</span></label>)}</>}
            <hr />
            <button disabled={!visibleFans.some(fan => fan.unread)} onClick={() => { dispatch({ type: 'MARK_READ', creatorId, payload: { ids: visibleFans.map(fan => fan.id), unread: false } }); notify(t('ui.160')) }}>{t('ui.161')}</button>
            <hr />
            <button disabled={!admin} onClick={() => { setSelectMode(true); setSelectedIds([]); setMenu(null) }}>{t('ui.163')}</button>
          </div>}
        </div><IconButton label={t('ui.164')} disabled={refreshing} onClick={refreshList}><RefreshCw size={18} className={refreshing ? 'if-spinning' : ''} /></IconButton>
      </div>
      <div className="if-inbox-tabs" aria-label={t('ui.165')}>{baseViews.filter((view) => view.show).map((view) => <button key={view.id} className={workspace.view === view.id ? 'is-active' : ''} aria-pressed={workspace.view === view.id} onClick={() => changeView(view.id)}>{view.label}{view.count > 0 && <b title={t('ui.166', [view.count])}>{view.count}</b>}</button>)}{creator.lists.filter((list) => list.pinned).map((list) => <button key={list.id} className={workspace.view === `list:${list.id}` ? 'is-active' : ''} aria-pressed={workspace.view === `list:${list.id}`} onClick={() => changeView(`list:${list.id}`)}>{displaySample(list.name)}</button>)}<button className="if-edit-lists" title={t('ui.167')} aria-label={t('ui.168')} onClick={() => { setNewListName(''); setDialog('pinnedLists') }}><Pencil size={15} /></button></div>
      {workspace.heldFanIds.length > 0 && <button className="if-new-conversations" onClick={() => { dispatch({ type: 'FLUSH_FOCUS', creatorId }); notify(t('ui.169')) }}>{workspace.heldFanIds.length} {t('ui.170')} <RefreshCw size={13} /></button>}
      {(workspace.search || workspace.extraFilter !== 'all' || workspace.inboxIds.length > 0 || (workspace.aiFilter && workspace.aiFilter !== 'include')) && <div className="if-inbox-result-summary"><span>{visibleFans.length} {t('ui.171')}</span><button onClick={() => patchWorkspace({ search: '', extraFilter: 'all', inboxIds: [], aiFilter: 'include' })}>{t('ui.172')}</button></div>}
    </div>
    <div className="if-inbox-list" ref={listRef} onScroll={(event) => { if (restoredCreator.current === creatorId) patchWorkspace({ listScroll: event.currentTarget.scrollTop }) }}>
      {visibleFans.length === 0 ? <div className="if-inbox-empty"><MessageSquare size={27} /><strong>{availableFans.length ? t('ui.173') : t('ui.174')}</strong><span>{availableFans.length ? t('ui.175') : t('ui.176')}</span>{availableFans.length > 0 && <button className="if-text-button" onClick={() => { patchWorkspace({ search: '', view: 'all', extraFilter: 'all', inboxIds: [], aiFilter: 'include' }); setSearchOpen(false) }}>{t('ui.177')}</button>}</div>
        : visibleFans.map((fan) => {
          const messages = messagesFor(state, creatorId, fan.id)
          const latest = latestMessage(messages)
          const metrics = fanMetrics(state, creatorId, fan.id)
          const signals = fanSignals(state, creatorId, fan.id, now)
          const pendingTasks = state.tasks.filter((task) => task.creatorId === creatorId && task.fanId === fan.id && task.status === 'pending')
          return <div key={fan.id} className={`if-conversation-row ${workspace.activeFanId === fan.id && !selectMode ? 'is-selected' : ''} ${fan.unread ? 'is-unread' : ''} ${fan.priority ? 'is-priority' : ''} ${fan.muted || fan.blocked || fan.restricted ? 'is-muted' : ''}`} onContextMenu={(event) => showContext(event, fan)}>
            {selectMode && <input type="checkbox" className="if-row-checkbox" aria-label={t('ui.178', [displayName(fan)])} checked={selectedIds.includes(fan.id)} onChange={() => toggleSelection(fan.id)} />}
            <button className="if-conversation-main" onFocus={event => { const anchor = event.currentTarget.querySelector<HTMLElement>('.if-status-avatar'); if (anchor && signals.length) setSignalTooltip({ fanId: fan.id, anchor }) }} onBlur={() => setSignalTooltip(null)} aria-describedby={signalTooltip?.fanId === fan.id ? `if-fan-signals-${creatorId}-${fan.id}` : undefined} onClick={() => selectMode ? toggleSelection(fan.id) : openFan(fan.id, false)} aria-label={selectMode ? t('ui.178', [displayName(fan)]) : t('ui.199', [displayName(fan)])}>
              <div className="if-row-avatar"><span className={`if-status-avatar if-status-avatar-${signals[0] ?? 'default'}`} aria-label={signals.length ? signals.map(signalDescription).join(' · ') : t('ui.180')} onMouseEnter={event => { if (signals.length) setSignalTooltip({ fanId: fan.id, anchor: event.currentTarget }) }} onMouseLeave={() => setSignalTooltip(null)}>{signals[0] === 'Expired' ? <X size={26} strokeWidth={3.5}/> : signals[0] === 'New' ? <b>{t('fanSignal.new')}</b> : signals[0] === 'Off' ? <b>{t('fanSignal.off')}</b> : signals[0] === 'PPV' ? <Flame size={24}/> : signals[0] === '72h' ? <Snowflake size={23}/> : <UserRound size={24}/>} {fan.online&&<i aria-label={t('ui.183')}/>}</span><small title={money(metrics.spent)}>{money(metrics.spent).replace(/\.00$/, '')}</small></div>
              <div className="if-row-copy"><div className="if-row-meta">{creator.splitEnabled && <span className="if-row-group"><Inbox size={11}/>{fan.inboxId}</span>}{(fan.aiStatus || fan.aiAssigned) && <span className={`if-row-ai if-row-ai-${fan.aiStatus ?? 'active'}`}><Bot size={12}/>{t(`fanLabel.ai.${fan.aiStatus ?? 'active'}`)}</span>}</div><div className="if-row-name"><strong>{displayName(fan)}{fan.verified && <BadgeCheck size={13} className="if-row-verified"/>}</strong><span>{fan.handle}</span></div>
                <div className="if-row-signals">{signals.map((signal) => <span key={signal} className={signal === 'Expired' ? 'if-signal-expired' : signal === 'New' ? 'if-signal-new' : signal === 'Off' ? 'if-signal-off' : signal === 'PPV' ? 'if-signal-hot' : ''} title={signalDescription(signal)}>{signal === 'Expired' ? <X size={12} strokeWidth={3}/> : signal === 'PPV' ? <Flame size={12}/> : signal === '72h' ? <Snowflake size={12}/> : signalLabels()[signal]}</span>)}{pendingTasks.length > 0 && <small className="if-timer-label"><Clock3 size={11} />{Math.max(0, Math.ceil((Math.min(...pendingTasks.map((task) => task.dueAt)) - now) / 60_000))} {t('ui.189')}</small>}</div>
                <div className="if-row-preview"><span>{previewFor(fan, messages)}</span><time>{latest ? conversationTime(latest.createdAt, now) : '—'}</time>{fan.unread && <i className="if-unread-dot" aria-label={t('ui.100')} />}{fan.muted && <BellOff size={12} aria-label={t('ui.190')} />}</div>
              </div>
            </button>{!selectMode && admin && <button className="if-clear-conversation" title={t('ui.191')} aria-label={t('ui.192', [displayName(fan)])} onClick={(event) => { event.stopPropagation(); setConfirmation({ kind: 'clear', fanIds: [fan.id] }) }}><X size={14} /></button>}
          </div>
        })}
    </div>

    {signalTooltip && <Tooltip id={`if-fan-signals-${creatorId}-${signalTooltip.fanId}`} anchor={signalTooltip.anchor}>{fanSignals(state, creatorId, signalTooltip.fanId, now).map(signal => <div key={signal}><span className={`if-tooltip-signal if-tooltip-signal-${signal}`}>{signal === 'Expired' ? <X size={14} /> : signal === 'PPV' ? <Flame size={14} /> : signal === '72h' ? <Snowflake size={14} /> : signalLabels()[signal]}</span><span>{signalDescription(signal)}</span></div>)}</Tooltip>}
    {context && <div className="if-inbox-menu if-context-menu" style={{ left: context.x, top: context.y }} onClick={(event) => event.stopPropagation()}><button onClick={() => { setContext(null); notify(t('inboxCompletion.chatNavigation', [allFans.find(fan => fan.id === context.fanId)?.name ?? context.fanId])) }}>{t('interface.009')} <ArrowUpRight size={13} /></button><button onClick={() => openListMembership(context.fanId)}>{t('interface.extra.01')}</button><button onClick={() => { const recipient = allFans.find((fan) => fan.id === context.fanId); dispatch({ type: 'MARK_READ', creatorId, payload: { ids: [context.fanId], unread: !recipient?.unread } }); setContext(null) }}>{t('interface.extra.02')} {allFans.find((fan) => fan.id === context.fanId)?.unread ? t('interface.action.markRead') : t('interface.action.markUnread')}</button>{creator.splitEnabled && <button title={!admin ? permissionHint : undefined} disabled={!admin} onClick={() => openMoveInbox(context.fanId)}>{t('interface.extra.03')}</button>}<hr /><button onClick={() => { dispatch({ type: 'HIDE_FAN', creatorId, fanId: context.fanId }); setContext(null); notify(t('ui.193')) }}>{t('interface.087')}</button>{admin && <button className="if-danger-text" onClick={() => { setConfirmation({ kind: 'clear', fanIds: [context.fanId] }); setContext(null) }}>{t('interface.extra.04')}</button>}</div>}

    {dialog === 'online' && <OnlineFansDialog filters={onlineAudience} onChange={audience => patchWorkspace({ onlineAudience: audience })} onClose={() => setDialog(null)} onOpenFan={openFan} onMessageAll={ids => openCampaign(ids, t('ui.196'), 'smart', emptyDraft(), onlineAudience)} />}

    {notificationAnchor && <NotificationsPopover anchor={notificationAnchor} onClose={() => setNotificationAnchor(null)} replies={replies} onReplyChange={(id, text) => setReplies(current => ({ ...current, [id]: text }))}/>}

    {dialog === 'split' && <AnchoredPopover title={t('interface.112')} anchor={splitAnchor} onClose={() => { setDialog(null); setSplitAnchor(null) }} width={270} placement="bottom" className="if-split-popover"><label className="if-split-option"><span>{t('interface.113')}</span><input type="checkbox" role="switch" checked={splitEnabled} onChange={(event) => setSplitEnabled(event.target.checked)} /></label><label className="if-split-option if-split-count"><span>{t('interface.114')}</span><input type="number" aria-label={t('interface.114')} min={2} max={9} step={1} disabled={!splitEnabled} value={splitCount} onChange={(event) => setSplitCount(Math.min(9, Math.max(2, Math.round(Number(event.target.value) || 2))))} /></label><p className="if-split-hint">{t('ui.208')}</p><div className="if-split-actions"><button className="if-split-save" disabled={!admin || (splitEnabled === creator.splitEnabled && splitCount === creator.inboxCount)} onClick={() => { dispatch({ type: 'SPLIT_INBOX', creatorId, payload: { enabled: splitEnabled, count: splitCount } }); setDialog(null); setSplitAnchor(null); notify(splitEnabled ? t('ui.117', [splitCount]) : t('ui.118')) }}>{t('interface.073')}</button><button className="if-split-cancel" onClick={() => { setDialog(null); setSplitAnchor(null) }}>{t('interface.072')}</button></div></AnchoredPopover>}

    {dialog === 'pinnedLists' && <Modal title={t('inboxCompletion.managePinnedLists')} width={560} maskClosable={false} onClose={() => setDialog(null)} className="if-message-pro-dialog if-pinned-lists-modal"><div className="if-message-pro-content if-pinned-lists-content"><div className="if-pinned-lists-toolbar"><strong>{t('inboxCompletion.myLists')}</strong><button className="if-message-pro-primary" disabled={!admin} onClick={() => { setNewListName(''); setPinnedNewListOpen(true) }}><Plus size={16}/>{t('popup.newList')}</button><IconButton label={t('popup.refreshLists')} onClick={() => { dispatch({ type: 'TICK', payload: Date.now() + state.clockOffset }); notify(t('popup.listsSynced')) }}><RefreshCw size={18}/></IconButton></div><div className="if-pinned-lists">{creator.lists.map(list => <label className="if-list-option" key={list.id}><input type="checkbox" checked={list.pinned} onChange={event => dispatch({ type: 'PIN_LIST', creatorId, payload: { listId: list.id, pinned: event.target.checked } })}/><span>{displaySample(list.name)}<small>{t('popup.listEntries', [availableFans.filter(fan => fan.listIds.includes(list.id)).length])}</small></span></label>)}{!creator.lists.length && <div className="if-dialog-empty">{t('ui.211')}</div>}</div></div></Modal>}
    {dialog === 'pinnedLists' && pinnedNewListOpen && <Modal title={t('popup.newList')} width={480} maskClosable={false} onClose={() => setPinnedNewListOpen(false)} className="if-message-pro-dialog"><form onSubmit={event => { event.preventDefault(); if (!admin || !newListName.trim()) return; if (creator.lists.some(list => displaySample(list.name).toLowerCase() === newListName.trim().toLowerCase())) { notify(t('ui.212')); return }; dispatch({ type: 'ADD_LIST', creatorId, payload: { name: newListName.trim() } }); setNewListName(''); setPinnedNewListOpen(false); notify(t('ui.213')) }}><div className="if-message-pro-content"><label className="if-message-pro-field">{t('interface.117')}<input autoFocus required maxLength={36} value={newListName} onChange={event => setNewListName(event.target.value)}/></label></div><div className="if-message-pro-footer"><button type="button" className="if-message-pro-secondary" onClick={() => setPinnedNewListOpen(false)}>{t('interface.072')}</button><button className="if-message-pro-primary" disabled={!admin || !newListName.trim()}>{t('popup.add')}</button></div></form></Modal>}


    {dialog === 'fanLists' && targetFan && <FanListsDialog creatorId={creatorId} fanId={targetFan.id} onClose={() => setDialog(null)} />}

    {dialog === 'moveInbox' && targetFan && <Modal title={t('interface.extra.03')} onClose={() => setDialog(null)} width={480} maskClosable={false} className="if-message-pro-dialog"><div className="if-message-pro-content"><p className="if-message-pro-description">{displayName(targetFan)} {t('ui.216')} {targetFan.inboxId}</p><label className="if-message-pro-field">{t('interface.extra.11')}<SelectField label={t('interface.extra.11')} value={String(moveInboxId)} options={Array.from({ length: creator.inboxCount }, (_, index) => ({ value: String(index + 1), label: `${t('interface.212')} ${index + 1} ${t('interface.extra.12')} ${creator.inboxCount}` }))} onChange={value => setMoveInboxId(Number(value))} /></label></div><div className="if-message-pro-footer"><button className="if-message-pro-secondary" onClick={() => setDialog(null)}>{t('interface.072')}</button><button className="if-message-pro-primary" disabled={!admin || moveInboxId === targetFan.inboxId} onClick={() => { dispatch({ type: 'MOVE_INBOX', creatorId, payload: { fanIds: [targetFan.id], inboxId: moveInboxId } }); setDialog(null); notify(t('ui.217', [moveInboxId])) }}>{t('interface.353')}</button></div></Modal>}

    {dialog === 'campaign' && <Modal title={t(editor.audience ? 'audience.messageOnline' : 'interface.118')} onClose={() => setDialog(null)} maskClosable={false} width={800} className="if-campaign-modal"><div className="if-inbox-dialog if-campaign-editor"><div className="if-campaign-content">{!editor.audience && <div className="if-dialog-tabs">{(Object.keys(campaignNames()) as Campaign['type'][]).map((type) => <button key={type} className={editor.type === type ? 'is-active' : ''} onClick={() => setEditor((current) => ({ ...current, type, scheduled: type === 'auto' ? true : current.scheduled }))}>{campaignNames()[type]}</button>)}</div>}<label className="if-field">{t('interface.119')}<input aria-label={t('ui.218')} maxLength={80} value={editor.title} onChange={(event) => setEditor((current) => ({ ...current, title: event.target.value }))} placeholder={t('ui.219')} /></label>{editor.audience && <OnlineAudienceFields value={editor.audience} lists={creator.lists} onChange={updateEditorAudience}/>}
      <div className="if-campaign-audience"><div className="if-audience-heading"><strong>{t('interface.extra.13')} {campaignFanIds.length} {t('interface.121')}</strong><div><button className="if-text-button" onClick={() => setEditor(current => ({ ...current, fanIds: campaignFans.map(fan => fan.id) }))}>{t('ui.132')}</button><button className="if-text-button" onClick={() => setEditor(current => ({ ...current, fanIds: [] }))}>{t('ui.221')}</button></div></div><div className="if-recipient-search"><Search size={14}/><input aria-label={t('ui.222')} value={recipientSearch} onChange={event => setRecipientSearch(event.target.value)} placeholder={t('interface.122')}/>{!editor.audience && <SelectField label={t('ui.223')} value="" width={240} searchable options={[{ value: '', label: t('interface.123') }, ...creator.lists.map(list => ({ value: list.id, label: displaySample(list.name) }))]} onChange={listId => { if (listId) setEditor(current => ({ ...current, fanIds: campaignFans.filter(fan => fan.listIds.includes(listId)).map(fan => fan.id) })) }} />}</div><div className="if-recipient-grid">{recipientMatches.map(recipient => <label key={recipient.id} className={campaignFanIds.includes(recipient.id) ? 'is-selected' : ''}><input type="checkbox" checked={campaignFanIds.includes(recipient.id)} disabled={recipient.blocked || recipient.restricted} onChange={event => setEditor(current => ({ ...current, fanIds: event.target.checked ? [...new Set([...current.fanIds, recipient.id])] : current.fanIds.filter(id => id !== recipient.id) }))}/><span>{displayName(recipient)}</span></label>)}</div>{!recipientMatches.length && <p className="if-audience-empty">{t('audience.empty')}</p>}</div><label className="if-field">{t('interface.124')}<textarea aria-label={t('ui.225')} rows={4} maxLength={6500} value={editor.draft.text} onChange={(event) => updateEditorDraft({ text: event.target.value })} placeholder={t('ui.226')} /></label><div className="if-campaign-options"><label>{t('interface.125')}<SelectField label={t('ui.227')} value="" width={280} searchable options={[{ value: '', label: t('interface.126') }, ...state.scripts.map(script => ({ value: script.id, label: displayScriptTitle(script.title) }))]} onChange={id => { const script = state.scripts.find(item => item.id === id); if (script) updateEditorDraft({ text: displaySample(script.text), attachments: [...script.attachments], price: script.price, lockedText: script.price > 0, creatorTags: [...script.creatorTags], releaseFormIds: [...(script.releaseFormIds ?? [])], scriptId: script.id }) }} /></label><label>{t('interface.127')}<div className="if-number-with-prefix"><span>$</span><input aria-label={t('ui.228')} type="number" min={0} max={200} step={1} value={editor.draft.price} onChange={(event) => updateEditorDraft({ price: Math.max(0, Math.min(200, Number(event.target.value) || 0)) })} /></div></label><label className="if-checkbox-label"><input type="checkbox" checked={editor.draft.lockedText} onChange={(event) => updateEditorDraft({ lockedText: event.target.checked })} />{t('interface.128')}</label></div><div className="if-campaign-media"><div className="if-campaign-section-heading"><strong>{t('interface.129')} · {editor.draft.attachments.length} / 40</strong><button className="if-secondary-button" disabled={editor.draft.attachments.length >= 40} onClick={() => { setCampaignVaultIds([]); setCampaignVaultOpen(true) }}><Plus size={15}/>{t('popup.vault')}</button></div>{!!editor.draft.attachments.length && <div className="if-campaign-selected-media">{editor.draft.attachments.map(attachment => { const media = state.media.find(item => item.id === attachment.mediaId); return <article key={attachment.mediaId}><span>{media ? displaySample(media.title) : t('ui.396')}<small>{media ? mediaTypeLabel(media.type) : '—'}</small></span>{editor.draft.price > 0 && <label><input type="checkbox" checked={attachment.free} onChange={event => updateEditorDraft({ attachments: editor.draft.attachments.map(item => item.mediaId === attachment.mediaId ? { ...item, free: event.target.checked } : item) })}/>{t('inboxCompletion.freePreview')}</label>}<IconButton label={t('inboxCompletion.removeMedia', [media ? displaySample(media.title) : attachment.mediaId])} onClick={() => updateEditorDraft({ attachments: editor.draft.attachments.filter(item => item.mediaId !== attachment.mediaId) })}><X size={15}/></IconButton></article> })}</div>}</div><div className="if-campaign-tags"><button className="if-secondary-button" onClick={() => setCampaignTagsOpen(true)}>{t('interface.263')}{editor.draft.creatorTags.length + (editor.draft.releaseFormIds?.length ?? 0) ? ` · ${editor.draft.creatorTags.length + (editor.draft.releaseFormIds?.length ?? 0)}` : ''}</button>{!!(editor.draft.creatorTags.length || editor.draft.releaseFormIds?.length) && <button className="if-text-button" onClick={() => updateEditorDraft({ creatorTags: [], releaseFormIds: [] })}>{t('popup.clear')}</button>}</div><div className="if-campaign-schedule"><label className="if-checkbox-label"><input type="checkbox" checked={editor.scheduled} onChange={(event) => setEditor((current) => ({ ...current, scheduled: event.target.checked }))} />{editor.type === 'auto' ? t('ui.229') : t('interface.130')}</label>{editor.scheduled && <div className="if-campaign-schedule-fields" aria-label={t('ui.230')}><DateField label={t('chat.complete.date')} value={editor.scheduledAt.slice(0, 10)} onChange={value => setEditor(current => ({ ...current, scheduledAt: `${value}T${current.scheduledAt.slice(11, 16) || '12:00'}` }))}/><SelectField label={t('chat.complete.hour')} width={100} value={editor.scheduledAt.slice(11, 13) || '12'} options={Array.from({ length: 24 }, (_, index) => ({ value: String(index).padStart(2, '0'), label: String(index).padStart(2, '0') }))} onChange={value => setEditor(current => ({ ...current, scheduledAt: `${current.scheduledAt.slice(0, 10)}T${value}:${current.scheduledAt.slice(14, 16) || '00'}` }))}/><span>:</span><SelectField label={t('chat.complete.minute')} width={100} value={editor.scheduledAt.slice(14, 16) || '00'} options={Array.from({ length: 60 }, (_, index) => ({ value: String(index).padStart(2, '0'), label: String(index).padStart(2, '0') }))} onChange={value => setEditor(current => ({ ...current, scheduledAt: `${current.scheduledAt.slice(0, 10)}T${current.scheduledAt.slice(11, 13) || '12'}:${value}` }))}/></div>}</div>{editor.type === 'auto' && <p className="if-inline-note">{t('ui.231')}</p>}</div><div className="if-dialog-actions"><button className="if-secondary-button" onClick={() => saveCampaign(true)} disabled={!admin}>{t('interface.131')}</button><button className="if-primary-button" onClick={() => saveCampaign(false)} disabled={!admin || !campaignFanIds.length || (!editor.draft.text.trim() && !editor.draft.attachments.length)}>{editor.scheduled ? t('interface.132') : t('interface.019')} {t('interface.extra.14')} {campaignFanIds.length} {t('interface.121')}</button></div></div></Modal>}

    {dialog === 'campaign' && campaignVaultOpen && <Modal title={t('popup.vault')} width={1100} header={false} maskClosable={false} onClose={() => setCampaignVaultOpen(false)} className="if-vault-modal"><ChatMediaPicker media={state.media.filter(item => !editor.draft.attachments.some(attachment => attachment.mediaId === item.id))} messages={campaignFanIds.flatMap(id => messagesFor(state, creatorId, id))} selectedIds={campaignVaultIds} onSelect={selectCampaignMedia}/>{campaignVaultIds.length > 0 && <div className="if-vault-selection-bar"><button aria-label={t('popup.clear')} disabled={!campaignVaultIds.length} onClick={() => setCampaignVaultIds([])}><Trash2 size={17}/></button><span>{t('popup.chosen', [campaignVaultIds.length, 40 - editor.draft.attachments.length])}</span><button className="if-primary" disabled={!campaignVaultIds.length} onClick={() => { updateEditorDraft({ attachments: [...editor.draft.attachments, ...campaignVaultIds.map(mediaId => ({ mediaId, free: false }))] }); setCampaignVaultOpen(false); setCampaignVaultIds([]) }}>{t('popup.add')}</button></div>}<footer className="if-vault-modal-footer"><button className="if-secondary" onClick={() => setCampaignVaultOpen(false)}>{t('popup.close')}</button></footer></Modal>}
    {dialog === 'campaign' && campaignTagsOpen && <CreatorTagsDialog creators={state.creators} selectedIds={editor.draft.creatorTags} releaseForms={(state.releaseForms ?? []).filter(form => !form.creatorId || form.creatorId === creatorId)} selectedReleaseFormIds={editor.draft.releaseFormIds ?? []} onClose={() => setCampaignTagsOpen(false)} onAdd={(ids, releaseFormIds) => { updateEditorDraft({ creatorTags: ids, releaseFormIds }); setCampaignTagsOpen(false) }}/>}

    {dialog === 'reports' && <Modal title={detailCampaign ? detailCampaign.title : t('interface.133')} onClose={() => setDialog(null)} wide><div className="if-inbox-dialog if-campaign-reports">{detailCampaign ? <><button className="if-text-button if-report-back" onClick={() => setReportCampaignId(null)}>{t('ui.232')}</button><div className="if-report-detail-header"><span>{campaignNames()[detailCampaign.type]}</span><span>{dateLabel(detailCampaign.createdAt)}</span><span className="if-status-pill">{{ draft: t('interface.134'), scheduled: t('interface.135'), sent: t('interface.136'), cancelled: t('interface.137') }[detailCampaign.status]}</span></div><p className="if-campaign-caption">{detailCampaign.draft.text || t('interface.extra.mediaAttachment')}</p><div className="if-report-table-wrap"><table className="if-report-table"><thead><tr><th>{t('interface.138')}</th><th>{t('interface.139')}</th><th>{t('interface.140')}</th><th>{t('interface.059')}</th><th>{t('ui.233')}</th></tr></thead><tbody>{detailCampaign.fanIds.map((id) => { const recipient = allFans.find((fan) => fan.id === id); const message = campaignSummary(detailCampaign).messages.find((item) => item.fanId === id); return <tr key={id}><td>{recipient ? displayName(recipient) : id}</td><td>{message ? messageStatusLabel(message.status) : detailCampaign.status === 'cancelled' ? t('interface.report.status.cancelled') : detailCampaign.status === 'scheduled' ? t('interface.report.status.scheduled') : detailCampaign.status === 'sent' ? recipient?.cleared ? t('interface.report.status.cleared') : t('interface.report.status.skipped') : t('interface.report.status.draft')}</td><td>{message?.viewed || message?.status === 'read' ? t('interface.141') : '—'}</td><td>{message?.purchasedAt ? money(message.price) : '—'}</td><td>{message?.status === 'failed' && <button className="if-text-button" onClick={() => { dispatch({ type: 'RETRY', creatorId, fanId: id, messageId: message.id }); notify(state.simulateFailure ? t('ui.234') : t('ui.235')) }}>{t('interface.142')}</button>}{recipient && <button className="if-text-button" onClick={() => openFan(id)}>{t('interface.143')}</button>}</td></tr> })}</tbody></table></div></> : <><div className="if-dialog-tabs">{(Object.keys(campaignNames()) as Campaign['type'][]).map((type) => <button key={type} className={reportType === type ? 'is-active' : ''} onClick={() => setReportType(type)}>{campaignNames()[type]}</button>)}</div><div className="if-report-overview"><div><small>{t('interface.144')}</small><strong>{reportCampaigns.length}</strong></div><div><small>{t('interface.136')}</small><strong>{reportCampaigns.reduce((total, campaign) => total + campaignSummary(campaign).sent, 0)}</strong></div><div><small>{t('interface.059')}</small><strong>{reportCampaigns.reduce((total, campaign) => total + campaignSummary(campaign).purchased, 0)}</strong></div><div><small>{t('interface.145')}</small><strong>{money(reportCampaigns.reduce((total, campaign) => total + campaignSummary(campaign).revenue, 0))}</strong></div></div><p className="if-inline-note">{t('ui.236')}</p><div className="if-report-table-wrap"><table className="if-report-table"><thead><tr><th>{t('interface.extra.15')}</th><th>{t('interface.extra.16')}</th><th>{t('interface.extra.17')}</th><th>{t('interface.extra.18')}</th><th>{t('interface.extra.19')}</th><th>{t('interface.139')}</th><th>{t('ui.233')}</th></tr></thead><tbody>{reportCampaigns.map((campaign) => { const summary = campaignSummary(campaign); const canWithdraw = summary.messages.filter((message) => canWithdrawMessage(message, now)); return <tr key={campaign.id}><td><strong>{campaign.title}</strong><small>{dateLabel(campaign.createdAt)}</small></td><td>{campaign.fanIds.length}</td><td>{money(campaign.draft.price)}</td><td>{summary.sent} / {summary.failed + summary.skipped}</td><td>{summary.viewed} / {summary.purchased}</td><td><span className="if-status-pill">{{ draft: t('interface.134'), scheduled: t('interface.135'), sent: t('interface.136'), cancelled: t('interface.137') }[campaign.status]}</span>{campaign.scheduledAt && campaign.status === 'scheduled' && <small>{dateLabel(campaign.scheduledAt)}</small>}</td><td><button className="if-text-button" onClick={() => setReportCampaignId(campaign.id)}>{t('interface.146')}</button>{(campaign.status === 'draft' || campaign.status === 'cancelled') && <button className="if-text-button" onClick={() => openCampaign(campaign.fanIds, t('ui.237', [campaign.title]), campaign.type, campaign.draft, campaign.audience)}>{t('interface.147')}</button>}{(campaign.status === 'scheduled' || campaign.status === 'draft') && <button className="if-text-button if-danger-text" onClick={() => { dispatch({ type: 'CANCEL_CAMPAIGN', creatorId, payload: campaign.id }); notify(t('ui.238')) }}>{t('interface.072')}</button>}{canWithdraw.length > 0 && <button className="if-text-button if-danger-text" onClick={() => setConfirmation({ kind: 'withdraw', messageIds: canWithdraw.map((message) => message.id) })}>{t('interface.extra.20')}</button>}</td></tr> })}</tbody></table>{!reportCampaigns.length && <div className="if-dialog-empty">{t('ui.239')}</div>}</div><div className="if-dialog-actions"><button className="if-primary-button" onClick={() => openCampaign(visibleFans.map((fan) => fan.id), '', reportType)}>{t('interface.149')}</button></div></>}</div></Modal>}

    {confirmation && <Modal maskClosable={false} title={confirmation.kind === 'clear' ? confirmation.fanIds.length > 1 ? t('interface.150') : t('interface.151') : t('interface.154')} onClose={() => setConfirmation(null)} className="if-message-pro-dialog"><div className="if-message-pro-content"><p className="if-message-pro-description">{confirmation.kind === 'clear' ? t('ui.240', [confirmation.fanIds.length]) : t('ui.244', [confirmation.messageIds.length])}</p></div><div className="if-message-pro-footer"><button className="if-message-pro-secondary" onClick={() => setConfirmation(null)}>{t('interface.072')}</button><button className={confirmation.kind === 'clear' ? 'if-message-pro-danger' : 'if-message-pro-primary'} onClick={confirmOperation} disabled={!admin}>{confirmation.kind === 'clear' ? t('interface.155') : t('interface.156')}</button></div></Modal>}
  </aside>
}
