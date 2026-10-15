import { useState } from 'react'
import { Plus, RefreshCw, Search } from 'lucide-react'
import { displaySample, t } from './i18n'
import { useDemo } from './store'
import { IconButton, Modal } from './ui'

// Header, inbox context menu, and insight card all open the same immediate-save list picker.
export default function FanListsDialog({ creatorId, fanId, onClose }: { creatorId: string; fanId: string; onClose: () => void }) {
  const { state, dispatch, notify } = useDemo()
  const [query, setQuery] = useState('')
  const [newListOpen, setNewListOpen] = useState(false)
  const [name, setName] = useState('')
  const creator = state.creators.find(item => item.id === creatorId)
  const fan = state.fans[creatorId]?.find(item => item.id === fanId)
  if (!creator || !fan) return null
  const lists = creator.lists.filter(list => displaySample(list.name).toLowerCase().includes(query.trim().toLowerCase()))
  return <Modal title={t('popup.saveToList')} width={560} maskClosable={false} onClose={onClose} className="if-fan-lists-dialog if-tool-dialog">
    <div className="if-fan-lists-toolbar"><div><Search size={17} /><input aria-label={t('popup.searchLists')} placeholder={t('popup.searchLists')} value={query} onChange={event => setQuery(event.target.value)} /></div><button className="if-primary" disabled={state.role !== 'admin'} onClick={() => { setName(''); setNewListOpen(true) }}><Plus size={16} />{t('popup.newList')}</button><IconButton label={t('popup.refreshLists')} onClick={() => { dispatch({ type: 'TICK', payload: Date.now() + state.clockOffset }); notify(t('popup.listsSynced')) }}><RefreshCw size={17} /></IconButton></div>
    <div className="if-fan-list-options">{lists.map(list => <label key={list.id}><input type="checkbox" checked={fan.listIds.includes(list.id)} onChange={event => dispatch({ type: 'SET_FAN_LISTS', creatorId, fanId, payload: event.target.checked ? [...fan.listIds, list.id] : fan.listIds.filter(id => id !== list.id) })} /><span><strong>{displaySample(list.name)}</strong><small>{t('popup.listEntries', [state.fans[creatorId].filter(item => item.listIds.includes(list.id)).length])}</small></span></label>)}{!lists.length && <p className="if-chat-empty">{t('interface.extra.40')}</p>}</div>
    {newListOpen && <Modal title={t('popup.newList')} width={400} maskClosable={false} onClose={() => setNewListOpen(false)} className="if-tool-dialog"><form onSubmit={event => { event.preventDefault(); if (!name.trim()) return; if (creator.lists.some(list => displaySample(list.name).toLowerCase() === name.trim().toLowerCase())) { notify(t('ui.212')); return }; dispatch({ type: 'ADD_LIST', creatorId, payload: { name: name.trim() } }); setNewListOpen(false) }}><label className="if-field">{t('interface.117')}<input autoFocus required maxLength={36} value={name} onChange={event => setName(event.target.value)} /></label><div className="if-modal-actions"><button type="button" onClick={() => setNewListOpen(false)}>{t('interface.072')}</button><button className="if-primary" disabled={!name.trim()}>{t('popup.add')}</button></div></form></Modal>}
  </Modal>
}
