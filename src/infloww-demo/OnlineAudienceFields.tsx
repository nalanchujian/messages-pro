import { useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { displaySample, t } from './i18n'
import { SelectField } from './ProfileFields'
import { AnchoredPopover } from './ui'
import type { FanList, OnlineAudienceFilter } from './types'
import './audience.css'

export default function OnlineAudienceFields({ value, lists, onChange }: { value: OnlineAudienceFilter; lists: FanList[]; onChange: (next: OnlineAudienceFilter) => void }) {
  const anchor = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false), [query, setQuery] = useState('')
  const patch = (next: Partial<OnlineAudienceFilter>) => onChange({ ...value, ...next })
  const numberField = (field: 'minSpend' | 'minTips' | 'excludeMessagedHours', label: string, currency = false) => <label className="if-audience-field"><span>{label}</span><span className="if-audience-number">{currency && <span>$</span>}<input type="number" min={0} step={1} aria-label={label} value={value[field]} onChange={event => patch({ [field]: Math.max(0, Number(event.target.value) || 0) })} /></span></label>
  return <section className="if-audience-filters" aria-label={t('audience.filters')}>
    <div className="if-audience-filter-grid">
      <div className="if-audience-field"><span>{t('interface.162')}</span><SelectField label={t('interface.162')} value={value.status} options={[{ value: 'all', label: t('interface.102') }, { value: 'active', label: t('interface.103') }, { value: 'expired', label: t('interface.104') }]} onChange={status => patch({ status: status as OnlineAudienceFilter['status'] })} /></div>
      {numberField('minSpend', t('audience.minSpend'), true)}
      {numberField('minTips', t('audience.minTips'), true)}
      <div className="if-audience-field"><span>{t('audience.subscription')}</span><SelectField label={t('audience.subscription')} value={String(value.minSubscriptionMonths)} options={[{ value: '0', label: t('ui.197') }, ...Array.from({ length: 12 }, (_, index) => index + 1).map(months => ({ value: String(months), label: t('audience.months', [months]) }))]} onChange={months => patch({ minSubscriptionMonths: Number(months) })} /></div>
      {numberField('excludeMessagedHours', t('audience.recentHours'))}
      <div className="if-audience-field"><span>{t('audience.excludeLists')}</span><button ref={anchor} type="button" className="if-audience-list-trigger" aria-label={t('audience.excludeLists')} aria-haspopup="dialog" aria-expanded={open} onClick={() => { setOpen(current => !current); setQuery('') }}><span>{value.excludeListIds.length ? t('audience.listCount', [value.excludeListIds.length]) : t('audience.chooseLists')}</span><ChevronDown size={14}/></button>
        {open && <AnchoredPopover title={t('audience.excludeLists')} anchor={anchor.current} placement="bottom" width={300} onClose={() => setOpen(false)} className="if-audience-list-popover"><div className="if-select-search"><Search size={15}/><input autoFocus aria-label={t('audience.searchLists')} placeholder={t('audience.searchLists')} value={query} onChange={event => setQuery(event.target.value)} /></div><div className="if-audience-list-options">{lists.filter(list => displaySample(list.name).toLowerCase().includes(query.trim().toLowerCase())).map(list => <label key={list.id}><input type="checkbox" checked={value.excludeListIds.includes(list.id)} onChange={event => patch({ excludeListIds: event.target.checked ? [...value.excludeListIds, list.id] : value.excludeListIds.filter(id => id !== list.id) })}/><span>{displaySample(list.name)}</span></label>)}{!lists.some(list => displaySample(list.name).toLowerCase().includes(query.trim().toLowerCase())) && <p>{t('interface.extra.40')}</p>}</div></AnchoredPopover>}
      </div>
    </div>
    {!!value.excludeListIds.length && <div className="if-audience-exclusions">{lists.filter(list => value.excludeListIds.includes(list.id)).map(list => <span key={list.id}>{displaySample(list.name)}<button type="button" aria-label={t('audience.removeExclusion', [displaySample(list.name)])} onClick={() => patch({ excludeListIds: value.excludeListIds.filter(id => id !== list.id) })}><X size={12}/></button></span>)}</div>}
    <div className="if-audience-switches"><label><input type="checkbox" role="switch" checked={value.excludeCreators} onChange={event => patch({ excludeCreators: event.target.checked })}/>{t('audience.excludeCreators')}</label><label><input type="checkbox" checked={value.includeMuted} onChange={event => patch({ includeMuted: event.target.checked })}/>{t('interface.105')}</label></div>
  </section>
}
