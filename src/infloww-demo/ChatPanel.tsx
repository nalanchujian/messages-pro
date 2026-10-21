import { countryLabel, displaySample, displayScriptTitle, getLocale, sourceLabel, subscriptionStatusLabel, t } from './i18n'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, BadgeCheck, Star, Bell, BellOff, NotebookPen, Pin, Images, Search, ExternalLink, RefreshCw, MoreVertical, Pencil, X, Smile, Settings2, AlarmClock, Paperclip, Clapperboard, CalendarClock, Tag, AtSign, Type, Languages, Send, Trash2, Lock, Unlock, Heart, Reply, Copy, Forward, BookOpen, Flag, ShieldBan, EyeOff, UserRound, ChevronDown, ChevronUp, Clock, Loader2, Plus, FolderClosed, CalendarCheck, BadgeDollarSign, CirclePause, CircleHelp, Mic, Sparkles, MessageSquare } from 'lucide-react'
import type { Draft, Media, Message, Script } from './types'
import { emptyDraft } from './types'
import { useDemo, canWithdrawMessage, messagesFor, money, relativeTime, displayName } from './store'
import { Modal, AnchoredPopover, IconButton, Avatar, MediaView } from './ui'
import { saveMedia } from './mediaStorage'
import ChatMediaPicker from './ChatMediaPicker'
import EmojiPicker from './EmojiPicker'
import ScriptLibrary from './ScriptLibrary'
import TimedMessageDialog from './TimedMessageDialog'
import VoiceEmotionDialog from './VoiceEmotionDialog'
import MessagePriceDialog from './MessagePriceDialog'
import ScheduleMessageDialog from './ScheduleMessageDialog'
import GifStrip from './GifStrip'
import ChatAttachments from './ChatAttachments'
import { chatMediaAccess, sameMessageGroup } from './chatPresentation'
import MediaPreviewDialog from './MediaPreviewDialog'
import FanListsDialog from './FanListsDialog'
import CreatorTagsDialog from './CreatorTagsDialog'
import { SelectField } from './ProfileFields'
import { fillScript, sampleSeli, sampleTranslation } from './chatTools'
import './chat.css'
import './popups.css'

type Dialog = 'profile' | 'rename' | 'lists' | 'notes' | 'gallery' | 'pinned' | 'more' | 'discount' | 'report' | 'emoji' | 'scripts' | 'script-preview' | 'timer' | 'timed-message' | 'vault' | 'schedule' | 'price' | 'tags' | 'translate' | 'forward' | 'confirm-hide' | 'confirm-block' | 'confirm-restrict' | 'copy' | null
const titles = (): Record<Exclude<Dialog, null>, string> => ({ profile: t('interface.255'), rename: t('interface.017'), lists: t('interface.085'), notes: t('interface.013'), gallery: t('interface.256'), pinned: t('interface.extra.pinnedMessages'), more: t('interface.083'), discount: t('interface.086'), report: t('interface.257'), emoji: t('interface.258'), scripts: t('interface.031'), 'script-preview': t('popup.scriptPreview'), timer: t('popup.countdown'), 'timed-message': t('popup.timedMessage'), vault: t('interface.260'), schedule: t('interface.262'), price: t('interface.024'), tags: t('interface.263'), translate: t('interface.264'), forward: t('interface.265'), 'confirm-hide': t('interface.095'), 'confirm-block': t('interface.096'), 'confirm-restrict': t('interface.097'), copy: t('interface.266') })

