import { MessageSquare, RotateCcw } from 'lucide-react'
import { t, subscriptionStatusLabel } from './i18n'
import { displayName, money, selectOnlineFans, useDemo } from './store'
import { emptyOnlineAudience } from './types'
import type { OnlineAudienceFilter } from './types'
import { Avatar, IconButton, Modal } from './ui'
import OnlineAudienceFields from './OnlineAudienceFields'

export default function OnlineFansDialog({ filters, onChange, onClose, onMessageAll, onOpenFan }: { filters: OnlineAudienceFilter; onChange: (value: OnlineAudienceFilter) => void; onClose: () => void; onMessageAll: (ids: string[]) => void; onOpenFan: (id: string) => void }) {
  const { state, creator, now } = useDemo()
  const fans = selectOnlineFans(state, creator.id, filters, now)
  return <Modal title={t('interface.100')} width={800} maskClosable={false} onClose={onClose} className="if-online-fans-modal">
    <div className="if-online-fans-body"><div className="if-online-fans-toolbar"><strong>{t('audience.matching', [fans.length])}</strong><button type="button" onClick={() => onChange(emptyOnlineAudience())}><RotateCcw size={14}/>{t('audience.reset')}</button></div>
      <OnlineAudienceFields value={filters} lists={creator.lists} onChange={onChange}/>
      <div className="if-online-fan-results" aria-label={t('audience.results')}>{fans.map(fan => <div className="if-online-fan" key={fan.id}><Avatar name={fan.name} color={fan.color} online size={34}/><div><strong>{displayName(fan)}{fan.isCreator && <small className="if-online-creator-badge">{t('popup.creator')}</small>}</strong><small>{fan.handle} · {subscriptionStatusLabel(fan.subscriptionStatus)}</small></div><span>{money(state.transactions.filter(item => item.creatorId === creator.id && item.fanId === fan.id && item.kind !== 'subscription').reduce((sum, item) => sum + item.amount, 0))}</span><IconButton label={t('ui.199', [displayName(fan)])} onClick={() => onOpenFan(fan.id)}><MessageSquare size={18}/></IconButton></div>)}{!fans.length && <p className="if-audience-empty">{t('audience.empty')}</p>}</div>
    </div><footer className="if-online-fans-footer"><button className="if-secondary" onClick={onClose}>{t('popup.close')}</button><button className="if-primary" disabled={state.role !== 'admin' || !fans.length} onClick={() => onMessageAll(fans.map(fan => fan.id))}>{t('interface.101')} · {fans.length}</button></footer>
  </Modal>
}
