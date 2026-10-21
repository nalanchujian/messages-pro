import { useState } from 'react'
import { ArrowLeft, FileText, Link, ListFilter, Search } from 'lucide-react'
import type { Creator, ReleaseForm } from './types'
import { getLocale, t } from './i18n'
import { AnchoredPopover, Avatar, IconButton, Modal } from './ui'
import './creator-tags.css'

export default function CreatorTagsDialog({ creators, selectedIds, releaseForms = [], selectedReleaseFormIds = [], onAdd, onClose }: { creators: Creator[]; selectedIds: string[]; releaseForms?: ReleaseForm[]; selectedReleaseFormIds?: string[]; onAdd: (ids: string[], releaseFormIds: string[]) => void; onClose: () => void }) {
  const [selected, setSelected] = useState([...selectedIds])
  const [forms, setForms] = useState([...selectedReleaseFormIds])
  const [tab, setTab] = useState<'user' | 'release'>('user')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null)
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('recent')
  const [order, setOrder] = useState('descending')
  const compare = (a: { name: string; createdAt?: number }, b: { name: string; createdAt?: number }) => (sort === 'name' ? a.name.localeCompare(b.name, getLocale()) : (a.createdAt || 0) - (b.createdAt || 0)) * (order === 'ascending' ? 1 : -1)
  const results = creators.filter(creator => (status === 'all' || (creator.verificationStatus ?? 'verified') === status) && creator.name.toLowerCase().includes(query.trim().toLowerCase())).sort(compare)
  const formResults = releaseForms.filter(form => (status === 'all' || form.status === status) && form.name.toLowerCase().includes(query.trim().toLowerCase())).sort(compare)
  const toggle = (id: string, values: string[], update: (values: string[]) => void) => update(values.includes(id) ? values.filter(value => value !== id) : [...values, id])
  const selectFilter = (kind: 'status' | 'sort' | 'order', value: string) => { if (kind === 'status') setStatus(value); else if (kind === 'sort') setSort(value); else setOrder(value); setFilterAnchor(null) }
  const finish = () => { onAdd(selected, forms); onClose() }
  return <Modal title={t('interface.263')} width={520} header={false} maskClosable={false} onClose={finish} className="if-creator-tags-dialog if-tool-dialog"><div className="if-creator-tags-layout"><div className="if-creator-tags-header">{searchOpen ? <><IconButton label={t('interface.008')} onClick={() => { setSearchOpen(false); setQuery('') }}><ArrowLeft size={18} /></IconButton><input aria-label={t('chat.complete.searchTags')} placeholder={t('chat.complete.searchTags')} value={query} onChange={event => setQuery(event.target.value)} autoFocus /></> : <><h2>{t('interface.263')}</h2><IconButton label={t('chat.complete.searchTags')} onClick={() => setSearchOpen(true)}><Search size={18} /></IconButton></>}<IconButton label={t('chat.complete.filters')} active={!!filterAnchor || status !== 'all'} onClick={event => setFilterAnchor(value => value ? null : event.currentTarget)}><ListFilter size={21} /></IconButton></div>
    <div className="if-creator-tag-tabs" role="tablist" aria-label={t('interface.263')}><button role="tab" aria-selected={tab === 'user'} onClick={() => { setTab('user'); setStatus('all'); setFilterAnchor(null) }}>{t('popup.tagUser')}</button><button role="tab" aria-selected={tab === 'release'} onClick={() => { setTab('release'); setStatus('all'); setFilterAnchor(null) }}>{t('popup.releaseForm')}</button></div>
    <div className="if-creator-tag-options" role="tabpanel" aria-label={t(tab === 'user' ? 'popup.tagUser' : 'popup.releaseForm')}>{tab === 'user' ? results.map(creator => <label key={creator.id}><input type="checkbox" checked={selected.includes(creator.id)} onChange={() => toggle(creator.id, selected, setSelected)} /><Avatar name={creator.name} color={creator.color} size={36} /><span>{creator.name}<small>{t(creator.verificationStatus === 'pending' ? 'chat.complete.pending' : 'creatorTag.verified')}</small></span></label>) : formResults.map(form => { const disabled = ['declined', 'failed', 'expired'].includes(form.status); return <label key={form.id} className={disabled ? 'unavailable' : ''}><input type="checkbox" disabled={disabled} checked={forms.includes(form.id)} onChange={() => toggle(form.id, forms, setForms)} /><span className="if-release-form-icon">{form.type === 'link' ? <Link size={23} /> : <FileText size={23} />}</span><span>{form.name}<small>{t(`chat.complete.${form.status}`)}{form.createdAt ? ` · ${new Date(form.createdAt).toLocaleDateString(getLocale() === 'zh' ? 'zh-CN' : 'en-US')}` : ''}</small></span></label> })}{!(tab === 'user' ? results.length : formResults.length) && <p>{t('chat.complete.noTagResults')}</p>}</div>
    <footer><button className="if-secondary" onClick={finish}>{t('popup.close')}</button></footer></div>
    {filterAnchor && <AnchoredPopover title={t('chat.complete.filters')} anchor={filterAnchor} onClose={() => setFilterAnchor(null)} width={220} align="end" placement="bottom" className="if-creator-tag-filter-popover"><div className="if-creator-tag-filter-content">{([['status', tab === 'user' ? ['all', 'verified', 'pending'] : ['all', 'approved', 'signed', 'pending', 'declined'], status], ['sort', ['recent', 'name'], sort], ['order', ['ascending', 'descending'], order]] as Array<['status' | 'sort' | 'order', string[], string]>).map(([kind, options, current]) => <div key={kind}>{options.map(value => <button key={value} aria-pressed={current === value} onClick={() => selectFilter(kind, value)}><span>{current === value ? '✓' : ''}</span>{t(value === 'verified' ? 'creatorTag.verified' : `chat.complete.${value}`)}</button>)}</div>)}</div></AnchoredPopover>}
  </Modal>
}
