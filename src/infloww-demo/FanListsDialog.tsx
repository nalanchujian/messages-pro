import { useState } from 'react'
import { ListFilter, Plus, Search } from 'lucide-react'
import { displaySample, t } from './i18n'
import { messagesFor, useDemo } from './store'
import { Avatar, IconButton, Modal } from './ui'
import './message-pro-dialog.css'

// Header, inbox context menu, and insight card all open the same immediate-save list picker.
export default function FanListsDialog({ creatorId, fanId, onClose }: { creatorId: string; fanId: string; onClose: () => void }) {
  const { state, dispatch, notify } = useDemo()
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedOnly, setSelectedOnly] = useState(false)
  const [newListOpen, setNewListOpen] = useState(false)
  const [name, setName] = useState('')
  const creator = state.creators.find(item => item.id === creatorId)
  const fan = state.fans[creatorId]?.find(item => item.id === fanId)
  if (!creator || !fan) return null
  const lists = creator.lists.filter(list => displaySample(list.name).toLowerCase().includes(query.trim().toLowerCase()) && (!selectedOnly || fan.listIds.includes(list.id)))
  return <Modal title={t('popup.saveToList')} width={480} header={false} maskClosable={false} onClose={onClose} className="if-fan-lists-dialog if-tool-dialog">
    <div className="if-fan-lists-header"><strong>{t('popup.saveToList')}</strong><IconButton label={t('popup.searchLists')} onClick={() => setSearchOpen(value => !value)}><Search size={18} /></IconButton><IconButton label={t('ui.150')} active={selectedOnly} onClick={() => setSelectedOnly(value => !value)}><ListFilter size={18} /></IconButton></div>
    {searchOpen && <div className="if-fan-lists-search"><Search size={16}/><input autoFocus aria-label={t('popup.searchLists')} placeholder={t('popup.searchLists')} value={query} onChange={event => setQuery(event.target.value)} /></div>}
    <div className="if-fan-list-options">{lists.map(list => { const members = state.fans[creatorId].filter(item => item.listIds.includes(list.id)); const posts = members.reduce((sum, item) => sum + messagesFor(state, creatorId, item.id).length, 0); return <label key={list.id}><input type="checkbox" checked={fan.listIds.includes(list.id)} onChange={event => dispatch({ type: 'SET_FAN_LISTS', creatorId, fanId, payload: event.target.checked ? [...fan.listIds, list.id] : fan.listIds.filter(id => id !== list.id) })} /><span><strong>{displaySample(list.name)}</strong><small>{t(members.length === 1 ? 'lists.summary.one' : 'lists.summary', [members.length, posts])}</small></span><span className="if-list-member-avatars" aria-hidden="true">{members.slice(0,3).map(item => <Avatar key={item.id} name={item.name} color={item.color} size={30}/>)}</span></label> })}{!lists.length && <p className="if-chat-empty">{t('interface.extra.40')}</p>}</div>
    <div className="if-fan-lists-footer"><button className="if-new-list-link" disabled={state.role !== 'admin'} onClick={() => { setName(''); setNewListOpen(true) }}><Plus size={17}/>{t('popup.newList')}</button><button className="if-fan-lists-close" onClick={onClose}>{t('lists.close')}</button></div>
    {newListOpen && <Modal title={t('popup.newList')} width={480} maskClosable={false} onClose={() => setNewListOpen(false)} className="if-message-pro-dialog"><form onSubmit={event => { event.preventDefault(); if (!name.trim()) return; if (creator.lists.some(list => displaySample(list.name).toLowerCase() === name.trim().toLowerCase())) { notify(t('ui.212')); return }; dispatch({ type: 'ADD_LIST', creatorId, payload: { name: name.trim() } }); setNewListOpen(false) }}><div className="if-message-pro-content"><label className="if-message-pro-field">{t('interface.117')}<input autoFocus required maxLength={36} value={name} onChange={event => setName(event.target.value)} /></label></div><div className="if-message-pro-footer"><button type="button" className="if-message-pro-secondary" onClick={() => setNewListOpen(false)}>{t('interface.072')}</button><button className="if-message-pro-primary" disabled={!name.trim()}>{t('popup.add')}</button></div></form></Modal>}
  </Modal>
}
