import { useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { displaySample, t } from './i18n'
import type { Media } from './types'
import { IconButton, MediaView } from './ui'
import './gif-strip.css'

export default function GifStrip({ media, selectedId, onChoose, onClose }: { media: Media[]; selectedId?: string; onChoose: (media: Media) => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const row = useRef<HTMLDivElement>(null)
  const results = media.filter(item => item.type === 'gif' && `${displaySample(item.title)} ${item.tags.map(displaySample).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <section className="if-inline-gifs" aria-label={t('interface.021')} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose() } }}>
    <div className="if-inline-gif-search"><IconButton label={t('gif.close')} onClick={onClose}><X size={19}/></IconButton><input type="search" autoFocus aria-label={t('gif.search')} placeholder={t('gif.placeholder')} value={query} onChange={event => { setQuery(event.target.value); if (row.current) row.current.scrollLeft = 0 }}/><IconButton label={t('gif.search')} onClick={() => row.current?.querySelector<HTMLButtonElement>('button')?.focus()}><Search size={18}/></IconButton></div>
    <div ref={row} className="if-inline-gif-strip" aria-label={t('gif.results')} onKeyDown={event => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
      const buttons = Array.from(row.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      const current = buttons.indexOf(event.target as HTMLButtonElement)
      const next = buttons[current + (event.key === 'ArrowRight' ? 1 : -1)]
      if (next) { event.preventDefault(); next.focus(); next.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }
    }}>{results.map(item => <button key={item.id} type="button" aria-label={t('gif.choose', [displaySample(item.title)])} aria-pressed={selectedId === item.id} onClick={() => onChoose(item)}><MediaView compact media={item}/></button>)}{!results.length && <p>{t('gif.empty')}</p>}</div>
  </section>
}
