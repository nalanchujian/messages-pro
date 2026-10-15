import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Images, Send } from 'lucide-react'
import type { Media, Message, Script } from './types'
import { displaySample, displayScriptCategory, displayScriptTitle, getLocale, t } from './i18n'
import { MediaView } from './ui'
import MediaPreviewDialog from './MediaPreviewDialog'
import { money } from './store'
import { latestMediaActivity } from './mediaActivity'
import './scripts-popover.css'

function mediaState(mediaId: string, messages: Message[]): string | undefined {
  const activity = latestMediaActivity(messages.filter(message => message.status !== 'withdrawn'), mediaId)
  return activity?.kind === 'unpaid' ? 'unbought' : activity?.kind
}

function HoverDetails({ script, media, messages, anchor, onEnter, onLeave, onDismiss, onPreviewChange }: { script: Script; media: Media[]; messages: Message[]; anchor: HTMLElement; onEnter: () => void; onLeave: () => void; onDismiss: () => void; onPreviewChange: (open: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ left: 0, top: 0, visibility: 'hidden' as 'hidden' | 'visible' })
  const [offset, setOffset] = useState(0)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    node.showPopover()
    const place = () => {
      const rect = anchor.getBoundingClientRect(), box = node.getBoundingClientRect()
      const above = rect.top - box.height - 8
      setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - box.width - 8)), top: Math.max(8, above > 8 ? above : Math.min(rect.bottom + 8, window.innerHeight - box.height - 8)), visibility: 'visible' })
    }
    place()
    const observer = new ResizeObserver(place); observer.observe(node)
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true)
    return () => { observer.disconnect(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); node.hidePopover() }
  }, [anchor])
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || previewIndex !== null) return
      const overlays = Array.from(document.querySelectorAll<HTMLElement>('dialog[open], [popover]:popover-open'))
      if (overlays.at(-1) !== ref.current) return
      event.preventDefault(); onDismiss()
    }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [previewIndex, onDismiss])
  return <><div ref={ref} popover="manual" role="dialog" aria-label={displayScriptTitle(script.title)} className="if-script-hover-details" style={position} onPointerEnter={onEnter} onPointerLeave={() => { if (previewIndex === null) onLeave() }}>
    <p className="if-script-hover-copy"><strong>{displayScriptTitle(script.title)}</strong><span> | </span>{displaySample(script.text)}</p>
    {!!media.length && <div className="if-script-hover-medias"><div className="if-script-hover-window"><div className="if-script-hover-strip" style={{ transform: `translateX(-${offset * 148}px)` }}>{media.map((item, index) => { const status = mediaState(item.id, messages); return <button key={item.id} aria-label={t('chat.complete.previewMedia', [displaySample(item.title)])} onClick={() => { onEnter(); onPreviewChange(true); setPreviewIndex(index) }}><MediaView media={item} compact />{status && <span className={`if-script-media-state ${status}`}>{t(`chat.complete.mediaStatus.${status}`)}</span>}</button> })}</div></div>{media.length > 3 && <div className="if-script-carousel-controls"><button aria-label={t('chat.complete.previousMedia')} disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - 1))}><ChevronLeft size={22} /></button><button aria-label={t('chat.complete.nextMedia')} disabled={offset >= media.length - 3} onClick={() => setOffset(value => Math.min(media.length - 3, value + 1))}><ChevronRight size={22} /></button></div>}</div>}
    {script.note && <p className="if-script-hover-note"><span>{t('chat.complete.note')}</span> {displaySample(script.note)}</p>}{script.founder && <p className="if-script-hover-note"><span>{t('chat.complete.founder')}</span> {script.founder}</p>}
  </div>{previewIndex !== null && <MediaPreviewDialog media={media} initialIndex={previewIndex} onClose={() => { setPreviewIndex(null); onPreviewChange(false); onEnter() }} />}</>
}

export function ScriptRow({ script, media, messages, onChoose }: { script: Script; media: Media[]; messages: Message[]; onChoose: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const row = useRef<HTMLDivElement>(null)
  const viewerOpen = useRef(false)
  const pointerWithin = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hover, setHover] = useState(false)
  const history = messages.filter(message => message.scriptId === script.id && message.direction === 'outbound' && ['sent', 'read'].includes(message.status)).at(-1)
  const scriptMedia = script.attachments.map(item => media.find(entry => entry.id === item.mediaId)).filter((item): item is Media => !!item)
  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null }
  const show = () => { clear(); if (!hover) timer.current = setTimeout(() => setHover(true), 1000) }
  const hide = () => {
    clear()
    if (viewerOpen.current) return
    timer.current = setTimeout(() => { if (!viewerOpen.current && !pointerWithin.current && !row.current?.contains(document.activeElement)) setHover(false) }, 180)
  }
  const dismiss = () => { clear(); setHover(false) }
  useEffect(() => () => clear(), [])
  return <div ref={row} className={`if-script-row${history ? ' previously-sent' : ''}`} onPointerEnter={()=>{pointerWithin.current=true;show()}} onPointerLeave={event => { if (!(event.relatedTarget instanceof Node) || !row.current?.contains(event.relatedTarget)){pointerWithin.current=false;hide()} }} onFocusCapture={show} onBlurCapture={event => { if (!(event.relatedTarget instanceof Node) || !row.current?.contains(event.relatedTarget)) hide() }}>
    <button ref={ref} onClick={() => { clear(); setHover(false); onChoose() }}><strong>{displayScriptTitle(script.title)}</strong><p>{displaySample(script.text)}</p>{history && <span className="if-script-sent-history" title={t('chat.complete.lastSent', [new Date(history.createdAt).toLocaleString(getLocale() === 'zh' ? 'zh-CN' : 'en-US')])}><Send size={13} />{t('chat.complete.sentBy', [history.sender])}</span>}<small>{script.attachments.length > 0 && <><Images size={13} />{script.attachments.length} · </>}{money(script.price)}</small></button>
    {hover && ref.current && <HoverDetails script={script} media={scriptMedia} messages={messages} anchor={ref.current} onEnter={()=>{pointerWithin.current=true;clear()}} onLeave={()=>{pointerWithin.current=false;hide()}} onDismiss={dismiss} onPreviewChange={open => { viewerOpen.current = open; clear() }} />}
  </div>
}

export function ScriptCategoryTabs({ scripts, category, onChange }: { scripts: Script[]; category: string; onChange: (value: string) => void }) {
  return <div className="if-script-category-tabs" role="tablist" aria-label={t('interface.extra.41')}>{['all', ...new Set(scripts.map(script => script.category))].map(value => <button key={value} role="tab" aria-selected={category === value} onClick={() => onChange(value)}>{value === 'all' ? t('interface.361') : displayScriptCategory(value)}</button>)}</div>
}
