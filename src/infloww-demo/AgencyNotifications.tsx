import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bell, CheckCheck, Lock, MessageSquare } from 'lucide-react'
import { displaySample, getLocale, t } from './i18n'
import { money, useDemo } from './store'
import type { Media, WithdrawalRecord } from './types'
import { AnchoredPopover, MediaView, Modal } from './ui'
import './notifications.css'
import MediaPreviewDialog from './MediaPreviewDialog'

const date = (at: number) => new Date(at).toLocaleString(getLocale() === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
function RecordContent({ record, onPreview }: { record: WithdrawalRecord; onPreview?: (media: Media) => void }) {
  return <div className="if-withdrawal-content"><p>{t('withdrawal.description', [record.withdrawnBy, date(record.withdrawnAt), record.sender, record.creatorName])}</p><div className="if-withdrawal-message"><p>{displaySample(record.message.text) || t('interface.extra.mediaAttachment')}</p>{!!record.message.attachments.length && <div className="if-withdrawal-media">{record.message.attachments.slice(0, 3).map(attachment => {
    const media = record.media.find(media => media.id === attachment.mediaId)
    return <button type="button" key={attachment.mediaId} disabled={!media || !onPreview} aria-label={t('popup.previewMedia', [media ? displaySample(media.title) : attachment.mediaId])} onClick={() => { if (media) onPreview?.(media) }}><MediaView media={media} compact/>{!attachment.free && record.message.price > 0 && <i><Lock size={12}/></i>}</button>
  })}{record.message.attachments.length > 3 && <span>+{record.message.attachments.length - 3}</span>}</div>}{record.message.price > 0 && <b>{money(record.message.price)}</b>}</div></div>
}

export function WithdrawalDetailsDialog({ id, onClose }: { id:string; onClose:()=>void }) {
  const {state,dispatch}=useDemo()
  const [preview,setPreview]=useState<number|null>(null)
  const record=state.withdrawals?.find(record=>record.id===id)
  useEffect(()=>{dispatch({type:'READ_WITHDRAWALS',payload:{id}})},[id])
  if(!record||state.role!=='admin')return null
  return <><Modal title={t('withdrawal.title')} width={600} maskClosable={false} onClose={onClose} className="if-tool-dialog if-withdrawal-detail"><RecordContent record={record} onPreview={media=>setPreview(record.media.findIndex(item=>item.id===media.id))}/><div className="if-modal-actions"><button onClick={onClose}>{t('popup.close')}</button><button className="if-primary" onClick={()=>{dispatch({type:'OPEN_WITHDRAWAL_CHAT',payload:{id}});onClose()}}><MessageSquare size={15}/>{t('withdrawal.goToChat')}</button></div></Modal>{preview!==null&&<MediaPreviewDialog media={record.media} initialIndex={preview} onClose={()=>setPreview(null)}/>}</>
}

export default function AgencyNotifications({ detailId, onClose }: { detailId: string | null; onClose: () => void }) {
  const { state, dispatch } = useDemo()
  const [selectedId, setSelectedId] = useState(detailId)
  const [confirmRead, setConfirmRead] = useState(false)
  const [preview, setPreview] = useState<Media | null>(null)
  const [hover, setHover] = useState<{ record: WithdrawalRecord; anchor: HTMLElement } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const records = [...(state.withdrawals ?? [])].sort((a, b) => b.withdrawnAt - a.withdrawnAt)
  const selected = records.find(record => record.id === selectedId)
  useEffect(() => { setSelectedId(detailId); if (detailId) dispatch({ type: 'READ_WITHDRAWALS', payload: { id: detailId } }) }, [detailId])
  useEffect(() => () => clearTimeout(timer.current), [])
  function open(record: WithdrawalRecord) { clearTimeout(timer.current); setHover(null); setSelectedId(record.id); dispatch({ type: 'READ_WITHDRAWALS', payload: { id: record.id } }) }
  function enter(record: WithdrawalRecord, anchor: HTMLElement) { clearTimeout(timer.current); timer.current = setTimeout(() => { setHover({ record, anchor }); dispatch({ type: 'READ_WITHDRAWALS', payload: { id: record.id } }) }, 1000) }
  function leave() { clearTimeout(timer.current); timer.current = setTimeout(() => setHover(null), 120) }
  if (state.role !== 'admin') return null
  return <section className="if-agency-notifications" aria-label={t('withdrawal.center')}>
    <header><button className="if-quiet-button" onClick={onClose}><ArrowLeft size={18}/>{t('withdrawal.back')}</button><h1>{t('withdrawal.center')}</h1><button className="if-secondary" disabled={!records.some(record => !record.read)} onClick={() => setConfirmRead(true)}><CheckCheck size={16}/>{t('withdrawal.readAll')}</button></header>
    <div className="if-agency-notification-body"><h2>{t('withdrawal.title')}</h2>{!records.length ? <div className="if-withdrawal-empty"><Bell size={30}/><p>{t('withdrawal.empty')}</p></div> : records.map(record => <article key={record.id} tabIndex={0} role="button" aria-label={t('withdrawal.viewRecord', [record.creatorName, record.fanName])} onClick={() => open(record)} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); open(record) } }} onMouseEnter={event => enter(record, event.currentTarget)} onMouseLeave={leave}>
      <span className="if-agency-notification-icon"><Bell size={21}/>{!record.read && <i aria-label={t('ui.100')}/>}</span><div><strong>{t('withdrawal.title')}</strong><p>{t('withdrawal.summary', [record.withdrawnBy, record.creatorName, record.fanName])}</p><time>{date(record.withdrawnAt)}</time></div><button className="if-quiet-button" onClick={event => { event.stopPropagation(); open(record) }}>{t('withdrawal.viewDetails')}</button>
    </article>)}</div>
    {hover && !selected && <AnchoredPopover title={t('withdrawal.title')} anchor={hover.anchor} width={420} placement="bottom" onClose={() => setHover(null)} className="if-withdrawal-hover"><div onMouseEnter={() => clearTimeout(timer.current)} onMouseLeave={leave}><RecordContent record={hover.record}/></div></AnchoredPopover>}
    {selected && <Modal title={t('withdrawal.title')} width={600} maskClosable={false} onClose={() => setSelectedId(null)} className="if-tool-dialog if-withdrawal-detail"><RecordContent record={selected} onPreview={setPreview}/><div className="if-modal-actions"><button onClick={() => setSelectedId(null)}>{t('popup.close')}</button><button className="if-primary" onClick={() => { dispatch({ type: 'OPEN_WITHDRAWAL_CHAT', payload: { id: selected.id } }); onClose() }}><MessageSquare size={15}/>{t('withdrawal.goToChat')}</button></div></Modal>}
    {preview && <Modal title={displaySample(preview.title)} width={900} onClose={() => setPreview(null)} className="if-media-preview-modal"><MediaView media={preview}/></Modal>}
    {confirmRead && <Modal title={t('withdrawal.readAll')} onClose={() => setConfirmRead(false)} maskClosable={false} className="if-tool-dialog"><p>{t('withdrawal.readAllConfirm')}</p><div className="if-modal-actions"><button onClick={() => setConfirmRead(false)}>{t('interface.072')}</button><button className="if-primary" onClick={() => { dispatch({ type: 'READ_WITHDRAWALS' }); setConfirmRead(false) }}>{t('withdrawal.confirm')}</button></div></Modal>}
  </section>
}
