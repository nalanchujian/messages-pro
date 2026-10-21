import { useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { getLocale, t } from './i18n'
import { IconButton, Modal } from './ui'
import { calendarDays, isPastScheduleDay, scheduleTimestamp } from './scheduleCalendar'
import './schedule-message.css'

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export default function ScheduleMessageDialog({ initialScheduledAt, now, onSave, onRemove, onClose }: { initialScheduledAt?: number; now: number; onSave: (at: number) => void; onRemove: () => void; onClose: () => void }) {
  const initial = new Date(initialScheduledAt && initialScheduledAt > now ? initialScheduledAt : Math.ceil((now + 600000) / 60000) * 60000)
  const [day, setDay] = useState(initial)
  const [month, setMonth] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1))
  const [hour, setHour] = useState(initial.getHours())
  const [minute, setMinute] = useState(initial.getMinutes())
  const [step, setStep] = useState<'date' | 'time'>('date')
  const [panel, setPanel] = useState<'days' | 'months' | 'years'>('days')
  const timeColumns = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (step === 'time') timeColumns.current?.querySelectorAll<HTMLElement>('[aria-selected=true]').forEach(option => { const column = option.parentElement; if (column) column.scrollTop = Math.max(0, option.offsetTop - column.offsetTop - column.clientHeight / 2 + option.offsetHeight / 2) })
  }, [step])
  const locale = getLocale() === 'zh' ? 'zh-CN' : 'en-US'
  const year = month.getFullYear(), monthIndex = month.getMonth(), decade = Math.floor(year / 10) * 10
  const selectedAt = scheduleTimestamp(day, hour, minute)
  const validTime = Number.isFinite(selectedAt) && selectedAt > now
  const labelDate = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(day)
  const labelTime = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: getLocale() === 'en' }).format(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute))
  const move = (amount: number, years = false) => setMonth(new Date(year + (years ? amount : 0), monthIndex + (years ? 0 : amount), 1))
  const dateStep = () => { setStep('date'); setPanel('days') }
  const canChooseHour = (value: number) => { const end = scheduleTimestamp(day, value, 59); return Number.isFinite(end) && end > now }
  return <Modal title={t('schedule.title')} width={520} closable={false} maskClosable={false} onClose={onClose} className="if-schedule-message-dialog">
    <div className="if-schedule-layout">
      <div className="if-schedule-tabs" role="tablist" aria-label={t('schedule.steps')}><button role="tab" aria-selected={step === 'date'} onClick={dateStep}>{labelDate}</button><button role="tab" aria-selected={step === 'time'} disabled={isPastScheduleDay(day, now)} onClick={() => setStep('time')}>{labelTime}</button></div>
      <div className="if-schedule-content" role="tabpanel" aria-label={t(step === 'date' ? 'chat.complete.date' : 'schedule.time')}>
        {step === 'date' ? <>
          <div className="if-schedule-calendar-header"><IconButton label={t('popup.previousYear')} onClick={() => move(panel === 'years' ? -10 : -1, true)}><ChevronsLeft size={16}/></IconButton>{panel === 'days' && <IconButton label={t('popup.previousMonth')} onClick={() => move(-1)}><ChevronLeft size={16}/></IconButton>}<div>{panel !== 'years' && <button onClick={() => setPanel(panel === 'months' ? 'days' : 'months')}>{new Intl.DateTimeFormat(locale, { month: 'short' }).format(month)}</button>}<button onClick={() => setPanel(panel === 'years' ? 'days' : 'years')}>{panel === 'years' ? `${decade}–${decade + 9}` : year}</button></div>{panel === 'days' && <IconButton label={t('popup.nextMonth')} onClick={() => move(1)}><ChevronRight size={16}/></IconButton>}<IconButton label={t('popup.nextYear')} onClick={() => move(panel === 'years' ? 10 : 1, true)}><ChevronsRight size={16}/></IconButton></div>
          {panel === 'days' ? <div className="if-schedule-calendar"><div className="if-schedule-weekdays">{Array.from({ length: 7 }, (_, index) => <span key={index}>{t(`schedule.weekday.${index}`)}</span>)}</div><div className="if-schedule-days" role="grid" aria-label={t('chat.complete.date')}>{calendarDays(year, monthIndex).map(date => {
            const other = date.getMonth() !== monthIndex, past = isPastScheduleDay(date, now)
            return <button type="button" role="gridcell" aria-label={dateKey(date)} aria-selected={sameDay(date, day)} aria-current={sameDay(date, new Date(now)) ? 'date' : undefined} disabled={other || past} className={`${other ? 'other-month' : ''} ${past && !other ? 'past' : ''}`} key={dateKey(date)} onClick={() => setDay(date)}><span>{date.getDate()}</span></button>
          })}</div></div> : panel === 'months' ? <div className="if-schedule-periods">{Array.from({ length: 12 }, (_, index) => <button key={index} aria-pressed={monthIndex === index} disabled={isPastScheduleDay(new Date(year, index + 1, 0), now)} onClick={() => { setMonth(new Date(year, index, 1)); setPanel('days') }}>{new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(year, index, 1))}</button>)}</div> : <div className="if-schedule-periods">{Array.from({ length: 12 }, (_, index) => decade - 1 + index).map(value => <button key={value} aria-pressed={year === value} disabled={isPastScheduleDay(new Date(value, 11, 31), now)} onClick={() => { setMonth(new Date(value, monthIndex, 1)); setPanel('months') }}>{value}</button>)}</div>}
        </> : <div className="if-schedule-time-panel"><div className="if-schedule-time-labels"><span>{t('chat.complete.hour')}</span><span>{t('chat.complete.minute')}</span><span>{t('schedule.period')}</span></div><div ref={timeColumns} className="if-schedule-time-columns"><div role="listbox" aria-label={t('chat.complete.hour')}>{Array.from({ length: 12 }, (_, index) => index + 1).map(value => { const candidate = value % 12 + (hour >= 12 ? 12 : 0); return <button role="option" aria-selected={hour % 12 === value % 12} key={value} disabled={!canChooseHour(candidate)} onClick={() => setHour(candidate)}>{String(value).padStart(2, '0')}</button> })}</div><div role="listbox" aria-label={t('chat.complete.minute')}>{Array.from({ length: 60 }, (_, value) => <button role="option" aria-selected={minute === value} key={value} disabled={!(scheduleTimestamp(day, hour, value) > now)} onClick={() => setMinute(value)}>{String(value).padStart(2, '0')}</button>)}</div><div role="listbox" aria-label={t('schedule.period')}>{[0, 12].map(value => <button role="option" key={value} aria-selected={(hour >= 12 ? 12 : 0) === value} disabled={!Array.from({ length: 12 }, (_, index) => index + value).some(canChooseHour)} onClick={() => setHour(hour % 12 + value)}>{t(value === 0 ? 'schedule.am' : 'schedule.pm')}</button>)}</div></div>{!validTime && <p className="if-schedule-time-error">{t('schedule.futureOnly')}</p>}</div>}
      </div>
      <footer className="if-schedule-footer">{initialScheduledAt && <button className="if-schedule-remove" onClick={onRemove}>{t('interface.303')}</button>}<button onClick={onClose}>{t('interface.072')}</button><button className="if-primary" disabled={step === 'date' ? isPastScheduleDay(day, now) : !validTime} onClick={() => { if (step === 'date') setStep('time'); else if (validTime) onSave(selectedAt) }}>{t(step === 'date' ? 'schedule.next' : 'schedule.save')}</button></footer>
    </div>
  </Modal>
}
