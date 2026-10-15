import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react'
import { AnchoredPopover } from './ui'
import { getLocale, t } from './i18n'

type Option = { value: string; label: string }
export function SelectField({ label, value, options, onChange, searchable = false, width = 200 }: { label: string; value: string; options: Option[]; onChange: (value: string) => void; searchable?: boolean; width?: number }) {
  const anchor = useRef<HTMLButtonElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const results = options.filter(option => option.label.toLowerCase().includes(query.trim().toLowerCase()))
  useEffect(() => { if (open) { setQuery(''); setActive(Math.max(0, options.findIndex(option => option.value === value))); requestAnimationFrame(() => searchable ? search.current?.focus() : list.current?.focus()) } }, [open])
  function choose(next: string) { onChange(next); setOpen(false); anchor.current?.focus() }
  function keys(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setActive(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % Math.max(1, results.length)) }
    if (event.key === 'Enter' && results[active]) { event.preventDefault(); choose(results[active].value) }
  }
  return <span className="if-select-field"><button ref={anchor} type="button" role="combobox" aria-label={label} aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen(value => !value)} onKeyDown={event => { if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setOpen(true) } }}><span className="if-select-value">{options.find(option => option.value === value)?.label ?? value}</span><ChevronDown size={14} /></button>
    {open && <AnchoredPopover title={label} anchor={anchor.current} placement="bottom" width={width} onClose={() => setOpen(false)} className="if-select-popover">{searchable && <div className="if-select-search"><Search size={15} /><input ref={search} aria-label={t('popup.searchOptions')} placeholder={t('popup.searchOptions')} value={query} onChange={event => { setQuery(event.target.value); setActive(0) }} onKeyDown={keys} /></div>}<div ref={list} role="listbox" aria-label={label} tabIndex={-1} onKeyDown={keys}>{results.map((option, index) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} className={active === index ? 'keyboard-active' : ''} onMouseEnter={() => setActive(index)} onClick={() => choose(option.value)}>{option.label}{option.value === value && <Check size={14} />}</button>)}{!results.length && <p>{t('interface.extra.40')}</p>}</div></AnchoredPopover>}
  </span>
}

const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const fromValue = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date()
export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const anchor = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => fromValue(value))
  const [view, setView] = useState<'date' | 'month' | 'year'>('date')
  const locale = getLocale() === 'zh' ? 'zh-CN' : 'en-US'
  const year = month.getFullYear(), monthIndex = month.getMonth()
  const start = new Date(year, monthIndex, 1)
  const offset = (start.getDay() - (getLocale() === 'zh' ? 1 : 0) + 7) % 7
  const days = Array.from({ length: 42 }, (_, index) => new Date(year, monthIndex, index - offset + 1))
  const yearStart = Math.floor(year / 10) * 10
  function move(delta: number, byYear = false) { setMonth(new Date(year + (byYear ? delta : 0), monthIndex + (byYear ? 0 : delta), 1)) }
  function choose(date: Date) { onChange(dayKey(date)); setOpen(false); anchor.current?.focus() }
  return <span className="if-date-field"><button ref={anchor} type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={() => { if (!open) { setMonth(fromValue(value)); setView('date') }; setOpen(value => !value) }}><span className={value ? '' : 'placeholder'}>{value ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(fromValue(value)) : t('popup.selectDate')}</span><CalendarDays size={16} /></button>
    {open && <AnchoredPopover title={label} anchor={anchor.current} width={288} placement="bottom" onClose={() => setOpen(false)} className="if-date-popover"><div className="if-calendar-header"><button aria-label={t('popup.previousYear')} onClick={() => move(view === 'year' ? -10 : -1, true)}><ChevronsLeft size={15} /></button>{view === 'date' && <button aria-label={t('popup.previousMonth')} onClick={() => move(-1)}><ChevronLeft size={15} /></button>}<div><button onClick={() => setView(view === 'year' ? 'date' : 'year')}>{view === 'year' ? `${yearStart}–${yearStart + 9}` : year}</button>{view !== 'year' && <button onClick={() => setView(view === 'month' ? 'date' : 'month')}>{new Intl.DateTimeFormat(locale, { month: 'short' }).format(month)}</button>}</div>{view === 'date' && <button aria-label={t('popup.nextMonth')} onClick={() => move(1)}><ChevronRight size={15} /></button>}<button aria-label={t('popup.nextYear')} onClick={() => move(view === 'year' ? 10 : 1, true)}><ChevronsRight size={15} /></button></div>
      {view === 'date' ? <><div className="if-calendar-weekdays">{Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2023, 0, 1 + index + (getLocale() === 'zh' ? 1 : 0)))).map(day => <span key={day}>{day}</span>)}</div><div className="if-calendar-days" role="grid" aria-label={label}>{days.map(date => <button type="button" key={dayKey(date)} aria-label={dayKey(date)} aria-selected={dayKey(date) === value} className={`${date.getMonth() !== monthIndex ? 'other-month' : ''} ${dayKey(date) === dayKey(new Date()) ? 'today' : ''}`} onClick={() => choose(date)}>{date.getDate()}</button>)}</div><footer><button onClick={() => choose(new Date())}>{t('popup.today')}</button></footer></> : view === 'month' ? <div className="if-calendar-months">{Array.from({ length: 12 }, (_, index) => <button key={index} aria-selected={index === monthIndex} onClick={() => { setMonth(new Date(year, index, 1)); setView('date') }}>{new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(year, index, 1))}</button>)}</div> : <div className="if-calendar-months">{Array.from({ length: 12 }, (_, index) => yearStart - 1 + index).map(value => <button key={value} aria-selected={year === value} onClick={() => { setMonth(new Date(value, monthIndex, 1)); setView('month') }}>{value}</button>)}</div>}
    </AnchoredPopover>}
  </span>
}
