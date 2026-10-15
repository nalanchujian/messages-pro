import { displaySample, getLocale, mediaTypeLabel, t } from './i18n'
import { useMemo, useState } from 'react'
import { Search, Image, Film, Music, Clapperboard, Check, CheckSquare, ChevronDown, Info, Lock, Unlock, Undo2, Pencil } from 'lucide-react'
import type { Media, Message } from './types'
import { money, useDemo } from './store'
import { AnchoredPopover, IconButton, MediaView, Modal } from './ui'
import { SelectField } from './ProfileFields'
import { mediaHistory, type MediaActivity } from './mediaActivity'
import MediaPreviewDialog from './MediaPreviewDialog'

type Props = {
  media: Media[]; messages: Message[]; selectedIds: string[];
  onSelect: (media: Media) => void; mode?: 'vault' | 'gif'; historyFanIds?: string[];
}

export default function ChatMediaPicker({ media, messages, selectedIds, onSelect, mode = 'vault', historyFanIds }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [sent, setSent] = useState('all')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const { state, creator, fan, dispatch, notify } = useDemo()
  const [historyOpen, setHistoryOpen] = useState<{ id:string; anchor:HTMLElement } | null>(null)
  const [infoOpen, setInfoOpen] = useState<{ id:string; anchor:HTMLElement } | null>(null)
  const [editing, setEditing] = useState<Media | null>(null)
  const [notes, setNotes] = useState(''), [tags, setTags] = useState('')
  const scope=historyFanIds ?? (fan ? [fan.id] : [])
  const withdrawals = (state.withdrawals ?? []).filter(record => record.creatorId === creator.id && scope.includes(record.fanId))
  const history = (id:string) => mediaHistory(messages, id, withdrawals)
  const status = (id:string) => { const records=history(id); return records.find(record=>record.kind==='bought') ?? records[0] }
  const activityLabel = (record:MediaActivity) => record.kind==='withdrawn' && !record.price ? t('media.activity.withdrawnFree') : t(`media.activity.${record.kind}`, [money(record.price)])
  const categories = [...new Set(media.filter(item => mode !== 'gif' || item.type === 'gif').map(item => displaySample(item.category)))]
  const results = useMemo(() => media.filter(item => {
    if (mode === 'gif' && item.type !== 'gif') return false
    if (filter !== 'all' && item.type !== filter) return false
    if (category !== 'all' && displaySample(item.category) !== category) return false
    const records=history(item.id)
    if (sent === 'sent' && !records.length) return false
    if (sent === 'unsent' && records.length) return false
    if (sent === 'bought' && !records.some(record=>record.kind==='bought')) return false
    if (sent === 'unpaid' && status(item.id)?.kind!=='unpaid') return false
    if (sent === 'withdrawn' && !records.some(record=>record.kind==='withdrawn')) return false
    return `${displaySample(item.title)} ${displaySample(item.category)} ${item.tags.map(displaySample).join(' ')}`.toLowerCase().includes(search.trim().toLowerCase())
  }), [media, messages, state.withdrawals, filter, category, sent, search, mode])
  const previewIndex = results.findIndex(item => item.id === previewId)
  const preview = results[previewIndex]
  const types = [['all', t('interface.extra.34')], ['image', t('interface.061')], ['video', t('interface.062')], ['audio', t('interface.063')]]
  const information = media.find(item=>item.id===infoOpen?.id)
  return <div className={`if-media-picker ${mode === 'vault' ? 'if-vault-picker' : 'if-gif-picker'}`}>
    {mode === 'vault' && <aside className="if-vault-sidebar"><h2>{t('popup.vault')}</h2><button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}><Image size={16} />{t('interface.361')}<span>{media.length}</span></button><h3>{t('popup.categories')}</h3>{categories.map(value => <button key={value} className={category === value ? 'active' : ''} onClick={() => setCategory(value)}>{displaySample(value)}<span>{media.filter(item => displaySample(item.category) === value).length}</span></button>)}</aside>}
    <div className="if-vault-main"><div className="if-vault-search-row"><div className="if-tool-search"><Search size={17} /><input aria-label={mode === 'gif' ? t('interface.extra.searchGifs') : t('interface.extra.searchVault')} placeholder={mode === 'gif' ? t('interface.extra.searchGifsPlaceholder') : t('interface.extra.searchMediaPlaceholder')} value={search} onChange={event => setSearch(event.target.value)} /></div>{mode === 'vault' && <SelectField label={t('interface.extra.46')} value={sent} options={[[ 'all',t('interface.extra.35')],['sent',t('interface.extra.36')],['unsent',t('interface.extra.37')],['bought',t('media.filter.bought')],['unpaid',t('media.filter.unpaid')],['withdrawn',t('media.filter.withdrawn')]].map(([value,label])=>({value,label}))} onChange={setSent}/>}</div>
      {mode === 'vault' && <div className="if-vault-type-row"><div role="tablist" aria-label={t('interface.extra.44')}>{types.map(([value, label]) => <button key={value} role="tab" aria-selected={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div><IconButton label={t('popup.selectAll')} disabled={!results.length} onClick={() => results.filter(item => !selectedIds.includes(item.id)).forEach(onSelect)}><CheckSquare size={19} /></IconButton></div>}
      <div className="if-vault-grid">{results.map(item => {
        const prior = status(item.id), selected = selectedIds.includes(item.id)
        const Icon = item.type === 'image' ? Image : item.type === 'video' ? Film : item.type === 'audio' ? Music : Clapperboard
        return <article className={`if-vault-item ${selected ? 'selected' : ''} ${prior ? 'previously-sent' : ''}`} key={item.id}>
          <button className="if-vault-preview" aria-label={t('popup.previewMedia', [displaySample(item.title)])} onClick={() => mode === 'gif' ? onSelect(item) : setPreviewId(item.id)}><MediaView media={item} compact /></button>
          {mode==='vault' && prior && <button type="button" className={`if-media-activity-button ${prior.kind}`} aria-label={t('media.historyFor',[displaySample(item.title)])} onClick={event=>{setInfoOpen(null);setHistoryOpen({id:item.id,anchor:event.currentTarget})}}>{prior.kind==='bought'?<Unlock size={12}/>:prior.kind==='withdrawn'?<Undo2 size={12}/>:prior.price>0?<Lock size={12}/>:<Unlock size={12}/>}<span>{prior.price>0?money(prior.price):activityLabel(prior)}</span><ChevronDown size={11}/></button>}
          <button className="if-vault-select" onClick={() => onSelect(item)} aria-pressed={selected}><span><Icon size={15} />{displaySample(item.title)}</span><i>{selected ? <Check size={15} /> : ''}</i></button>
          <div className="if-vault-description"><div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><span>{displaySample(item.category)} · {money(item.price)}</span>{mode==='vault' && <button className="if-media-info-trigger" aria-label={t('media.infoFor',[displaySample(item.title)])} onMouseEnter={event=>{setHistoryOpen(null);setInfoOpen({id:item.id,anchor:event.currentTarget})}} onClick={event=>{setHistoryOpen(null);setInfoOpen({id:item.id,anchor:event.currentTarget})}}><Info size={15}/></button>}</div><small>{item.tags.map(tag => `#${displaySample(tag)}`).join(' ')}</small></div>
        </article>
      })}</div>{!results.length && <p className="if-chat-empty">{t('interface.extra.40')}</p>}
    </div>
    {historyOpen && <AnchoredPopover title={t('media.history')} anchor={historyOpen.anchor} width={310} placement="bottom" onClose={()=>setHistoryOpen(null)} className="if-media-history-popover"><h3>{t('media.history')}</h3>{history(historyOpen.id).map(record=><div className="if-media-history-record" key={record.id}>{record.kind==='withdrawn'?<Undo2 size={14}/>:record.kind==='unpaid'?<Lock size={14}/>:<Unlock size={14}/>}<div>{activityLabel(record)}<small>{record.sender}</small></div><time>{new Date(record.at).toLocaleDateString(getLocale()==='zh'?'zh-CN':'en-US')}</time></div>)}</AnchoredPopover>}
    {infoOpen && information && <AnchoredPopover title={t('media.info')} anchor={infoOpen.anchor} width={300} placement="top" onClose={()=>setInfoOpen(null)} className="if-media-info-popover"><h3>{displaySample(information.title)}</h3>{information.notes && <p>{information.notes}</p>}<dl><dt>{t('media.type')}</dt><dd>{mediaTypeLabel(information.type)}</dd><dt>{t('media.category')}</dt><dd>{displaySample(information.category)}</dd><dt>{t('media.tags')}</dt><dd>{information.tags.map(displaySample).join(', ') || '—'}</dd></dl><button className="if-text-button" style={{marginTop:14}} onClick={()=>{setEditing(information);setNotes(information.notes??'');setTags(information.tags.join(', '));setInfoOpen(null)}}><Pencil size={13}/>{t('media.edit')}</button></AnchoredPopover>}
    {editing && <Modal title={t('media.edit')} width={600} maskClosable={false} onClose={()=>setEditing(null)} className="if-tool-dialog"><label className="if-field">{t('media.notes')}<textarea rows={4} maxLength={1000} value={notes} onChange={event=>setNotes(event.target.value)}/></label><label className="if-field">{t('media.tags')}<input placeholder={t('media.tagHint')} value={tags} onChange={event=>setTags(event.target.value)}/></label><div className="if-modal-actions"><button onClick={()=>setEditing(null)}>{t('interface.072')}</button><button className="if-primary" onClick={()=>{dispatch({type:'PATCH_MEDIA',payload:{id:editing.id,notes,tags:tags.split(/[,，]/)}});notify(t('media.saved'));setEditing(null)}}>{t('ui.391')}</button></div></Modal>}
    {preview && <MediaPreviewDialog media={results} initialIndex={previewIndex} onClose={()=>setPreviewId(null)} selectAction={{label:t('popup.select'),onSelect,selectedIds}}/>}
  </div>
}
