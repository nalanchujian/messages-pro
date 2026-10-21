import { displaySample, getLocale, mediaTypeLabel, t } from './i18n'
import { useEffect, useMemo, useState } from 'react'
import { Search, Image, Film, Music, Clapperboard, Check, CheckSquare, ChevronDown, Info, Lock, Unlock, Undo2, Pencil, ListFilter, RefreshCw, Tag, Send, Coins } from 'lucide-react'
import type { Media, Message } from './types'
import { canWithdrawMessage, money, useDemo } from './store'
import { AnchoredPopover, IconButton, MediaView, Modal } from './ui'
import { SelectField } from './ProfileFields'
import { mediaHistory, mediaMetrics, type MediaActivity } from './mediaActivity'
import MediaPreviewDialog from './MediaPreviewDialog'
import './vault-pro.css'

type Props = {
  media: Media[]; messages: Message[]; selectedIds: string[];
  onSelect: (media: Media) => void; mode?: 'vault' | 'gif'; historyFanIds?: string[];
}

export default function ChatMediaPicker({ media, messages, selectedIds, onSelect, mode = 'vault', historyFanIds }: Props) {
  const [search, setSearch] = useState('')
  const [searchScope, setSearchScope] = useState(mode === 'vault' ? 'caption' : 'all')
  const [sort, setSort] = useState('recent')
  const [categoryQuery, setCategoryQuery] = useState('')
  const [categorySearchOpen, setCategorySearchOpen] = useState(false)
  const [categoryAscending, setCategoryAscending] = useState(false)
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [sent, setSent] = useState('all')
  const [duration, setDuration] = useState('all')
  const [hideViewed, setHideViewed] = useState(() => localStorage.getItem('infloww-demo-vault-hide-viewed') === 'true')
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const { state, creator, fan, dispatch, notify, now } = useDemo()
  const [historyOpen, setHistoryOpen] = useState<{ id:string; anchor:HTMLElement } | null>(null)
  const [infoOpen, setInfoOpen] = useState<{ id:string; anchor:HTMLElement } | null>(null)
  const [editing, setEditing] = useState<Media | null>(null)
  const [notes, setNotes] = useState(''), [tags, setTags] = useState('')
  const [categoryDraft, setCategoryDraft] = useState(''), [priceDraft, setPriceDraft] = useState(0)
  const [creatorTagDraft, setCreatorTagDraft] = useState<string[]>([])
  const [unsendMessage, setUnsendMessage] = useState<Message | null>(null)
  useEffect(() => { localStorage.setItem('infloww-demo-vault-hide-viewed', String(hideViewed)) }, [hideViewed])
  const scope=historyFanIds ?? (fan ? [fan.id] : [])
  const withdrawals = (state.withdrawals ?? []).filter(record => record.creatorId === creator.id && scope.includes(record.fanId))
  const history = (id:string) => mediaHistory(messages, id, withdrawals)
  const status = (id:string) => { const records=history(id); return records.find(record=>record.kind==='bought') ?? records[0] }
  const activityLabel = (record:MediaActivity) => record.kind==='withdrawn' && !record.price ? t('media.activity.withdrawnFree') : t(`media.activity.${record.kind}`, [money(record.price)])
  const categories = [...new Set(media.filter(item => mode !== 'gif' || item.type === 'gif').map(item => displaySample(item.category)))]
  const results = useMemo(() => media.filter(item => {
    if (mode === 'gif' && item.type !== 'gif') return false
    if (filter !== 'all' && item.type !== filter) return false
    if (category === '__streams') return false
    if (category === '__uploads' && !item.uploaded) return false
    if (!['all','__uploads','__streams'].includes(category) && displaySample(item.category) !== category) return false
    const records=history(item.id)
    if (sent === 'sent' && !records.length) return false
    if (sent === 'unsent' && records.length) return false
    if (sent === 'bought' && !records.some(record=>record.kind==='bought')) return false
    if (sent === 'unpaid' && status(item.id)?.kind!=='unpaid') return false
    if (sent === 'withdrawn' && !records.some(record=>record.kind==='withdrawn')) return false
    if (duration !== 'all' && (item.type !== 'video' && item.type !== 'audio' || !item.duration || (duration === 'short' && item.duration >= 60) || (duration === 'medium' && (item.duration < 60 || item.duration > 300)) || (duration === 'long' && item.duration <= 300))) return false
    if (hideViewed && messages.some(message => message.attachments.some(attachment => attachment.mediaId === item.id) && (message.viewed || !!message.purchasedAt))) return false
    const captions = messages.filter(message => message.direction === 'outbound' && message.attachments.some(attachment => attachment.mediaId === item.id)).map(message => displaySample(message.text)).join(' ')
    const searchable = searchScope === 'notes' ? item.notes ?? '' : searchScope === 'tags' ? item.tags.map(displaySample).join(' ') : searchScope === 'caption' ? captions : `${displaySample(item.title)} ${displaySample(item.category)} ${item.tags.map(displaySample).join(' ')} ${item.notes ?? ''} ${captions}`
    return searchable.toLowerCase().includes(search.trim().toLowerCase())
  }).sort((a,b) => sort === 'name' ? displaySample(a.title).localeCompare(displaySample(b.title)) : sort === 'oldest' ? (a.createdAt ?? 0) - (b.createdAt ?? 0) : (b.createdAt ?? 0) - (a.createdAt ?? 0)), [media, messages, state.withdrawals, filter, category, sent, search, searchScope, duration, hideViewed, mode, sort])
  const previewIndex = results.findIndex(item => item.id === previewId)
  const preview = results[previewIndex]
  const types = [['all', t('vault.all')], ['image', t('vault.photo')], ['video', t('interface.062')], ['gif', 'GIF'], ['audio', t('interface.063')]]
  const globalMessages = Object.values(state.messages).flat().filter(message => message.creatorId === creator.id)
  const globalWithdrawals = (state.withdrawals ?? []).filter(record => record.creatorId === creator.id)
  const metrics = (items: Media[]) => mediaMetrics(globalMessages, items.map(item => item.id), globalWithdrawals)
  const categoryItems = (value: string) => value === 'all' ? media : value === '__streams' ? [] : value === '__uploads' ? media.filter(item => item.uploaded) : media.filter(item => displaySample(item.category) === value)
  const categoryLabel = (value: string) => value === 'all' ? t('vault.allMedia') : value === '__streams' ? t('vault.streams') : value === '__uploads' ? t('vault.uploads') : displaySample(value)
  const sidebarCategories = ['all','__streams','__uploads',...categories].filter(value => categoryLabel(value).toLowerCase().includes(categoryQuery.toLowerCase()))
  if (categoryAscending) sidebarCategories.sort((a,b) => a === 'all' ? -1 : b === 'all' ? 1 : categoryLabel(a).localeCompare(categoryLabel(b)))
  const durationLabel = (seconds: number) => `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`
  const dateLabel = (at?: number) => at ? new Date(at).toLocaleDateString(getLocale() === 'zh' ? 'zh-CN' : 'en-US', { month:'short', day:'numeric', year:'2-digit' }) : '—'
  const information = media.find(item=>item.id===infoOpen?.id)
  const beginEdit = (item:Media) => { setEditing(item); setNotes(item.notes ?? ''); setTags(item.tags.join(', ')); setCategoryDraft(item.category); setPriceDraft(item.price); setCreatorTagDraft([...item.creatorTags]); setInfoOpen(null) }
  const withdrawableMessage = (id:string) => historyFanIds ? undefined : messages.filter(message => message.attachments.some(attachment => attachment.mediaId === id) && canWithdrawMessage(message, now)).sort((a,b) => b.createdAt-a.createdAt)[0]
  return <div className={`if-media-picker ${mode === 'vault' ? 'if-vault-picker' : 'if-gif-picker'}`}>
    {mode === 'vault' && <aside className="if-vault-sidebar"><h2>{t('vault.title')}</h2><div className="if-vault-sidebar-heading"><strong>{t('vault.media')}</strong><IconButton label={t('vault.sortCategories')} active={categoryAscending} onClick={() => setCategoryAscending(value => !value)}><ListFilter size={16}/></IconButton><IconButton label={t('vault.searchCategories')} onClick={() => setCategorySearchOpen(value => !value)}><Search size={18}/></IconButton></div>{categorySearchOpen && <input className="if-vault-category-search" aria-label={t('vault.searchCategories')} placeholder={t('vault.searchCategories')} value={categoryQuery} onChange={event => setCategoryQuery(event.target.value)} autoFocus/>}<nav aria-label={t('popup.categories')}>{sidebarCategories.map(value => { const items = categoryItems(value), metric = metrics(items); return <button key={value} className={category === value ? 'active' : ''} onClick={() => setCategory(value)}><strong>{categoryLabel(value)}</strong><span className="if-vault-category-types">{items.length ? [['image',Image],['video',Film],['audio',Music],['gif',Clapperboard]].map(([type, Icon]) => { const count = items.filter(item => item.type === type).length; const TypeIcon = Icon as typeof Image; return count ? <span key={String(type)}><TypeIcon size={12}/>{count}</span> : null }) : t('vault.emptyCategory')}</span>{value !== 'all' && <span className="if-vault-category-metrics"><span><Send size={12}/>{metric.sent}</span><span><Lock size={12}/>{Math.round(metric.rate)}%</span><span><Coins size={12}/>{money(metric.revenue)}</span></span>}</button> })}</nav></aside>}
    <div className="if-vault-main"><div className="if-vault-search-row"><div className="if-vault-combined-search">{mode === 'vault' && <SelectField label={t('media.searchBy')} value={searchScope} width={180} options={['caption','notes','tags','all'].map(value=>({value,label:t(value === 'caption' ? 'vault.caption' : `media.search.${value}`)}))} onChange={setSearchScope}/>}<div className="if-tool-search"><input aria-label={mode === 'gif' ? t('interface.extra.searchGifs') : t('interface.extra.searchVault')} placeholder={mode === 'gif' ? t('interface.extra.searchGifsPlaceholder') : t(`vault.search.${searchScope}`)} value={search} onChange={event => setSearch(event.target.value)} /><Search size={18}/></div></div>{mode === 'vault' && <SelectField label={t('vault.sortMedia')} width={180} value={sort} options={['recent','oldest','name'].map(value => ({ value, label: t(`vault.sort.${value}`) }))} onChange={setSort}/>}</div>
      {mode === 'vault' && <div className="if-vault-type-row"><span>{t('vault.media')}:</span><div role="tablist" aria-label={t('interface.extra.44')}>{types.map(([value, label]) => <button key={value} role="tab" aria-selected={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div><IconButton label={t('media.moreFilters')} active={hideViewed || duration !== 'all' || sent !== 'all'} onClick={event => setFilterAnchor(event.currentTarget)}><ListFilter size={16}/></IconButton><IconButton label={t('vault.refresh')} onClick={() => { dispatch({ type:'TICK', payload:now }); notify(t('vault.refreshed')) }}><RefreshCw size={15}/></IconButton></div>}
      <div className="if-vault-grid">{results.map(item => {
        const prior = status(item.id), selected = selectedIds.includes(item.id), canUnsend = mode === 'vault' ? withdrawableMessage(item.id) : undefined
        const Icon = item.type === 'image' ? Image : item.type === 'video' ? Film : item.type === 'audio' ? Music : Clapperboard
        const metric = metrics([item])
        return <article className={`if-vault-item ${selected ? 'selected' : ''} ${prior ? 'previously-sent' : ''}`} key={item.id}>
          <div className="if-vault-media-frame"><button className="if-vault-preview" aria-label={t('popup.previewMedia', [displaySample(item.title)])} onClick={() => mode === 'gif' ? onSelect(item) : setPreviewId(item.id)}>{mode === 'vault' && item.type === 'audio' ? <div className="if-vault-audio-wave" aria-hidden="true">{Array.from({length:40},(_,index)=><i key={index} style={{height:10+Math.abs(Math.sin(index*1.7))*40}}/>)}</div> : <MediaView media={item} compact />}</button>
            {mode === 'vault' && <><span className="if-vault-date">{dateLabel(item.createdAt)}</span><button className="if-vault-card-select" aria-label={t(selected ? 'vault.deselectMedia' : 'vault.selectMedia', [displaySample(item.title)])} aria-pressed={selected} onClick={() => onSelect(item)}>{selected && <Check size={14}/>}</button><span className="if-vault-type-badge"><Icon size={12}/>{item.duration ? durationLabel(item.duration) : ''}</span></>}
            {mode==='vault' && prior && <button type="button" className={`if-media-activity-button ${prior.kind}`} aria-label={t('media.historyFor',[displaySample(item.title)])} onClick={event=>{setInfoOpen(null);setHistoryOpen({id:item.id,anchor:event.currentTarget})}}>{prior.kind==='bought'?<Unlock size={12}/>:prior.kind==='withdrawn'?<Undo2 size={12}/>:prior.price>0?<Lock size={12}/>:<Unlock size={12}/>}<span>{prior.price>0?money(prior.price):activityLabel(prior)}</span><ChevronDown size={11}/></button>}
            {canUnsend && <button className="if-vault-unsend" aria-label={t('media.unsendFor',[displaySample(item.title)])} title={t('media.unsend')} onClick={()=>setUnsendMessage(canUnsend)}><Undo2 size={14}/></button>}
            {mode === 'vault' && <div className="if-vault-card-caption">{item.notes && <span className="if-vault-note-line">{item.notes}</span>}<div><span><Tag size={12}/>{item.tags.map(displaySample).join(' ')}</span><button className="if-media-info-trigger" aria-label={t('media.infoFor',[displaySample(item.title)])} onMouseEnter={event=>{setHistoryOpen(null);setInfoOpen({id:item.id,anchor:event.currentTarget})}} onClick={event=>{setHistoryOpen(null);setInfoOpen({id:item.id,anchor:event.currentTarget})}}><Info size={14}/></button></div></div>}
          </div>
          {mode === 'vault' ? <div className="if-vault-card-metrics"><span title={t('vault.sent')}><Send size={12}/>{metric.sent}</span><span title={t('vault.purchaseRate')}><Lock size={12}/>{Math.round(metric.rate)}%</span><span title={t('vault.revenue')}><Coins size={12}/>{money(metric.revenue)}</span></div> : <button className="if-vault-select" onClick={() => onSelect(item)} aria-pressed={selected}><span><Icon size={15}/>{displaySample(item.title)}</span><i>{selected ? <Check size={15}/> : ''}</i></button>}
        </article>
      })}</div>{!results.length && <p className="if-chat-empty">{t('interface.extra.40')}</p>}
    </div>
    {filterAnchor && <AnchoredPopover title={t('media.moreFilters')} anchor={filterAnchor} width={300} placement="bottom" onClose={()=>setFilterAnchor(null)} className="if-vault-filter-popover"><h3>{t('media.moreFilters')}</h3><SelectField label={t('interface.extra.46')} value={sent} options={[[ 'all',t('interface.extra.35')],['sent',t('interface.extra.36')],['unsent',t('interface.extra.37')],['bought',t('media.filter.bought')],['unpaid',t('media.filter.unpaid')],['withdrawn',t('media.filter.withdrawn')]].map(([value,label])=>({value,label}))} onChange={setSent}/><button className="if-text-button" disabled={!results.length} onClick={() => results.filter(item => !selectedIds.includes(item.id)).forEach(onSelect)}><CheckSquare size={16}/>{t('popup.selectAll')}</button><SelectField label={t('media.duration')} value={duration} options={['all','short','medium','long'].map(value=>({value,label:t(`media.duration.${value}`)}))} onChange={setDuration}/><label className="if-check-row"><input type="checkbox" checked={hideViewed} onChange={event=>setHideViewed(event.target.checked)}/>{t('media.hideViewed')}</label></AnchoredPopover>}
    {historyOpen && <AnchoredPopover title={t('media.history')} anchor={historyOpen.anchor} width={310} placement="bottom" onClose={()=>setHistoryOpen(null)} className="if-media-history-popover"><h3>{t('media.history')}</h3>{history(historyOpen.id).map(record=><div className="if-media-history-record" key={record.id}>{record.kind==='withdrawn'?<Undo2 size={14}/>:record.kind==='unpaid'?<Lock size={14}/>:<Unlock size={14}/>}<div>{activityLabel(record)}<small>{record.sender}</small></div><time>{new Date(record.at).toLocaleDateString(getLocale()==='zh'?'zh-CN':'en-US')}</time></div>)}</AnchoredPopover>}
    {infoOpen && information && <AnchoredPopover title={t('media.info')} anchor={infoOpen.anchor} width={300} placement="top" onClose={()=>setInfoOpen(null)} className="if-media-info-popover"><h3>{displaySample(information.title)}</h3>{information.notes && <p>{information.notes}</p>}<dl><dt>{t('media.type')}</dt><dd>{mediaTypeLabel(information.type)}</dd><dt>{t('media.category')}</dt><dd>{displaySample(information.category)}</dd><dt>{t('media.tags')}</dt><dd>{information.tags.map(displaySample).join(', ') || '—'}</dd><dt>{t('media.suggestedPrice')}</dt><dd>{money(information.price)}</dd><dt>{t('media.coCreators')}</dt><dd>{information.creatorTags.map(id=>state.creators.find(creator=>creator.id===id)?.name||id).join(', ')||'—'}</dd></dl><button className="if-text-button" style={{marginTop:14}} onClick={()=>beginEdit(information)}><Pencil size={13}/>{t('media.edit')}</button></AnchoredPopover>}
    {editing && <Modal title={t('media.edit')} width={600} maskClosable={false} onClose={()=>setEditing(null)} className="if-tool-dialog if-media-edit-dialog"><div className="if-media-edit-fields"><label className="if-field">{t('media.category')}<input maxLength={80} value={categoryDraft} onChange={event=>setCategoryDraft(event.target.value)}/></label><label className="if-field">{t('media.suggestedPrice')}<input type="number" min={0} max={200} step={0.01} value={priceDraft} onChange={event=>setPriceDraft(Number(event.target.value))}/></label><label className="if-field">{t('media.notes')}<textarea rows={4} maxLength={1000} value={notes} onChange={event=>setNotes(event.target.value)}/></label><label className="if-field">{t('media.tags')}<input placeholder={t('media.tagHint')} value={tags} onChange={event=>setTags(event.target.value)}/></label><fieldset className="if-media-edit-creators"><legend>{t('media.coCreators')}</legend>{state.creators.filter(item=>item.id!==creator.id).map(item=><label key={item.id}><input type="checkbox" checked={creatorTagDraft.includes(item.id)} onChange={event=>setCreatorTagDraft(ids=>event.target.checked?[...ids,item.id]:ids.filter(id=>id!==item.id))}/>{item.name}</label>)}</fieldset></div><div className="if-modal-actions"><button onClick={()=>setEditing(null)}>{t('interface.072')}</button><button className="if-primary" disabled={!categoryDraft.trim()||!Number.isFinite(priceDraft)||priceDraft<0||priceDraft>200} onClick={()=>{dispatch({type:'PATCH_MEDIA',payload:{id:editing.id,category:categoryDraft,price:priceDraft,creatorTags:creatorTagDraft,notes,tags:tags.split(/[,，]/)}});notify(t('media.saved'));setEditing(null)}}>{t('ui.391')}</button></div></Modal>}
    {unsendMessage && <Modal title={t('media.unsendConfirmTitle')} width={520} closable={false} maskClosable={false} onClose={()=>setUnsendMessage(null)} className="if-tool-dialog if-vault-unsend-dialog"><p>{t('media.unsendConfirmBody')}</p><div className="if-modal-actions"><button onClick={()=>setUnsendMessage(null)}>{t('interface.072')}</button><button className="if-primary" onClick={()=>{dispatch({type:'WITHDRAW',creatorId:unsendMessage.creatorId,fanId:unsendMessage.fanId,messageId:unsendMessage.id});setUnsendMessage(null)}}>{t('media.unsend')}</button></div></Modal>}
    {preview && <MediaPreviewDialog media={results} initialIndex={previewIndex} onClose={()=>setPreviewId(null)} selectAction={{label:t('popup.select'),onSelect,selectedIds}}/>}
  </div>
}
