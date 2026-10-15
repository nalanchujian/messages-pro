import { useState } from 'react'
import { ArrowLeft, FileText, Link, Plus, Search, Settings2, Trash2, X } from 'lucide-react'
import type { Creator, ReleaseForm } from './types'
import { getLocale, t } from './i18n'
import { Avatar, IconButton, Modal } from './ui'

export default function CreatorTagsDialog({ creators, selectedIds, releaseForms = [], selectedReleaseFormIds = [], onAdd, onClose }: { creators: Creator[]; selectedIds: string[]; releaseForms?: ReleaseForm[]; selectedReleaseFormIds?: string[]; onAdd: (ids: string[], releaseFormIds: string[]) => void; onClose: () => void }) {
  const [selected, setSelected] = useState([...selectedIds])
  const [forms, setForms] = useState([...selectedReleaseFormIds])
  const [tab, setTab] = useState<'user' | 'release'>('user')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('recent')
  const [order, setOrder] = useState('descending')
  const compare = (a: { name: string; createdAt?: number }, b: { name: string; createdAt?: number }) => (sort === 'name' ? a.name.localeCompare(b.name, getLocale()) : (a.createdAt || 0) - (b.createdAt || 0)) * (order === 'ascending' ? 1 : -1)
  const results = creators.filter(creator => status === 'all' && creator.name.toLowerCase().includes(query.trim().toLowerCase())).sort(compare)
  const formResults = releaseForms.filter(form => (status === 'all' || form.status === 'pending') && form.name.toLowerCase().includes(query.trim().toLowerCase())).sort(compare)
  const count = selected.length + forms.length
  const toggle = (id: string, values: string[], update: (values: string[]) => void) => update(values.includes(id) ? values.filter(value => value !== id) : [...values, id])
  const selectFilter = (kind: 'status' | 'sort' | 'order', value: string) => { if (kind === 'status') setStatus(value); else if (kind === 'sort') setSort(value); else setOrder(value); setFiltersOpen(false) }
  return <Modal title={t('interface.263')} width={520} header={false} maskClosable={false} onClose={onClose} className="if-creator-tags-dialog if-tool-dialog"><div className="if-creator-tags-header">{searchOpen ? <><IconButton label={t('interface.008')} onClick={() => { setSearchOpen(false); setQuery('') }}><ArrowLeft size={18} /></IconButton><input aria-label={t('chat.complete.searchTags')} placeholder={t('chat.complete.searchTags')} value={query} onChange={event => setQuery(event.target.value)} autoFocus /></> : <><h2>{t('interface.263')}</h2><IconButton label={t('chat.complete.searchTags')} onClick={() => setSearchOpen(true)}><Search size={18} /></IconButton></>}<IconButton label={t('chat.complete.filters')} active={filtersOpen || status !== 'all'} onClick={() => setFiltersOpen(value => !value)}><Settings2 size={18} /></IconButton><IconButton label={t('ui.395')} onClick={onClose}><X size={18} /></IconButton></div>
    {filtersOpen && <div className="if-creator-tag-filters" role="group" aria-label={t('chat.complete.filters')}>{([['status', ['all', 'pending'], status], ['sort', ['recent', 'name'], sort], ['order', ['ascending', 'descending'], order]] as Array<['status' | 'sort' | 'order', string[], string]>).map(([kind, options, current]) => <div key={kind}>{options.map(value => <button key={value} aria-pressed={current === value} onClick={() => selectFilter(kind, value)}>{current === value ? '✓' : ''}<span>{t(`chat.complete.${value}`)}</span></button>)}</div>)}</div>}
    <div className="if-creator-tag-tabs" role="tablist"><button role="tab" aria-selected={tab === 'user'} onClick={() => { setTab('user'); setFiltersOpen(false) }}>{t('popup.tagUser')}</button><button role="tab" aria-selected={tab === 'release'} onClick={() => { setTab('release'); setFiltersOpen(false) }}>{t('popup.releaseForm')}</button></div>
    <div className="if-creator-tag-options">{tab === 'user' ? results.map(creator => <label key={creator.id}><input type="checkbox" checked={selected.includes(creator.id)} onChange={() => toggle(creator.id, selected, setSelected)} /><Avatar name={creator.name} color={creator.color} size={38} /><span>{creator.name}<small>{t('popup.creator')}</small></span></label>) : formResults.map(form => { const disabled = ['declined', 'failed', 'expired'].includes(form.status); return <label key={form.id} className={disabled ? 'unavailable' : ''}><input type="checkbox" disabled={disabled} checked={forms.includes(form.id)} onChange={() => toggle(form.id, forms, setForms)} /><span className="if-release-form-icon">{form.type === 'link' ? <Link size={23} /> : <FileText size={23} />}</span><span>{form.name}<small>{t(`chat.complete.${form.status}`)}{form.createdAt ? ` · ${new Date(form.createdAt).toLocaleDateString(getLocale() === 'zh' ? 'zh-CN' : 'en-US')}` : ''}</small></span></label> })}{!(tab === 'user' ? results.length : formResults.length) && <p>{t('chat.complete.noTagResults')}</p>}</div>
    <div className="if-creator-tags-selection"><IconButton label={t('popup.clear')} disabled={!count} onClick={() => { setSelected([]); setForms([]) }}><Trash2 size={17} /></IconButton><span>{t('popup.tagsSelected', [count])}</span><button className="if-primary" onClick={() => onAdd(selected, forms)}><Plus size={15} />{t('popup.add')}</button></div>
    <footer><button className="if-secondary" onClick={onClose}>{t('popup.close')}</button></footer>
  </Modal>
}
