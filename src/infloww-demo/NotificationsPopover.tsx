import { useEffect, useMemo, useRef, useState } from 'react'
import { BadgeCheck, Bell, MessageSquareText, RefreshCw, Smile, Star, UserRoundPlus } from 'lucide-react'
import { displaySample, getLocale, t } from './i18n'
import { displayName, useDemo } from './store'
import { AnchoredPopover, IconButton } from './ui'
import EmojiPicker from './EmojiPicker'
import type { Notification } from './types'
import './notification-popover.css'

const kinds: Notification['kind'][] = ['subscription', 'tip', 'purchase', 'platform']
const tabLabel = (kind: Notification['kind']) => t(`notification.tab.${kind}`)

export default function NotificationsPopover({ anchor, onClose, replies, onReplyChange }: {
  anchor: HTMLElement; onClose: () => void; replies: Record<string, string>;
  onReplyChange: (id: string, text: string) => void;
}) {
  const { state, creator, dispatch } = useDemo()
  const [kind, setKind] = useState<Notification['kind']>('subscription')
  const [refreshing, setRefreshing] = useState(false)
  const [emoji, setEmoji] = useState<{ id: string; anchor: HTMLElement } | null>(null)
  const list = useRef<HTMLDivElement>(null)
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})
  const pending = useRef(new Map<string, string>())
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const notifications = useMemo(() => state.notifications.filter(item => item.creatorId === creator.id), [state.notifications, creator.id])
  const visible = useMemo(() => notifications.filter(item => item.kind === kind).sort((a, b) => b.at - a.at), [notifications, kind])
  useEffect(() => { if (list.current) list.current.scrollTop = 0; setEmoji(null) }, [kind])
  useEffect(() => () => { if (refreshTimer.current) clearTimeout(refreshTimer.current) }, [])
  useEffect(() => {
    for (const [id, text] of pending.current) {
      const item = notifications.find(item => item.id === id)
      if (item?.repliedAt && replies[id] === text) onReplyChange(id, '')
      pending.current.delete(id)
    }
  }, [notifications, replies, onReplyChange])
  function refresh() {
    setRefreshing(true)
    dispatch({ type: 'TICK', payload: Date.now() + state.clockOffset })
    refreshTimer.current = setTimeout(() => setRefreshing(false), 300)
  }
  function openChat(item: Notification) {
    dispatch({ type: 'OPEN_NOTIFICATION_CHAT', creatorId: creator.id, payload: { notificationId: item.id } })
    onClose()
  }
  function send(item: Notification) {
    const text = (replies[item.id] ?? '').trim()
    if (!text || item.repliedAt || pending.current.has(item.id)) return
    pending.current.set(item.id, replies[item.id])
    setEmoji(null)
    dispatch({ type: 'NOTIFICATION_REPLY', creatorId: creator.id, payload: { notificationId: item.id, text } })
  }
  const locale = getLocale() === 'zh' ? 'zh-CN' : 'en-US'
  return <>
    <AnchoredPopover title={t('interface.106')} anchor={anchor} onClose={onClose} placement="bottom" offset={2} width={560} className="if-notification-popover">
      <header className="if-notification-popover-header"><h2>{t('interface.106')}</h2><IconButton label={t('ui.201')} disabled={refreshing} onClick={refresh}><RefreshCw size={17} className={refreshing ? 'if-spinning' : undefined}/></IconButton></header>
      <nav className="if-notification-category-tabs" role="tablist" aria-label={t('notification.categories')}>{kinds.map((entry, index) => {
        const count = notifications.filter(item => item.kind === entry && item.unread).length
        return <button key={entry} ref={node => { tabs.current[index] = node }} type="button" id={`if-notification-tab-${entry}`} role="tab" aria-selected={kind === entry} aria-controls="if-notification-feed" tabIndex={kind === entry ? 0 : -1} onClick={() => setKind(entry)} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next=event.key==='Home'?0:event.key==='End'?kinds.length-1:(index+(event.key==='ArrowRight'?1:-1)+kinds.length)%kinds.length;setKind(kinds[next]);tabs.current[next]?.focus() } }}>{tabLabel(entry)}{count > 0 && <b aria-label={t('notification.unreadCount', [count])}>{count}</b>}</button>
      })}</nav>
      <div className="if-notification-feed" id="if-notification-feed" role="tabpanel" aria-labelledby={`if-notification-tab-${kind}`} ref={list}>
        {visible.map(item => {
          const recipient = state.fans[creator.id]?.find(fan => fan.id === item.fanId)
          const unavailable = !recipient || recipient.blocked || recipient.restricted || (recipient.subscriptionStatus === 'expired' && !recipient.creatorSubscribed)
          const name = recipient ? displayName(recipient) : displaySample(item.title)
          const labels = creator.lists.filter(entry => recipient?.listIds.includes(entry.id)).map(entry => displaySample(entry.name))
          const open = recipient && <button type="button" className="if-notification-open-chat" aria-label={t('notification.openTab', [name])} title={t('notification.openTab', [name])} onClick={() => openChat(item)}><MessageSquareText size={16}/></button>
          const date = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(item.at)
          const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: getLocale() !== 'zh' }).format(item.at)
          return <article key={item.id} className="if-notification-record">
            <span className="if-notification-fan-avatar" aria-hidden="true">{kind === 'platform' ? <Bell size={20}/> : name.split(/\s+/).map(part => part[0]).slice(0,2).join('').toUpperCase()}<i><UserRoundPlus size={11}/></i></span>
            <div className="if-notification-record-content">
              <div className="if-notification-fan-name"><strong>{kind === 'platform' ? 'OnlyFans' : name}</strong>{recipient?.verified && kind !== 'platform' && <BadgeCheck size={12}/>}<span>{kind !== 'platform' && recipient?.handle}</span></div>
              {labels.length > 0 && <div className="if-notification-fan-lists"><Star size={13} fill="currentColor"/><span title={labels.join(' · ')}>{labels.join(' · ')}</span></div>}
              <p className="if-notification-record-text">{displaySample(item.text)}</p>
              <time className="if-notification-record-date" dateTime={new Date(item.at).toISOString()}>{t('notification.dateTime', [date, time])}</time>
              {item.repliedAt ? <div className="if-notification-response-row"><span className="if-notification-responded"><i/>{t('notification.respondedBy', [item.repliedBy || t('notification.teamMember')])}</span>{open}</div> : kind !== 'platform' && recipient ? <form className="if-notification-response-row" onSubmit={event => { event.preventDefault(); if (!unavailable) send(item) }}>
                <div className="if-notification-reply-input"><button type="button" className="if-notification-emoji-button" aria-label={t('interface.028')} disabled={unavailable} onClick={event => { const current=event.currentTarget;setEmoji(value=>value?.id===item.id?null:{id:item.id,anchor:current}) }}><Smile size={21}/></button><input ref={node => { inputs.current[item.id]=node }} aria-label={t('ui.205', [name])} placeholder={unavailable ? t('ui.204') : t('interface.110')} disabled={unavailable} maxLength={6500} value={replies[item.id] ?? ''} onChange={event => onReplyChange(item.id, event.target.value)}/></div>
                <button className="if-notification-reply-button" type="submit" disabled={unavailable || !(replies[item.id] ?? '').trim()}>{t('interface.111')}</button>{open}
              </form> : <div className="if-notification-response-row if-notification-platform-actions">{open}</div>}
            </div>
          </article>
        })}
        {!visible.length && <div className="if-notification-feed-empty"><Bell size={28}/><p>{t('ui.206')}</p></div>}
      </div>
    {emoji && <AnchoredPopover title={t('interface.028')} anchor={emoji.anchor} onClose={() => setEmoji(null)} width={360} placement="top" className="if-emoji-popover"><EmojiPicker onPick={value => { const input=inputs.current[emoji.id];const text=replies[emoji.id] ?? '';const start=input?.selectionStart ?? text.length;const end=input?.selectionEnd ?? start;onReplyChange(emoji.id, text.slice(0,start)+value+text.slice(end));requestAnimationFrame(()=>{input?.focus();input?.setSelectionRange(start+value.length,start+value.length)}) }}/></AnchoredPopover>}
    </AnchoredPopover>
  </>
}