export default function ChatPanel() {
  const { state, dispatch, creator, fan, workspace, draft, now, notify } = useDemo()
  const cid = creator.id
  const fid = fan?.id
  const messages = useMemo(() => fid ? messagesFor(state, cid, fid) : [], [state.messages, cid, fid])
  const fans = state.fans[cid] || []
  const pendingTasks = state.tasks.filter(task => task.creatorId === cid && task.fanId === fid && task.status === 'pending')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [field, setField] = useState('')
  const [gifOpen, setGifOpen] = useState(false)
  const [emojiPicker, setEmojiPicker] = useState(false)
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null)
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null)
  const [favoriteEmojis, setFavoriteEmojis] = useState<string[]>([])
  const [draggedEmoji, setDraggedEmoji] = useState<number | null>(null)
  const [vaultOpen, setVaultOpen] = useState(false)
  const [vaultSelection, setVaultSelection] = useState<string[]>([])
  const [mediaTarget, setMediaTarget] = useState<'draft' | 'preview'>('draft')
  const [previewDraft, setPreviewDraft] = useState<Draft>(emptyDraft)
  const [tagContext, setTagContext] = useState<{ target: 'draft' | 'preview' | 'message'; messageId?: string } | null>(null)
  const [findOpen, setFindOpen] = useState(false)
  const [find, setFind] = useState('')
  const [findIndex, setFindIndex] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [galleryFilter, setGalleryFilter] = useState('all')
  const [mediaPreview, setMediaPreview] = useState<{ media: Media[]; initialIndex: number } | null>(null)
  const [showFormat, setShowFormat] = useState(false)
  const [formatColorAnchor, setFormatColorAnchor] = useState<HTMLElement | null>(null)
  const [messageMenu, setMessageMenu] = useState<string | null>(null)
  const [messageMenuPosition, setMessageMenuPosition] = useState({ left: 0, top: 0 })
  const [translations, setTranslations] = useState<Record<string, boolean>>({})
  const [targetLanguage, setTargetLanguage] = useState<'en' | 'zh'>('zh')
  const [translatedDraft, setTranslatedDraft] = useState('')
  const [translationNote, setTranslationNote] = useState('')
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [seliAnchor, setSeliAnchor] = useState<HTMLElement | null>(null)
  const [seliRevision, setSeliRevision] = useState(0)
  const [showJump, setShowJump] = useState(false)
  const [aiType, setAiType] = useState<string | null>(null)
  const [aiHelp, setAiHelp] = useState(false)
  const [discount, setDiscount] = useState(20)
  const [reportReason, setReportReason] = useState('interface.344')
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null)
  const [campaignTitle, setCampaignTitle] = useState(t('ui.247'))
  const [recipientIds, setRecipientIds] = useState<string[]>([])
  const [forwardText, setForwardText] = useState('')
  const [forwardPrice, setForwardPrice] = useState(0)
  const [recipientQuery, setRecipientQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const threadContentRef = useRef<HTMLDivElement>(null)
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestState = useRef(state)
  latestState.current = state
  const atBottom = useRef(true)
  const findMatches = find.trim() ? messages.filter(message => message.status !== 'withdrawn' && displaySample(message.text).toLowerCase().includes(find.trim().toLowerCase())) : []
  const slashQuery = draft.text.startsWith('/') ? draft.text.slice(1).trim() : null
  const forwardFans = fans.filter(item => !item.cleared && `${item.name} ${item.handle}`.toLowerCase().includes(recipientQuery.trim().toLowerCase()))
  const forwardSelectable = forwardFans.filter(item => !item.blocked && !item.restricted && (item.subscriptionStatus !== 'expired' || item.creatorSubscribed))
  const gifSelected = draft.attachments.some(attachment => state.media.find(media => media.id === attachment.mediaId)?.type === 'gif')
  const subscribeRequired = fan?.subscriptionStatus === 'expired' && !fan.creatorSubscribed
  const previewUnavailable = !fan || fan.blocked || fan.restricted || subscribeRequired || (!previewDraft.text.trim() && !previewDraft.attachments.length) || (previewDraft.price > 0 && (previewDraft.price < 3 || previewDraft.price > 200 || (!previewDraft.lockedText && !previewDraft.attachments.some(item => !item.free))))
  const sendUnavailable = !fan || fan.blocked || fan.restricted || fan.cleared || subscribeRequired || uploading || (!draft.text.trim() && !draft.attachments.length)

  function act(type: string, payload?: unknown, messageId?: string) { dispatch({ type, creatorId: cid, fanId: fid, payload, messageId }) }
  function patchDraft(value: Partial<Draft>) { act('PATCH_DRAFT', value) }
  function close() { setDialog(null) }
  function showMedia(mediaIds: string[], selectedId: string) {
    const media = mediaIds.map(id => state.media.find(item => item.id === id)).filter((item): item is Media => !!item)
    const initialIndex = media.findIndex(item => item.id === selectedId)
    if (initialIndex >= 0) setMediaPreview({ media, initialIndex })
  }
  function open(next: Dialog, anchor?: HTMLElement) {
    setGifOpen(false)
    setSeliAnchor(null)
    setEmojiPicker(false)
    if (next === 'vault') { setVaultSelection([]); setMediaTarget(dialog === 'script-preview' ? 'preview' : 'draft'); setVaultOpen(true); return }
    if (next === 'tags') { setTagContext({ target: dialog === 'script-preview' ? 'preview' : 'draft' }); return }
    if (next === 'scripts' || next === 'more') setPopoverAnchor(anchor ?? document.activeElement as HTMLElement)
    if (next === 'rename') setField(fan?.name || '')
    if (next === 'notes') setField(displaySample(fan?.notes || ''))
    if (next === 'emoji') setFavoriteEmojis([...state.emojis])
    if (next === 'translate') prepareTranslation(targetLanguage)
    setDialog(current => (next === 'scripts' || next === 'more') && current === next ? null : next)
  }
  function prepareTranslation(language: 'en' | 'zh') {
    const translated = sampleTranslation(draft.text, language)
    setTranslatedDraft(translated || '')
    setTranslationNote(translated ? t('interface.translation.review') : t('interface.translation.missing'))
  }
  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); notify(t('interface.269')) }
    catch { setField(text); setDialog('copy') }
  }
  function insertText(text: string) {
    const input = inputRef.current
    const start = input?.selectionStart ?? draft.text.length
    const end = input?.selectionEnd ?? start
    patchDraft({ text: draft.text.slice(0, start) + text + draft.text.slice(end) })
    requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + text.length, start + text.length) })
  }
  function chooseScript(script: Script) {
    if (!fan) return
    setPreviewDraft({ ...emptyDraft(), ...fillScript({ ...script, text: displaySample(script.text) }, fan, displaySample(creator.defaultNickname)) })
    setDialog('script-preview')
  }
  function selectVaultMedia(media: Media) {
    const current = mediaTarget === 'preview' ? previewDraft : draft
    if (media.type === 'gif' && (current.attachments.length || current.price || current.creatorTags.length || current.releaseFormIds?.length)) { notify(t('interface.274')); return }
    if (current.attachments.some(item => state.media.find(entry => entry.id === item.mediaId)?.type === 'gif')) { notify(t('interface.275')); return }
    if (media.type === 'gif') { setVaultSelection(selected => selected.includes(media.id) ? [] : [media.id]); return }
    setVaultSelection(selected => { const compatible=selected.filter(id=>state.media.find(item=>item.id===id)?.type!=='gif');return compatible.includes(media.id) ? compatible.filter(id => id !== media.id) : compatible.length + current.attachments.length < 40 ? [...compatible, media.id] : compatible })
  }
  function addVaultMedia() {
    const current = mediaTarget === 'preview' ? previewDraft : draft
    const media = state.media.filter(item => vaultSelection.includes(item.id))
    const changes = { attachments: [...current.attachments, ...media.map(item => ({ mediaId: item.id, free: current.price === 0 }))], creatorTags: [...new Set([...current.creatorTags, ...media.flatMap(item => item.creatorTags)])] }
    if (mediaTarget === 'preview') setPreviewDraft(value => ({ ...value, ...changes }))
    else patchDraft(changes)
    setVaultOpen(false); setVaultSelection([])
  }
  function send() {
    if (sendUnavailable) return
    if (draft.price > 0 && (draft.price < 3 || draft.price > 200)) { notify(t('interface.270')); return }
    if (draft.price > 0 && !draft.lockedText && !draft.attachments.some(attachment => !attachment.free)) { notify(t('interface.271')); return }
    if (draft.scheduledAt && draft.scheduledAt <= now) { notify(t('interface.272')); return }
    act('SEND'); setShowFormat(false); atBottom.current = true
  }
  function chooseGif(media: Media) {
    if (draft.attachments.some(item => state.media.find(entry => entry.id === item.mediaId)?.type !== 'gif') || draft.price || draft.creatorTags.length || draft.releaseFormIds?.length) { notify(t('interface.274')); return }
    patchDraft({ attachments: [{ mediaId: media.id, free: true }], price: 0, lockedText: false })
    setGifOpen(false)
    inputRef.current?.focus()
  }
  async function uploadFiles(files: FileList | File[]) {
    if (!fid) return
    const origin = { creatorId: cid, fanId: fid }
    if (gifSelected) { notify(t('interface.276')); return }
    const items = [...files]
    if (draft.attachments.length + items.length > 40) { notify(t('interface.277')); return }
    setUploading(true)
    const attachments = [...draft.attachments]
    try {
      for (const file of items) {
        if (!/^(image|video|audio)\//.test(file.type)) { notify(t('popup.unsupportedFile', [file.name])); continue }
        const media = await saveMedia(file)
        dispatch({ type: 'ADD_MEDIA', ...origin, payload: media })
        attachments.push({ mediaId: media.id, free: draft.price === 0 })
      }
      dispatch({ type: 'PATCH_DRAFT', ...origin, payload: { attachments } })
    } catch { notify(t('interface.279')) }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }
  function showMatch(index: number) {
    const count = findMatches.length
    if (!count) return
    const normalized = (index + count) % count
    setFindIndex(normalized)
    document.getElementById(`if-message-${findMatches[normalized].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  function createForward(message: Message) {
    setForwardMessage(message); setForwardText(displaySample(message.text)); setForwardPrice(message.price)
    setRecipientIds([]); setRecipientQuery(''); setCampaignTitle(t('ui.247')); open('forward')
  }
  function chooseAiResponse(type: string) {
    if (!fan || fan.blocked || fan.restricted || subscribeRequired) return
    setAiType(type)
    patchDraft({ text: t(`ai.response.${type}`, [fan.nickname || displayName(fan)]) })
    inputRef.current?.focus()
  }
  function jumpToLatest() {
    const thread = threadRef.current
    if (!thread) return
    atBottom.current = true
    thread.scrollTop = thread.scrollHeight
    setShowJump(false)
  }
  function refreshChat() {
    atBottom.current = true; setShowJump(false); setRefreshing(true); setFind(''); setRefreshVersion(value => value + 1)
    if (refreshTimeout.current) clearTimeout(refreshTimeout.current)
    refreshTimeout.current = setTimeout(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; setRefreshing(false) }, 350)
  }
  useEffect(() => () => { if (scrollTimeout.current) clearTimeout(scrollTimeout.current); if (refreshTimeout.current) clearTimeout(refreshTimeout.current) }, [])
  useLayoutEffect(() => {
    const thread = threadRef.current
    if (thread && fid) { const saved = workspace.chatScroll[fid]; thread.scrollTop = saved ?? thread.scrollHeight; atBottom.current = saved === undefined || thread.scrollHeight - thread.scrollTop - thread.clientHeight < 90; setShowJump(!atBottom.current) }
    close(); setVaultOpen(false); setTagContext(null); setMediaPreview(null); setFormatColorAnchor(null); setMessageMenu(null); setFind(''); setFindOpen(false); setGifOpen(false); setSeliAnchor(null); setVoiceOpen(false); setAiOpen(false); setAiType(null); setAiHelp(false); setEmojiPicker(false)
  }, [cid, fid])
  useEffect(() => { if (atBottom.current && threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight }, [messages.length])
  useEffect(() => {
    const thread = threadRef.current
    if (!thread) return
    const observer = new ResizeObserver(() => {
      if (atBottom.current) thread.scrollTop = thread.scrollHeight
      else setShowJump(thread.scrollHeight - thread.scrollTop - thread.clientHeight >= 90)
    })
    observer.observe(thread)
    if (threadContentRef.current) observer.observe(threadContentRef.current)
    return () => observer.disconnect()
  }, [cid, fid, refreshVersion])
  useEffect(() => { setFindIndex(0) }, [find])

  useEffect(() => {
    if (!messageMenu) return
    const dismiss = (event: PointerEvent) => { const target = event.target as Element; if (!target.closest('.if-message-more-menu,[data-message-menu-trigger]')) setMessageMenu(null) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMessageMenu(null) }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape) }
  }, [messageMenu])

  function bubble(message: Message, inModal = false, grouped = false) {
    const original = message.replyToId ? messages.find(item => item.id === message.replyToId) : undefined
    const canWithdraw = canWithdrawMessage(message, now)
    const access = chatMediaAccess(message)
    const visibleText = access.textLocked ? t('chat.lockedText') : displaySample(message.text)
    const target = /[\u3400-\u9fff]/.test(visibleText) ? 'en' : 'zh'
    const outgoing = message.direction === 'outbound'
    const menuKey = `${inModal ? 'modal:' : ''}${message.id}`
    const run = (action: () => void) => { setMessageMenu(null); action() }
    const translate = () => setTranslations(value => ({ ...value, [message.id]: !value[message.id] }))
    return <article id={inModal ? undefined : `if-message-${message.id}`} key={message.id} className={`if-message ${message.direction} ${message.status} ${message.attachments.length && message.status !== 'withdrawn' ? 'with-media' : ''} ${message.pinned ? 'pinned' : ''} ${grouped ? 'consecutive' : ''} ${findMatches[findIndex]?.id === message.id ? 'search-match' : ''}`}>
      <div className="if-message-layout">
        <span className={`if-message-avatar${outgoing ? ' if-self-avatar' : ''}`} aria-hidden="true">{outgoing ? <UserRound size={22} /> : <Avatar name={fan?.avatar || message.sender} color={fan?.color} size={34} />}</span>
        <div className="if-message-content">
          <div className="if-message-line">
            <div className="if-bubble" onDoubleClick={() => { if (!outgoing) act('LIKE_MESSAGE', undefined, message.id) }}>
              {message.pinned && <div className="if-pinned-label"><Pin size={11} />{t('ui.248')}</div>}
              {message.status === 'withdrawn' ? <div className="if-withdrawn"><EyeOff size={15} />{t('ui.122')}</div> : <>
                {original && <button className="if-quote" onClick={() => { if (inModal) close(); requestAnimationFrame(() => document.getElementById(`if-message-${original.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })) }}><strong>{original.sender}</strong><span>{original.status === 'withdrawn' ? t('ui.122') : chatMediaAccess(original).textLocked ? t('chat.lockedText') : displaySample(original.text) || t('ui.070')}</span></button>}
                {(!!message.attachments.length || access.textLocked) && <ChatAttachments message={message} media={state.media} onPreview={showMedia} onCheckout={() => { if (inModal) close(); notify(t('navigation.page', [t('chat.checkout')])) }}/>}
                {!access.textLocked && <div className="if-message-text" style={{ fontWeight: message.format.bold ? 700 : 400, fontStyle: message.format.italic ? 'italic' : 'normal', color: message.format.color, fontSize: message.format.size }}>{displaySample(message.text)}</div>}
                {(!!message.creatorTags.length || !!message.releaseFormIds?.length) && <small className="if-message-tags">{[...message.creatorTags.map(id => `@${state.creators.find(item => item.id === id)?.name || id}`), ...(message.releaseFormIds || []).map(id => state.releaseForms?.find(form => form.id === id)?.name || id)].join(' · ')}</small>}

              </>}
            </div>
            {message.status !== 'withdrawn' && <div className="if-message-tools" aria-label={t('ui.254', [message.id])}>
              {!outgoing && <><IconButton label={message.pinned ? t('ui.255') : t('ui.256')} active={message.pinned} onClick={() => act('PIN_MESSAGE', undefined, message.id)}><Pin size={13} /></IconButton><IconButton label={t('ui.257')} onClick={() => { act('REPLY', undefined, message.id); close(); inputRef.current?.focus() }}><Reply size={14} /></IconButton><IconButton label={message.liked ? t('ui.258') : t('ui.259')} active={message.liked} onClick={() => act('LIKE_MESSAGE', undefined, message.id)}><Heart size={14} /></IconButton></>}
              <IconButton label={t('ui.260')} disabled={access.textLocked} active={translations[message.id]} onClick={translate}><Languages size={14} /></IconButton>
              <button type="button" className={`if-icon-button if-message-more-trigger${outgoing ? '' : ' if-inbound-more'}`} aria-label={t('ui.261')} title={t('ui.261')} aria-haspopup="menu" aria-expanded={messageMenu === menuKey} data-message-menu-trigger onClick={event => { if (messageMenu === menuKey) { setMessageMenu(null); return } const rect = event.currentTarget.getBoundingClientRect(); const menuHeight = (canWithdraw ? 305 : 272) + (outgoing ? 32 : 0); setMessageMenuPosition({ left: Math.min(Math.max(8, rect.left), window.innerWidth - 214), top: rect.top > menuHeight + 80 ? rect.top - menuHeight - 4 : Math.min(rect.bottom + 4, window.innerHeight - menuHeight - 8) }); setMessageMenu(menuKey) }}><MoreVertical size={15} /></button>
              {messageMenu === menuKey && <div className="if-message-more-menu" role="menu" aria-label={t('ui.262')} style={messageMenuPosition}>
                <button role="menuitem" onClick={() => run(() => act('LIKE_MESSAGE', undefined, message.id))}><Heart size={15} />{message.liked ? t('ui.258') : t('ui.259')}</button>
                <button role="menuitem" onClick={() => run(() => { act('REPLY', undefined, message.id); close(); inputRef.current?.focus() })}><Reply size={15} />{t('ui.257')}</button>
                <button role="menuitem" onClick={() => run(() => act('PIN_MESSAGE', undefined, message.id))}><Pin size={15} />{message.pinned ? t('ui.255') : t('ui.256')}</button>
                <button role="menuitem" disabled={access.textLocked} onClick={() => run(() => { void copyText(visibleText) })}><Copy size={15} />{t('ui.263')}</button>
                <button role="menuitem" disabled={access.textLocked || !!access.locked.length} onClick={() => run(() => { act('COPY_DRAFT', undefined, message.id); close() })}><NotebookPen size={15} />{t('ui.264')}</button>
                <button role="menuitem" disabled={access.textLocked || !!access.locked.length} onClick={() => run(() => createForward(message))}><Forward size={15} />{t('ui.247')}</button>
                <button role="menuitem" disabled={access.textLocked || !!access.locked.length} onClick={() => run(() => act('ADD_SCRIPT_MESSAGE', undefined, message.id))}><BookOpen size={15} />{t('ui.265')}</button>
                {outgoing && <button role="menuitem" onClick={() => run(() => setTagContext({ target: 'message', messageId: message.id }))}><AtSign size={15} />{t('popup.addTag')}</button>}
                <button role="menuitem" disabled={access.textLocked} onClick={() => run(translate)}><Languages size={15} />{t('ui.260')}</button>
                {canWithdraw && <button role="menuitem" className="if-danger-text" onClick={() => run(() => act('WITHDRAW', undefined, message.id))}><Trash2 size={15} />{t('ui.266')}</button>}
              </div>}
            </div>}
          </div>
          <div className="if-message-footer">{message.price > 0 && message.status !== 'withdrawn' && <span className={`if-message-price${message.purchasedAt ? ' is-paid' : ' is-unpaid'}`}>{money(message.price)} {t(message.purchasedAt ? 'chat.paid' : 'chat.notPaid')}</span>}<time>{new Intl.DateTimeFormat(getLocale()==='zh'?'zh-CN':'en-US', { hour: 'numeric', minute: '2-digit', hour12: getLocale() !== 'zh' }).format(message.createdAt)}</time>{outgoing && message.status !== 'withdrawn' && <span className="if-read-status" title={message.status === 'read' ? t('ui.267') : message.status === 'failed' ? t('ui.268') : message.status === 'sending' ? t('ui.269') : t('ui.270')}>{message.status === 'read' ? '✓✓' : message.status === 'failed' ? t('ui.268') : message.status === 'sending' ? t('ui.271') : '✓'}</span>}{outgoing && message.status !== 'withdrawn' && <span className="if-message-sender" title={t('chat.sender', [message.sender])}>{message.sender}</span>}{message.liked && <Heart size={12} fill="#ed7299" color="#ed7299" />}</div>
          {message.status === 'failed' && <button className="if-resend" onClick={() => act('RETRY', undefined, message.id)}>{t('ui.272')}</button>}
          {translations[message.id] && message.status !== 'withdrawn' && <div className="if-message-translation"><Languages size={12} /><span><span>{sampleTranslation(visibleText, target) || t('ui.273')}</span><small>{t('ui.274')} {target === 'zh' ? t('ui.275') : t('ui.276')}</small></span></div>}
        </div>
      </div>
    </article>
  }

  function dialogBody() {
    if (!fan) return null
    switch (dialog) {
      case 'profile': return <div className="if-profile-preview"><Avatar name={fan.name} color={fan.color} size={56} online={fan.online} /><h3>{fan.name}</h3><p>{fan.handle}</p><dl><dt>{t('interface.162')}</dt><dd>{subscriptionStatusLabel(fan.subscriptionStatus)}</dd><dt>{t('interface.318')}</dt><dd>{fan.renew ? t('interface.198') : t('interface.199')}</dd><dt>{t('interface.319')}</dt><dd>{countryLabel(fan.timeZone, fan.country) || t('interface.191')}</dd><dt>{t('interface.320')}</dt><dd>{sourceLabel(fan.source) || t('interface.191')}</dd><dt>{t('interface.321')}</dt><dd>{relativeTime(fan.lastSeenAt, now)}</dd></dl><button className="if-primary" onClick={() => void copyText(`https://onlyfans.com/${fan.handle.replace(/^@/, '')}`)}>{t('interface.084')}</button></div>
      case 'rename': return <form onSubmit={event => { event.preventDefault(); if (field.trim()) { act('PATCH_FAN', { name: field.trim() }); close() } }}><label className="if-field">{t('interface.322')}<input autoFocus value={field} onChange={event => setField(event.target.value)} maxLength={80} /></label><p className="if-muted">{t('interface.323')}</p><div className="if-modal-actions"><button type="button" onClick={close}>{t('interface.072')}</button><button className="if-primary" disabled={!field.trim()}>{t('interface.324')}</button></div></form>
      case 'lists': return null
      case 'notes': return <div className="if-add-notes"><div className="if-add-notes-body"><div className="if-add-notes-fan"><Avatar name={fan.name} color={fan.color} online={fan.online} size={42}/><span><strong>{displayName(fan)}</strong><small>{fan.handle}</small></span></div><label>{t('notes.label')}<textarea rows={3} autoFocus maxLength={200} value={field} onChange={event => setField(event.target.value)} placeholder={t('notes.placeholder')} /></label><small className="if-add-notes-count">{field.length} / 200</small></div><div className="if-add-notes-footer"><button onClick={close}>{t('interface.072')}</button><button disabled={!field.trim()} onClick={() => setField('')}>{t('notes.clear')}</button><button className="if-primary" onClick={() => { act('PATCH_FAN', { notes: field.trim() }); close() }}>{t('interface.073')}</button></div></div>
      case 'more': return <div className="if-fan-actions"><div className="if-fan-menu-profile"><Avatar name={fan.name} color={fan.color} online={fan.online} size={29}/><span>{fan.handle}</span></div><hr /><button onClick={() => { close(); void copyText(`https://onlyfans.com/${fan.handle.replace(/^@/, '')}`) }}>{t('interface.084')}</button><button onClick={() => { close(); void copyText(window.location.href) }}>{t('chat.more.copyChat')}</button><button onClick={() => open('lists')}>{t('interface.085')}</button><hr /><button onClick={() => open('confirm-hide')}>{t('interface.087')}</button><button onClick={() => { act('PATCH_FAN', { muted: !fan.muted }); close() }}>{fan.muted ? t('interface.330') : t('interface.331')} {t('interface.332')}</button><hr /><button onClick={() => open('confirm-restrict')}>{fan.restricted ? t('interface.091') : t('interface.090')}</button><button onClick={() => open('confirm-block')}>{fan.blocked ? t('interface.093') : t('interface.092')}</button><button onClick={() => open('report')}>{t('interface.094')}</button></div>
      case 'confirm-hide': return <div><p>{t('interface.333')} {fan.name} {t('interface.extra.22')}</p><div className="if-modal-actions"><button onClick={close}>{t('interface.072')}</button><button className="if-danger" onClick={() => { act('HIDE_FAN'); close() }}>{t('interface.087')}</button></div></div>
      case 'confirm-block': case 'confirm-restrict': { const blocked = dialog === 'confirm-block'; const current = blocked ? fan.blocked : fan.restricted; return <div><p>{current ? t('interface.334') : blocked ? t('interface.335') : t('interface.336')}</p><div className="if-modal-actions"><button onClick={close}>{t('interface.072')}</button><button className={current ? 'if-primary' : 'if-danger'} onClick={() => { act('PATCH_FAN', blocked ? { blocked: !current } : { restricted: !current }); close() }}>{current ? blocked ? t('interface.093') : t('interface.091') : blocked ? t('interface.098') : t('interface.099')}</button></div></div> }
      case 'discount': return <div><p>{t('interface.337')} {money(fan.subscriptionPrice)}</p><label className="if-field">{t('interface.338')}<input type="number" min={1} max={90} value={discount} onChange={event => setDiscount(Math.min(90, Math.max(1, Number(event.target.value) || 1)))} /></label><p>{t('interface.339')} <strong>{money(fan.subscriptionPrice * (1 - discount / 100))}</strong></p><p className="if-muted">{t('interface.340')}</p><div className="if-modal-actions"><button onClick={close}>{t('interface.072')}</button><button className="if-primary" onClick={() => { act('PATCH_FAN', { subscriptionPrice: Math.round(fan.subscriptionPrice * (1 - discount / 100) * 100) / 100 }); close() }}>{t('interface.341')}</button></div></div>
      case 'report': return <div><p className="if-muted">{t('interface.342')}</p><label className="if-field">{t('interface.343')}<SelectField label={t('interface.343')} value={reportReason} options={['interface.344', 'interface.345', 'interface.346', 'interface.347'].map(value => ({ value, label: t(value) }))} onChange={setReportReason} /></label><label className="if-field">{t('interface.348')}<textarea value={field} onChange={event => setField(event.target.value)} placeholder={t('interface.349')} /></label><div className="if-modal-actions"><button onClick={close}>{t('interface.072')}</button><button className="if-danger" onClick={() => { act('REPORT_FAN', { reason: `${t(reportReason)}${field ? ': ' + field : ''}` }); close() }}>{t('interface.350')}</button></div></div>
      case 'copy': return <div><p>{t('interface.351')}</p><textarea className="if-copy-fallback" readOnly value={field} onFocus={event => event.target.select()} rows={5} autoFocus /></div>
      case 'pinned': return <div className="if-modal-thread if-pinned-thread">{messages.filter(message => message.pinned && message.status !== 'withdrawn').map(message => <section className="if-pinned-entry" key={message.id}>{bubble(message, true)}<button className="if-pinned-locate" onClick={() => { close(); requestAnimationFrame(() => document.getElementById(`if-message-${message.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })) }}>{t('interface.064')}<ExternalLink size={13}/></button></section>)}{!messages.some(message => message.pinned && message.status !== 'withdrawn') && <p className="if-chat-empty">{t('interface.065')}</p>}</div>
      case 'gallery': { const entries = messages.filter(message => message.status !== 'withdrawn').flatMap(message => message.attachments.map(attachment => ({ message, attachment, media: state.media.find(item => item.id === attachment.mediaId) }))).filter(item => item.media && chatMediaAccess(item.message).available.some(attachment => attachment.mediaId === item.attachment.mediaId) && (galleryFilter === 'all' || galleryFilter === 'unlocked' && (item.message.price === 0 || item.message.purchasedAt || item.attachment.free) || item.media.type === galleryFilter)); return <div><div className="if-segmented">{[['all', t('interface.058')], ['unlocked', t('interface.038')], ['image', t('interface.061')], ['video', t('interface.062')], ['audio', t('interface.063')]].map(([id, label]) => <button key={id} className={galleryFilter === id ? 'active' : ''} onClick={() => setGalleryFilter(id)}>{label}</button>)}</div><div className="if-gallery-grid">{entries.map(({ message, attachment, media }, index) => <article key={`${message.id}:${attachment.mediaId}:${index}`}><button className="if-gallery-preview" aria-label={t('chat.complete.previewMedia', [media ? displaySample(media.title) : attachment.mediaId])} onClick={() => showMedia(entries.map(item => item.attachment.mediaId), attachment.mediaId)}><MediaView compact media={media} /></button><strong>{media ? displaySample(media.title) : '—'}</strong><small>{money(message.price)} · {message.purchasedAt ? t('interface.059') : message.price === 0 || attachment.free ? t('interface.196') : t('interface.060')}</small><button onClick={() => { close(); requestAnimationFrame(() => document.getElementById(`if-message-${message.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })) }}>{t('interface.064')}</button></article>)}</div>{!entries.length && <p className="if-chat-empty">{t('interface.066')}</p>}</div> }
      case 'emoji': return <div className="if-emoji-settings">
        <section className="if-favorite-setting-area"><div className="if-favorite-heading"><strong>{t('popup.favorites')}</strong><span>{favoriteEmojis.length}/40</span></div><p>{t('popup.favoritesHint')}</p>
          <div className="if-favorite-settings">{favoriteEmojis.map((emoji, index) => <div key={`${emoji}:${index}`} draggable onDragStart={() => setDraggedEmoji(index)} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (draggedEmoji === null || draggedEmoji === index) return; setFavoriteEmojis(values => { const reordered = [...values]; const [item] = reordered.splice(draggedEmoji, 1); reordered.splice(index, 0, item); return reordered }); setDraggedEmoji(null) }} onDragEnd={() => setDraggedEmoji(null)}><span>{emoji}</span><button aria-label={t('popup.removeMedia', [emoji])} onClick={() => setFavoriteEmojis(values => values.filter((_, i) => index !== i))}><X size={11} /></button></div>)}</div>{!favoriteEmojis.length && <p>{t('popup.pickFavorite')}</p>}
        </section>
        <EmojiPicker onPick={emoji => { if (favoriteEmojis.includes(emoji)) { notify(t('popup.emojiDuplicate')); return }; if (favoriteEmojis.length === 40) { notify(t('popup.emojiLimit')); return }; setFavoriteEmojis(values => [...values, emoji]) }} />
        <div className="if-modal-actions"><button onClick={close}>{t('interface.072')}</button><button className="if-primary" onClick={() => { act('PATCH_EMOJIS', favoriteEmojis); close() }}>{t('interface.extra.24')}</button></div>
      </div>

      case 'scripts': return <ScriptLibrary scripts={state.scripts} media={state.media} messages={Object.values(state.messages).flat().filter(message => message.creatorId === cid)} onChoose={chooseScript} onManage={() => { close(); notify(t('navigation.page', [t('chat.complete.scriptsPage')])) }}/>
      case 'script-preview': return <div className="if-script-preview-content"><div className="if-preview-body"><p className="if-muted">{t('popup.scriptPreviewHint')}</p><textarea className="if-preview-text" aria-label={t('interface.124')} rows={5} value={previewDraft.text} maxLength={6500} title={t('chat.complete.textLength')} onChange={event => setPreviewDraft(value => ({ ...value, text: event.target.value }))} /><div className="if-preview-emoji-row">{state.emojis.slice(0, 10).map(emoji => <button key={emoji} onClick={() => setPreviewDraft(value => ({ ...value, text: value.text + emoji }))}>{emoji}</button>)}</div>
        <label className="if-preview-price">{t('interface.024')}<span>$</span><input aria-label={t('interface.024')} type="number" min={0} max={200} step={0.01} value={previewDraft.price} onChange={event => setPreviewDraft(value => ({ ...value, price: Math.max(0, Math.min(200, Number(event.target.value) || 0)), lockedText: Number(event.target.value) > 0 }))} /></label>
        <div className="if-preview-attachments"><button className="if-preview-add-media" onClick={() => open('vault')}><Plus size={23} />{t('interface.022')}</button>{previewDraft.attachments.map(attachment => <div key={attachment.mediaId}><button className="if-draft-media-preview" aria-label={t('chat.complete.previewMedia', [displaySample(state.media.find(item => item.id === attachment.mediaId)?.title || attachment.mediaId)])} onClick={() => showMedia(previewDraft.attachments.map(item => item.mediaId), attachment.mediaId)}><MediaView compact media={state.media.find(item => item.id === attachment.mediaId)} /></button><button className="if-preview-remove" aria-label={t('popup.removeMedia', [attachment.mediaId])} onClick={() => setPreviewDraft(value => ({ ...value, attachments: value.attachments.filter(item => item.mediaId !== attachment.mediaId) }))}><X size={14} /></button><label><input type="checkbox" checked={!attachment.free} onChange={event => setPreviewDraft(value => ({ ...value, attachments: value.attachments.map(item => item.mediaId === attachment.mediaId ? { ...item, free: !event.target.checked } : item) }))} />{t('popup.paid')}</label></div>)}</div>
        <div className="if-preview-co-creators"><button className="if-secondary" onClick={() => open('tags')}><AtSign size={15} />{t('interface.025')}</button>{previewDraft.creatorTags.map(id => <span key={id}>{state.creators.find(creator => creator.id === id)?.name ?? id}</span>)}{previewDraft.releaseFormIds?.map(id => <span key={id}>{state.releaseForms?.find(form => form.id === id)?.name || id}</span>)}</div>
        </div>
        <div className="if-modal-actions"><button onClick={close}>{t('interface.072')}</button><button className="if-primary" disabled={previewUnavailable} onClick={() => { act('SEND', { draft: previewDraft, preserveDraft: true }); close(); atBottom.current = true }}>{t('interface.019')}</button></div>
      </div>
      case 'tags': return null
      case 'translate': return <div><label className="if-field">{t('interface.387')}<textarea readOnly value={draft.text} rows={3} /></label><div className="if-inline-form"><SelectField label={t('interface.388')} value={targetLanguage} options={[{ value: 'zh', label: t('ui.275') }, { value: 'en', label: t('interface.389') }]} onChange={value => { const language = value as 'en' | 'zh'; setTargetLanguage(language); prepareTranslation(language) }} /><button className="if-secondary" onClick={() => prepareTranslation(targetLanguage)}>{t('interface.390')}</button></div><p className="if-demo-note">{translationNote}</p><label className="if-field">{t('interface.391')}<textarea value={translatedDraft} onChange={event => setTranslatedDraft(event.target.value)} rows={4} /></label><div className="if-modal-actions"><button onClick={close}>{t('interface.072')}</button><button className="if-primary" disabled={!translatedDraft.trim()} onClick={() => { patchDraft({ text: translatedDraft }); close() }}>{t('interface.392')}</button></div></div>
      case 'forward': return <div><p className="if-demo-note">{t('interface.393')}</p><label className="if-field">{t('interface.394')}<input value={campaignTitle} onChange={event => setCampaignTitle(event.target.value)} /></label><label className="if-field">{t('interface.124')}<textarea value={forwardText} onChange={event => setForwardText(event.target.value)} rows={3} /></label>{forwardMessage && <div className="if-timer-attachments">{forwardMessage.attachments.map(item => <button key={item.mediaId} aria-label={t('chat.complete.previewMedia', [displaySample(state.media.find(media => media.id === item.mediaId)?.title || item.mediaId)])} onClick={() => showMedia(forwardMessage.attachments.map(item => item.mediaId), item.mediaId)}><MediaView media={state.media.find(media => media.id === item.mediaId)} compact /></button>)}</div>}<label className="if-field">{t('interface.extra.30')}<input type="number" min={0} max={200} value={forwardPrice} onChange={event => setForwardPrice(Math.max(0, Math.min(200, Number(event.target.value) || 0)))} /></label><div className="if-forward-search"><input aria-label={t('chat.complete.searchRecipients')} placeholder={t('chat.complete.searchRecipients')} value={recipientQuery} onChange={event => setRecipientQuery(event.target.value)} /></div><label className="if-forward-select-all"><input type="checkbox" checked={forwardSelectable.length > 0 && forwardSelectable.every(item => recipientIds.includes(item.id))} disabled={!forwardSelectable.length} onChange={event => setRecipientIds(ids => event.target.checked ? [...new Set([...ids, ...forwardSelectable.map(item => item.id)])] : ids.filter(id => !forwardSelectable.some(item => item.id === id)))} />{t('chat.complete.selectRecipients')}</label><div className="if-recipient-list"><strong>{t('popup.recipientCount', [recipientIds.length])}</strong>{forwardFans.map(item => <label className="if-check-row" key={item.id}><input type="checkbox" disabled={item.blocked || item.restricted || item.subscriptionStatus === 'expired' && !item.creatorSubscribed} checked={recipientIds.includes(item.id)} onChange={() => setRecipientIds(values => values.includes(item.id) ? values.filter(id => id !== item.id) : [...values, item.id])} /><span>{item.name}</span>{(item.blocked || item.restricted) && <small>{t('interface.397')}</small>}</label>)}</div><div className="if-modal-actions"><button onClick={close}>{t('interface.072')}</button><button className="if-primary" disabled={!recipientIds.length || !campaignTitle.trim() || (forwardPrice > 0 && forwardPrice < 3) || (!forwardText.trim() && !forwardMessage?.attachments.length)} onClick={() => { if (!forwardMessage) return; if (forwardPrice > 0 && forwardPrice < 3) { notify(t('interface.270')); return }; if (forwardPrice > 0 && !forwardMessage.lockedText && !forwardMessage.attachments.some(item => !item.free)) { notify(t('interface.271')); return }; act('CREATE_CAMPAIGN', { title: campaignTitle, type: 'mass', fanIds: recipientIds, saveOnly: true, draft: { ...emptyDraft(), text: forwardText, attachments: forwardMessage.attachments.map(item => ({ ...item })), price: forwardPrice, lockedText: forwardMessage.lockedText, creatorTags: [...forwardMessage.creatorTags], releaseFormIds: [...(forwardMessage.releaseFormIds || [])], scriptId: forwardMessage.scriptId, format: { ...forwardMessage.format } } }); close() }}>{t('interface.398')}</button></div></div>
      default: return null
    }
  }

  return <section className="if-chat-panel" aria-label={t('interface.007')}>
    {!fan ? <div className="if-chat-empty if-no-fan"><UserRound size={32} /><h2>{t('interface.extra.32')}</h2><p>{t('interface.extra.33')}</p></div> : <>
      <header className="if-chat-top"><IconButton label={t('interface.008')} onClick={() => act('SELECT_HOME_TAB')}><ArrowLeft size={21} /></IconButton><div className="if-chat-person"><button className="if-chat-name" onClick={() => notify(t('navigation.page', [t('chat.complete.profilePage')]))}>{displayName(fan)}</button>{fan.verified && <BadgeCheck className="if-chat-verified" size={13} aria-label={t('creatorTag.verified')}/>}<IconButton label={t('interface.017')} onClick={() => open('rename')}><Pencil size={13} /></IconButton><div className="if-chat-status">{fan.blocked ? t('interface.287') : fan.restricted ? t('interface.288') : fan.online ? <><i />{t('interface.207')}</> : t('interface.extra.seenAgo', [relativeTime(fan.lastSeenAt, now)])}<span className="if-chat-tools-inline"><IconButton label={t('interface.012')} active={fan.listIds.length > 0} onClick={() => open('lists')}><Star size={14} /></IconButton><IconButton label={fan.muted ? t('interface.089') : t('interface.088')} active={fan.muted} onClick={() => act('PATCH_FAN', { muted: !fan.muted })}>{fan.muted ? <BellOff size={14} /> : <Bell size={14} />}</IconButton><IconButton label={t('interface.013')} active={!!fan.notes} onClick={() => open('notes')}><NotebookPen size={14} /></IconButton><IconButton label={t('interface.014')} active={messages.some(message => message.pinned)} onClick={() => open('pinned')}><Pin size={14} /></IconButton><button className="if-header-text-tool" onClick={() => { setGalleryFilter('all'); open('gallery') }}><Images size={13} />{t('interface.015')}</button><button className={`if-header-text-tool ${findOpen ? 'active' : ''}`} onClick={() => setFindOpen(value => !value)}><Search size={13} />{t('interface.016')}</button></span></div></div><div className="if-chat-top-actions"><button className="if-new-tab" onClick={() => notify(t('navigation.page', [t('chat.complete.newWindow')]))}><ExternalLink size={14} /><span>{t('interface.009')}</span></button><IconButton label={t('interface.010')} disabled={refreshing} onClick={refreshChat}><RefreshCw size={17} className={refreshing ? 'if-spinning' : undefined} /></IconButton><IconButton label={t('interface.011')} onClick={event => { setField(''); open('more', event.currentTarget) }}><MoreVertical size={18} /></IconButton></div></header>
      {findOpen && <div className="if-find-bar"><IconButton label={t('interface.294')} onClick={() => { setFind(''); setFindOpen(false) }}><X size={18} /></IconButton><input aria-label={t('interface.extra.42')} placeholder={t('interface.extra.42')} value={find} autoFocus onChange={event => setFind(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') { setFind(''); setFindOpen(false) } else if (event.key === 'Enter') showMatch(event.shiftKey ? findIndex - 1 : findIndex + 1) }} />{find.trim() && <span>{findMatches.length ? `${findIndex + 1}/${findMatches.length}` : t('interface.290')}</span>}{findMatches.length > 1 && <><IconButton label={t('interface.292')} onClick={() => showMatch(findIndex - 1)}><ChevronUp size={15} /></IconButton><IconButton label={t('interface.293')} onClick={() => showMatch(findIndex + 1)}><ChevronDown size={15} /></IconButton></>}<IconButton label={t('interface.016')} disabled={!findMatches.length} onClick={() => showMatch(findIndex)}><Search size={18} /></IconButton></div>}
      {subscribeRequired && <div className="if-subscribe-notice" role="status"><span>{t('subscription.notice')}</span><button className="if-primary" onClick={()=>{act('PATCH_FAN',{creatorSubscribed:true});notify(t('subscription.done'))}}>{t('subscription.action')}</button></div>}
      <div className="if-thread-viewport">
      <div className="if-chat-thread" key={`${cid}:${fid}:${refreshVersion}`} ref={threadRef} onScroll={event => { const el = event.currentTarget; atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90; setShowJump(!atBottom.current); const position = el.scrollTop; const originCreatorId = cid; const originFanId = fid; if (scrollTimeout.current) clearTimeout(scrollTimeout.current); scrollTimeout.current = setTimeout(() => { if (!originFanId) return; const previous = latestState.current.workspaces[originCreatorId]?.chatScroll || {}; dispatch({ type: 'PATCH_WORKSPACE', creatorId: originCreatorId, fanId: originFanId, payload: { chatScroll: { ...previous, [originFanId]: position } } }) }, 120) }}>
        <div className="if-thread-content" ref={threadContentRef}><div className="if-thread-intro"><span>{t('interface.208')} {fan.name}</span><small>{t('interface.209')} {creator.name}</small></div>
        {messages.map((message, index) => <div className="if-message-group" key={message.id}>{(!index || new Date(message.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString()) && <div className="if-message-day">{new Date(message.createdAt).toLocaleDateString(getLocale()==='zh'?'zh-CN':'en-US', { month: 'short', day: 'numeric' })}</div>}{bubble(message, false, sameMessageGroup(messages[index - 1], message))}</div>)}
        {!messages.length && <p className="if-chat-empty">{t('interface.295')}</p>}
        </div>
      </div>
      {showJump && <button type="button" className="if-jump-latest" aria-label={t('chat.latest')} title={t('chat.latest')} onClick={jumpToLatest}><ChevronDown size={18}/></button>}
      </div>
      <div className="if-composer">
        {!!pendingTasks.length && <div className="if-pending-tasks">{pendingTasks.map(task => <div key={task.id}><Clock size={12} /><span>{task.kind === 'reminder' ? t('popup.timedReminder') : task.kind === 'timed' ? t('popup.timedMessage') : t('interface.124')} · {String(Math.floor(Math.max(0, task.dueAt - now) / 60000)).padStart(2, '0')}:{String(Math.floor(Math.max(0, task.dueAt - now) / 1000) % 60).padStart(2, '0')} · {displaySample(task.text).slice(0, 35)}</span><button aria-label={t('interface.extra.43')} onClick={() => act('CANCEL_TASK', task.id)}><X size={13} /></button></div>)}</div>}
        {gifOpen && <GifStrip media={state.media} selectedId={draft.attachments.find(item => state.media.find(media => media.id === item.mediaId)?.type === 'gif')?.mediaId} onChoose={chooseGif} onClose={() => { setGifOpen(false); inputRef.current?.focus() }}/> }
        <div className="if-composer-topline" hidden={aiOpen}><div className="if-emoji-quick"><IconButton label={t('interface.028')} active={emojiPicker} onClick={event => { close(); setSeliAnchor(null); setEmojiAnchor(event.currentTarget); setEmojiPicker(value => !value) }}><Smile size={17} /></IconButton><IconButton label={t('interface.029')} onClick={() => open('emoji')}><Settings2 size={16} /></IconButton>{state.emojis.map((emoji, index) => <button className="if-quick-emoji" key={`${emoji}:${index}`} onClick={() => insertText(emoji)}>{emoji}</button>)}</div><div className="if-composer-top-tools"><button className="if-seli-button" aria-expanded={!!seliAnchor} onClick={event => { close(); setGifOpen(false); setEmojiPicker(false); const anchor=event.currentTarget; setSeliAnchor(value => value ? null : anchor) }}><CirclePause size={15} />{t('chat.seli')}</button><button className="if-ai-button" aria-expanded={aiOpen} onClick={() => { close(); setSeliAnchor(null); setGifOpen(false); setAiOpen(true); setAiHelp(false); setEmojiPicker(false) }}><CirclePause size={15} />{t('chat.ai')}</button><button className="if-scripts-button" onClick={event => open('scripts', event.currentTarget)}><MessageSquare size={16} />{t('ui.280')}</button><IconButton label={t('popup.timing')} active={dialog === 'timed-message' || dialog === 'timer'} onClick={() => open('timed-message')}><AlarmClock size={19} /></IconButton></div></div>
        
        {aiOpen && <section className="if-ai-response-panel" aria-label={t('ui.279')} onKeyDown={event => { if (event.key === 'Escape') { setAiOpen(false); setAiHelp(false); inputRef.current?.focus() } }}>
          <div className="if-ai-response-heading"><span>{t('ai.selectType')}</span><IconButton label={t('ai.help')} active={aiHelp} onClick={() => setAiHelp(value => !value)}><CircleHelp size={14}/></IconButton><IconButton label={t('ai.close')} onClick={() => { setAiOpen(false); setAiHelp(false); inputRef.current?.focus() }}><X size={17}/></IconButton></div>
          <div className="if-ai-response-types">{[['casual','💬'],['tip','💰'],['reengage','🤩'],['flirty','🌶️']].map(([type,emoji]) => <button key={type} type="button" aria-pressed={aiType === type} disabled={fan.blocked || fan.restricted || subscribeRequired} onClick={() => chooseAiResponse(type)}><span aria-hidden="true">{emoji}</span>{t(`ai.type.${type}`)}</button>)}</div>
          {aiHelp && <p className="if-ai-response-help">{t('ai.helpText')}</p>}
        </section>}
        {draft.replyToId && <div className="if-draft-quote"><Reply size={15} /><span>{t('interface.298')} {messages.find(message => message.id === draft.replyToId)?.sender}<small>{displaySample(messages.find(message => message.id === draft.replyToId)?.text ?? '') || t('interface.057')}</small></span><button aria-label={t('interface.297')} onClick={() => patchDraft({ replyToId: undefined })}><X size={14} /></button></div>}
        {draft.scheduledAt && <div className="if-draft-schedule"><CalendarClock size={15} /><button onClick={() => open('schedule')}>{t('interface.299')} {new Date(draft.scheduledAt).toLocaleString()}</button><button aria-label={t('interface.303')} onClick={() => patchDraft({ scheduledAt: undefined })}><X size={14} /></button></div>}
        {draft.price > 0 && <div className="if-draft-price"><span><Unlock size={14} />{t('interface.036')}</span><button onClick={() => open('price')}><Tag size={14} />{t('interface.300')} {money(draft.price)}</button><label><input type="checkbox" checked={draft.lockedText} onChange={event => patchDraft({ lockedText: event.target.checked })} />{t('interface.301')}</label><button aria-label={t('interface.302')} onClick={() => patchDraft({ price: 0, lockedText: false, attachments: draft.attachments.map(item => ({ ...item, free: true })) })}><X size={13} /></button></div>}
        {!!draft.attachments.length && <div className="if-draft-media">{draft.attachments.map(attachment => { const media = state.media.find(item => item.id === attachment.mediaId); return <div className="if-draft-media-card" key={attachment.mediaId}><button className="if-draft-media-preview" aria-label={t('chat.complete.previewMedia', [media ? displaySample(media.title) : attachment.mediaId])} onClick={() => showMedia(draft.attachments.map(item => item.mediaId), attachment.mediaId)}><MediaView media={media} compact /></button><button className="if-draft-remove" aria-label={t('popup.removeMedia', [media ? displaySample(media.title) : t('interface.extra.mediaAttachment')])} onClick={() => patchDraft({ attachments: draft.attachments.filter(item => item.mediaId !== attachment.mediaId) })}><X size={12} /></button><small>{media ? displaySample(media.title) : '—'}</small>{draft.price > 0 && <label><input type="checkbox" checked={attachment.free} onChange={event => patchDraft({ attachments: draft.attachments.map(item => item.mediaId === attachment.mediaId ? { ...item, free: event.target.checked } : item) })} />{t('interface.036')}</label>}</div> })}</div>}
        {(!!draft.creatorTags.length || !!draft.releaseFormIds?.length) && <div className="if-draft-tags">{draft.creatorTags.map(id => <button key={id} onClick={() => patchDraft({ creatorTags: draft.creatorTags.filter(item => item !== id) })}>@{state.creators.find(item => item.id === id)?.name || id}<X size={11} /></button>)}{draft.releaseFormIds?.map(id => <button key={id} aria-label={t('chat.complete.removeRelease', [state.releaseForms?.find(form => form.id === id)?.name || id])} onClick={() => patchDraft({ releaseFormIds: draft.releaseFormIds?.filter(value => value !== id) })}><Paperclip size={11} />{state.releaseForms?.find(form => form.id === id)?.name || id}<X size={11} /></button>)}</div>}
        {showFormat && <div className="if-format-toolbar"><SelectField label={t('interface.305')} width={100} value={String(draft.format.size)} options={[12, 14, 16, 18, 22].map(size => ({ value: String(size), label: `${size}px` }))} onChange={value => patchDraft({ format: { ...draft.format, size: Number(value) } })} /><button className={draft.format.bold ? 'active' : ''} aria-label={t('interface.306')} onClick={() => patchDraft({ format: { ...draft.format, bold: !draft.format.bold } })}><b>B</b></button><button className={draft.format.italic ? 'active' : ''} aria-label={t('interface.307')} onClick={() => patchDraft({ format: { ...draft.format, italic: !draft.format.italic } })}><i>I</i></button><button className="if-format-color-button" aria-label={t('interface.309')} aria-haspopup="dialog" aria-expanded={!!formatColorAnchor} onClick={event => { const anchor = event.currentTarget; setFormatColorAnchor(value => value ? null : anchor) }}><span style={{ background: draft.format.color }} />{t('interface.308')}</button><button onClick={() => patchDraft({ format: emptyDraft().format })}>{t('interface.310')}</button><button aria-label={t('interface.311')} onClick={() => { setShowFormat(false); setFormatColorAnchor(null) }}><X size={13} /></button></div>}
        {slashQuery !== null && <div className="if-slash-scripts"><strong>{t('interface.312')}</strong>{state.scripts.filter(script => `${displayScriptTitle(script.title)} ${displaySample(script.text)}`.toLowerCase().includes(slashQuery.toLowerCase())).slice(0, 5).map(script => <button key={script.id} onClick={() => chooseScript(script)}><BookOpen size={12} /><span>{displayScriptTitle(script.title)}<small>{displaySample(script.text).slice(0, 70)}</small></span></button>)}</div>}
        <textarea ref={inputRef} className="if-draft-input" aria-label={t('ui.281')} title={t('ui.282')} value={draft.text} maxLength={6500} onChange={event => patchDraft({ text: event.target.value })} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send() } }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (event.dataTransfer.files.length) void uploadFiles(event.dataTransfer.files) }} placeholder={fan.blocked ? t('interface.314') : fan.restricted ? t('interface.315') : subscribeRequired ? t('subscription.notice') : t('ui.283')} style={{ fontWeight: draft.format.bold ? 700 : 400, fontStyle: draft.format.italic ? 'italic' : 'normal', color: draft.format.color, fontSize: draft.format.size }} disabled={fan.blocked || fan.restricted || subscribeRequired} rows={2} />
        <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*" hidden onChange={event => { if (event.target.files) void uploadFiles(event.target.files) }} />
        <div className="if-composer-bottom"><div className="if-composer-icons"><IconButton label={t('interface.020')} disabled={uploading || gifSelected} onClick={() => fileRef.current?.click()}>{uploading ? <Loader2 className="if-spinning" size={18} /> : <FolderClosed size={20} />}</IconButton><IconButton label={t('interface.021')} active={gifOpen} disabled={(!gifSelected && !!draft.attachments.length) || draft.price > 0 || !!draft.creatorTags.length || !!draft.releaseFormIds?.length || fan.blocked || fan.restricted || subscribeRequired} onClick={() => { close(); setSeliAnchor(null); setEmojiPicker(false); setAiOpen(false); setGifOpen(value => !value) }}><span className="if-gif-icon">GIF</span></IconButton><IconButton label={t('interface.022')} disabled={gifSelected} onClick={() => open('vault')}><Images size={18} /></IconButton><IconButton label={t('interface.023')} onClick={() => open('schedule')}><CalendarCheck size={20} /></IconButton><IconButton label={t('interface.024')} disabled={gifSelected} active={draft.price > 0} onClick={() => open('price')}><BadgeDollarSign size={20} /></IconButton><IconButton label={t('interface.025')} disabled={gifSelected} active={draft.creatorTags.length > 0 || !!draft.releaseFormIds?.length} onClick={() => open('tags')}><AtSign size={18} /></IconButton><IconButton label={t('interface.026')} active={showFormat} onClick={() => { setShowFormat(value => !value); setFormatColorAnchor(null) }}><span className="if-format-icon">Aa</span></IconButton><IconButton label={t('interface.027')} onClick={() => open('translate')}><Languages size={18} /></IconButton><IconButton label={t('voice.open')} active={voiceOpen} disabled={fan.blocked || fan.restricted || subscribeRequired} onClick={() => { close(); setSeliAnchor(null); setVoiceOpen(true) }}><span className="if-voice-trigger"><Sparkles size={10} className="if-voice-sparkle"/><Mic size={18}/></span></IconButton></div><div className="if-send-actions">{(draft.text || draft.attachments.length || draft.price || draft.scheduledAt || draft.replyToId || draft.creatorTags.length || draft.releaseFormIds?.length) && <button className="if-clear-draft" onClick={() => { act('CLEAR_DRAFT'); setShowFormat(false) }}>{t('interface.316')}</button>}<button className="if-send" onClick={send} disabled={sendUnavailable}>{draft.scheduledAt ? t('ui.284') : t('ui.285')}</button></div></div>
        <div className="if-composer-footnote"><span>{fan.blocked || fan.restricted ? t('interface.317') : t('interface.033')}</span><span>{draft.text.length ? `${draft.text.length}/6500 · ` : ''}{t('interface.210')}</span></div>
      </div>
    </>}
    {fan && <VoiceEmotionDialog key={`${cid}:${fid}`} open={voiceOpen} text={draft.text} disabled={fan.blocked || fan.restricted || subscribeRequired} onClose={() => setVoiceOpen(false)} notify={notify}/>}
    {seliAnchor && fan && <AnchoredPopover title={t('chat.seliTitle')} anchor={seliAnchor} width={360} align="end" onClose={() => setSeliAnchor(null)} className="if-seli-popover"><div className="if-seli-suggestions"><header><strong>{t('chat.seliTitle')}</strong><IconButton label={t('ui.395')} onClick={() => setSeliAnchor(null)}><X size={16}/></IconButton></header><p>{t('chat.seliHint')}</p>{sampleSeli(fan, messages.map(message => ({ ...message, text: displaySample(message.text) })), t('chat.seliLanguage'), 6, seliRevision).map((text, index) => <button key={index} title={t('chat.seliUse')} disabled={fan.blocked || fan.restricted || subscribeRequired} onClick={() => { patchDraft({ text }); setSeliAnchor(null); inputRef.current?.focus() }}>{text}</button>)}<button className="if-seli-regenerate" onClick={() => setSeliRevision(value => value + 1)}><RefreshCw size={14}/>{t('chat.seliRefresh')}</button></div></AnchoredPopover>}
    {formatColorAnchor && <AnchoredPopover title={t('interface.309')} anchor={formatColorAnchor} onClose={() => setFormatColorAnchor(null)} width={220} className="if-chat-color-popover"><div className="if-chat-color-palette">{['#263247', '#222222', '#666666', '#999999', '#356aff', '#7b61ff', '#d65c91', '#e64f4f', '#e3952d', '#358a67', '#3799b5', '#986d4b'].map(color => <button key={color} aria-label={`${t('interface.309')} ${color}`} aria-pressed={draft.format.color === color} style={{ background: color }} onClick={() => { patchDraft({ format: { ...draft.format, color } }); setFormatColorAnchor(null) }}>{draft.format.color === color ? '✓' : ''}</button>)}</div></AnchoredPopover>}
    {emojiPicker && <AnchoredPopover title={t('interface.028')} anchor={emojiAnchor} onClose={() => setEmojiPicker(false)} width={400} className="if-emoji-popover"><EmojiPicker onPick={insertText} /></AnchoredPopover>}
    {dialog && fan && (dialog === 'schedule' ? <ScheduleMessageDialog initialScheduledAt={draft.scheduledAt} now={now} onClose={close} onSave={scheduledAt => { patchDraft({ scheduledAt }); close() }} onRemove={() => { patchDraft({ scheduledAt: undefined }); close() }}/> : dialog === 'price' ? <MessagePriceDialog initialPrice={draft.price} messages={messages} onClose={close} onSave={price => { patchDraft({ price, lockedText: price > 0, attachments: draft.attachments.map(item => ({ ...item, free: price === 0 ? true : item.free })) }); close() }}/> : dialog === 'timed-message' || dialog === 'timer' ? <TimedMessageDialog initialMode={dialog === 'timer' ? 'reminder' : 'timed'} initialDraft={draft} onClose={close}/> : dialog === 'lists' ? <FanListsDialog creatorId={cid} fanId={fan.id} onClose={close} /> : dialog === 'scripts' || dialog === 'more' ? <AnchoredPopover title={titles()[dialog]} anchor={popoverAnchor} onClose={close} align={dialog === 'more' ? 'end' : 'start'} width={dialog === 'scripts' ? Math.min(1260, window.innerWidth - 40) : 240} placement={dialog === 'scripts' ? 'top' : 'bottom'} className={dialog === 'scripts' ? 'if-scripts-popover' : 'if-fan-menu-popover'}>{dialogBody()}</AnchoredPopover> : <Modal title={dialog === 'notes' ? t('notes.add') : titles()[dialog]} onClose={close} width={dialog === 'notes' || dialog === 'emoji' ? 640 : dialog === 'script-preview' ? 570 : undefined} closable={!['notes', 'emoji', 'script-preview'].includes(dialog)} maskClosable={dialog !== 'script-preview'} className={`if-tool-dialog if-tool-dialog-${dialog}`} wide={['gallery', 'pinned', 'forward'].includes(dialog)}>{dialogBody()}</Modal>)}
    {vaultOpen && fan && <Modal title={t('popup.vault')} width={1100} header={false} maskClosable={false} onClose={() => setVaultOpen(false)} className="if-vault-modal"><ChatMediaPicker media={state.media.filter(item => !(mediaTarget === 'preview' ? previewDraft : draft).attachments.some(attachment => attachment.mediaId === item.id))} messages={messages} selectedIds={vaultSelection} onSelect={selectVaultMedia} />{vaultSelection.length > 0 && <div className="if-vault-selection-bar"><button aria-label={t('popup.clear')} disabled={!vaultSelection.length} onClick={() => setVaultSelection([])}><Trash2 size={17} /></button><span>{t('popup.chosen', [vaultSelection.length, 40 - (mediaTarget === 'preview' ? previewDraft : draft).attachments.length])}</span><button className="if-primary" disabled={!vaultSelection.length} onClick={addVaultMedia}>{t('popup.add')}</button></div>}<footer className="if-vault-modal-footer"><button className="if-secondary" onClick={() => setVaultOpen(false)}>{t('popup.close')}</button></footer></Modal>}

    {tagContext && fan && <CreatorTagsDialog creators={state.creators} releaseForms={state.releaseForms?.filter(form => !form.creatorId || form.creatorId === cid)} selectedReleaseFormIds={tagContext.target === 'preview' ? previewDraft.releaseFormIds : tagContext.target === 'message' ? messages.find(message => message.id === tagContext.messageId)?.releaseFormIds : draft.releaseFormIds} selectedIds={tagContext.target === 'preview' ? previewDraft.creatorTags : tagContext.target === 'message' ? messages.find(message => message.id === tagContext.messageId)?.creatorTags ?? [] : draft.creatorTags} onClose={() => setTagContext(null)} onAdd={(creatorTags, releaseFormIds) => { if (tagContext.target === 'preview') setPreviewDraft(value => ({ ...value, creatorTags, releaseFormIds })); else if (tagContext.target === 'message') act('SET_MESSAGE_TAGS', { creatorTags, releaseFormIds }, tagContext.messageId); else patchDraft({ creatorTags, releaseFormIds }); setTagContext(null) }} />}
    {mediaPreview && <MediaPreviewDialog media={mediaPreview.media} initialIndex={mediaPreview.initialIndex} onClose={() => setMediaPreview(null)} />}
  </section>
}
