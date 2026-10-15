import { useEffect, useId, useRef, useState } from 'react'
import { ChevronUp, Image, LockKeyhole, LockKeyholeOpen, Mic, Play, Tags, Video } from 'lucide-react'
import { displaySample, getLocale, t } from './i18n'
import type { Media, Message } from './types'
import { money } from './store'
import { MediaView, Tooltip } from './ui'
import MediaPreviewDialog from './MediaPreviewDialog'
import './sales.css'

export function SalesMediaSummary({ media, text }: { media: Media[]; text: string }) {
  const stats = [
    { type: 'image', label: 'insights.sales.photo', icon: <Image size={13} /> },
    { type: 'video', label: 'insights.sales.video', icon: <Video size={13} /> },
    { type: 'audio', label: 'insights.sales.audio', icon: <Mic size={13} /> },
    { type: 'gif', label: 'insights.sales.gif', icon: <span className="if-sales-gif-icon">GIF</span> },
  ]
  return <div className="if-sales-hover-content"><div className="if-sales-media-counts">{stats.map(stat => {
    const count = media.filter(item => item.type === stat.type).length
    return count ? <span key={stat.type}>{t(stat.label)} {stat.icon}<b>{count}</b></span> : null
  })}</div>{text && <p>{displaySample(text)}</p>}</div>
}

function SalesItem({ message, media, onPreview, onCopy }: { message: Message; media: Media[]; onPreview: (media: Media[], index: number) => void; onCopy: (message: Message) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [hover, setHover] = useState<HTMLElement | null>(null)
  const tooltipId = useId()
  const date = new Intl.DateTimeFormat(getLocale() === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(message.createdAt)
  const visibleMedia = expanded ? media : media.slice(0, 6)
  return <article className="if-ppv-history-item">
    <div className="if-ppv-history-meta"><span className={message.purchasedAt ? 'if-ppv-price if-paid' : 'if-ppv-price'} title={message.purchasedAt ? t('ui.251') : t('ui.253')}>{message.purchasedAt ? <LockKeyholeOpen size={12} /> : <LockKeyhole size={12} />}{money(message.price)}</span><time dateTime={new Date(message.createdAt).toISOString()}>{date}</time></div>
    <div className="if-sales-message-card">
      {!!media.length && <div className={`if-sales-media-grid${expanded ? ' expanded' : ''}`}>
        {visibleMedia.map((item, index) => {
          const free = message.attachments.find(attachment => attachment.mediaId === item.id)?.free
          return <button type="button" key={item.id} className="if-sales-media-tile" aria-label={t('insights.sales.preview', [displaySample(item.title)])} aria-describedby={hover ? tooltipId : undefined} onClick={() => { setHover(null); onPreview(media, index) }} onMouseEnter={event => setHover(event.currentTarget)} onMouseLeave={() => setHover(null)} onFocus={event => setHover(event.currentTarget)} onBlur={() => setHover(null)}>
            <MediaView media={item} compact />
            {(item.type === 'video' || item.type === 'audio') && <span className="if-sales-play"><Play size={20} fill="currentColor" /></span>}
            {!free && <span className="if-sales-lock" aria-label={t(message.purchasedAt ? 'insights.sales.purchasedMedia' : 'insights.sales.lockedMedia')}>{message.purchasedAt ? <LockKeyholeOpen size={12} /> : <LockKeyhole size={12} />}</span>}
          </button>
        })}
      </div>}
      {!media.length && <p className="if-sales-text-only">{displaySample(message.text) || t('insights.sales.textOnly')}</p>}
      <div className="if-sales-item-actions">{media.length > 6 && <button type="button" className="if-sales-expand" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{t(expanded ? 'insights.sales.collapse' : 'insights.sales.readMore')}{expanded && <ChevronUp size={12} />}</button>}<button type="button" className="if-sales-copy" onClick={() => onCopy(message)}>{t('insights.sales.copy')}</button></div>
    </div>
    {hover && <Tooltip id={tooltipId} anchor={hover}><SalesMediaSummary media={media} text={message.text} /></Tooltip>}
  </article>
}

export default function SalesHistory({ messages, media, onCopy }: { messages: Message[]; media: Media[]; onCopy: (message: Message) => void }) {
  const [preview, setPreview] = useState<{ media: Media[]; index: number } | null>(null)
  useEffect(() => setPreview(null), [messages[0]?.creatorId, messages[0]?.fanId])
  if (!messages.length) return <div className="if-insight-empty"><Tags size={28} /><span>{t('ui.323')}</span></div>
  return <><div className="if-ppv-history">{[...messages].sort((a, b) => b.createdAt - a.createdAt).map(message => <SalesItem key={message.id} message={message} media={message.attachments.flatMap(attachment => { const found = media.find(item => item.id === attachment.mediaId); return found ? [found] : [] })} onPreview={(items, index) => setPreview({ media: items, index })} onCopy={onCopy} />)}</div>{preview && <MediaPreviewDialog media={preview.media} initialIndex={preview.index} onClose={() => setPreview(null)} />}</>
}

export function useChartDrag() {
  const scroll = useRef<HTMLDivElement>(null)
  const origin = useRef<{ x: number; scroll: number } | null>(null)
  return {
    ref: scroll,
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || event.target instanceof Element && event.target.closest('button')) return
      origin.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => { if (origin.current) event.currentTarget.scrollLeft = origin.current.scroll + origin.current.x - event.clientX },
    onPointerUp: () => { origin.current = null },
    onPointerCancel: () => { origin.current = null },
  }
}
