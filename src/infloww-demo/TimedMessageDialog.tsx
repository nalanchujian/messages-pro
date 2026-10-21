import { useRef, useState } from 'react'
import { CircleHelp, MessageSquare, Plus, Settings2, Smile, X } from 'lucide-react'
import { displaySample, t } from './i18n'
import { emptyDraft } from './types'
import type { Draft, Media } from './types'
import { useDemo, messagesFor } from './store'
import { AnchoredPopover, IconButton, MediaView, Modal } from './ui'
import { fillScript, prepareAlarm, previewAlarm } from './chatTools'
import ChatMediaPicker from './ChatMediaPicker'
import CreatorTagsDialog from './CreatorTagsDialog'
import EmojiPicker from './EmojiPicker'
import ScriptLibrary from './ScriptLibrary'
import MediaPreviewDialog from './MediaPreviewDialog'
import { SelectField } from './ProfileFields'
import './timed-message.css'

export default function TimedMessageDialog({ initialMode, initialDraft, onClose }: { initialMode: 'timed' | 'reminder'; initialDraft: Draft; onClose: () => void }) {
  const { state, creator, fan, dispatch, notify } = useDemo()
  const [mode, setMode] = useState(initialMode)
  const [minutes, setMinutes] = useState('1')
  const [draft, setDraft] = useState<Draft>(() => ({ ...structuredClone(initialDraft), scheduledAt: undefined }))
  const [sound, setSound] = useState('audio1')
  const [formatOpen, setFormatOpen] = useState(false)
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null)
  const [emojiSettings, setEmojiSettings] = useState(false)
  const [favoriteEmojis, setFavoriteEmojis] = useState([...state.emojis])
  const [scriptsOpen, setScriptsOpen] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<string[]>([])
  const [tagsOpen, setTagsOpen] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  if (!fan) return null
  const origin = { creatorId: creator.id, fanId: fan.id }
  const messages = messagesFor(state, creator.id, fan.id)
  const paidCount = draft.attachments.filter(item => !item.free && draft.price > 0).length
  const validDuration = Number.isInteger(Number(minutes)) && Number(minutes) >= 1 && Number(minutes) <= 60
  const unavailable = fan.blocked || fan.restricted || fan.cleared || (fan.subscriptionStatus === 'expired' && !fan.creatorSubscribed)
  const invalidMessage = unavailable || (!draft.text.trim() && !draft.attachments.length) || !Number.isFinite(draft.price) || draft.price < 0 || draft.price > 200 || (draft.price > 0 && (draft.price < 3 || (!draft.lockedText && !paidCount)))
  const patch = (value: Partial<Draft>) => setDraft(current => ({ ...current, ...value }))
  const selectMedia = (item: Media) => {
    if (item.type === 'gif' && (draft.attachments.length || draft.price || draft.creatorTags.length || draft.releaseFormIds?.length)) { notify(t('interface.274')); return }
    if (draft.attachments.some(attachment => state.media.find(media => media.id === attachment.mediaId)?.type === 'gif')) { notify(t('interface.275')); return }
    if (item.type === 'gif') { setSelectedMedia(current => current.includes(item.id) ? [] : [item.id]); return }
    setSelectedMedia(current => { const compatible = current.filter(id => state.media.find(media => media.id === id)?.type !== 'gif'); return compatible.includes(item.id) ? compatible.filter(id => id !== item.id) : compatible.length + draft.attachments.length < 40 ? [...compatible,item.id] : compatible })
  }
  const insert = (text: string) => {
    const input = inputRef.current, start = input?.selectionStart ?? draft.text.length, end = input?.selectionEnd ?? start
    const result = draft.text.slice(0, start) + text + draft.text.slice(end)
    if (result.length > 6500) return
    patch({ text: result })
    requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + text.length, start + text.length) })
  }
  const start = () => {
    if (!validDuration || (mode === 'timed' && invalidMessage)) return
    if (mode === 'reminder') prepareAlarm()
    const resolved = { ...draft, text: draft.text.replaceAll('{name}', fan.nickname || creator.defaultNickname || fan.name), scheduledAt: undefined }
    dispatch({ type: 'CREATE_TASK', ...origin, payload: mode === 'timed' ? { kind: 'timed', minutes: Number(minutes), draft: resolved } : { kind: 'reminder', minutes: Number(minutes), text: fan.name, alarmSound: sound } })
    onClose()
  }
  return <Modal title={t('timed.title')} width={566} header={false} maskClosable={false} onClose={onClose} className="if-timed-dialog">
    <div className="if-timed-layout">
      <header className="if-timed-header"><h2>{t('timed.title')}</h2><div role="tablist" aria-label={t('popup.timing')}><button role="tab" aria-selected={mode === 'timed'} onClick={() => setMode('timed')}>{t('popup.timedMessage')}</button><button role="tab" aria-selected={mode === 'reminder'} onClick={() => setMode('reminder')}>{t('popup.timedReminder')}</button></div></header>
      <div className="if-timed-body" role="tabpanel" aria-label={t(mode === 'timed' ? 'popup.timedMessage' : 'popup.timedReminder')}>
        <label className="if-timed-label"><span><b>*</b>{t(mode === 'timed' ? 'timed.sendAfter' : 'timed.remindAfter')}</span><div className="if-timed-duration"><input aria-label={t('popup.duration')} type="number" min={1} max={60} step={1} value={minutes} onChange={event => setMinutes(event.target.value)}/><span>{t('timed.minutes')}</span></div></label>
        {mode === 'timed' ? <>
          <div className="if-timed-label"><label htmlFor="if-timed-text"><b>*</b>{t('timed.message')}</label><div className="if-timed-editor">
            {formatOpen && <div className="if-timed-format"><button aria-label={t('interface.306')} aria-pressed={draft.format.bold} onClick={() => patch({ format: { ...draft.format, bold: !draft.format.bold } })}><b>B</b></button><button aria-label={t('interface.307')} aria-pressed={draft.format.italic} onClick={() => patch({ format: { ...draft.format, italic: !draft.format.italic } })}><i>I</i></button><SelectField label={t('interface.305')} width={90} value={String(draft.format.size)} options={[12,14,16,18,22].map(size => ({ value: String(size), label: `${size}px` }))} onChange={value => patch({ format: { ...draft.format, size: Number(value) } })}/><button onClick={() => patch({ format: emptyDraft().format })}>{t('interface.310')}</button></div>}
            <textarea id="if-timed-text" ref={inputRef} aria-label={t('timed.message')} maxLength={6500} rows={3} placeholder={t('timed.placeholder')} value={draft.text} onChange={event => patch({ text: event.target.value })} style={{ fontSize: draft.format.size, fontWeight: draft.format.bold ? 700 : 400, fontStyle: draft.format.italic ? 'italic' : 'normal', color: draft.format.color }}/>
            <div className="if-timed-tags"><span>{t('timed.tags')}</span><button onClick={() => insert('{name}')}>{'{name}'}</button><span title={t('timed.nameHelp')}><CircleHelp size={13}/></span><button aria-label={t('interface.026')} aria-pressed={formatOpen} onClick={() => setFormatOpen(value => !value)}>Aa</button></div>
            <div className="if-timed-editor-tools"><div className="if-timed-emojis"><IconButton label={t('interface.028')} onClick={event => setEmojiAnchor(value => value ? null : event.currentTarget)}><Smile size={17}/></IconButton><IconButton label={t('interface.029')} onClick={() => { setFavoriteEmojis([...state.emojis]); setEmojiSettings(true) }}><Settings2 size={17}/></IconButton>{state.emojis.map((emoji, index) => <button key={`${emoji}-${index}`} onClick={() => insert(emoji)}>{emoji}</button>)}</div><button className="if-timed-scripts" onClick={() => setScriptsOpen(true)}><MessageSquare size={16}/>{t('ui.280')}</button></div>
          </div></div>
          <section className="if-timed-media"><div className="if-timed-price-row"><label>{t('timed.price')}<span className="if-timed-price-input"><span>$</span><input aria-label={t('interface.024')} type="number" min={0} max={200} step={.01} value={draft.price || ''} onChange={event => { const price = Math.max(0, Math.min(200, Number(event.target.value) || 0)); patch({ price, lockedText: false, attachments: draft.attachments.map(item => ({ ...item, free: price === 0 ? true : draft.price === 0 ? false : item.free })) }) }}/></span></label><span><b>{paidCount}</b> {t('timed.ppvCount', [draft.attachments.length])}</span></div>
            <div className="if-timed-attachments"><button className="if-timed-select-media" disabled={draft.attachments.length >= 40} onClick={() => { setSelectedMedia([]); setMediaOpen(true) }}><Plus size={24}/>{t('popup.select')}</button>{draft.attachments.map(attachment => <div key={attachment.mediaId}><button className="if-timed-thumbnail" aria-label={t('chat.complete.previewMedia', [displaySample(state.media.find(item => item.id === attachment.mediaId)?.title || attachment.mediaId)])} onClick={() => setPreviewId(attachment.mediaId)}><MediaView compact media={state.media.find(item => item.id === attachment.mediaId)}/></button><IconButton label={t('popup.removeMedia', [attachment.mediaId])} onClick={() => patch({ attachments: draft.attachments.filter(item => item.mediaId !== attachment.mediaId) })}><X size={13}/></IconButton><label><input type="checkbox" disabled={!draft.price} checked={!!draft.price && !attachment.free} onChange={event => patch({ attachments: draft.attachments.map(item => item.mediaId === attachment.mediaId ? { ...item, free: !event.target.checked } : item) })}/>{t('popup.paid')}</label></div>)}</div>
            {draft.price > 0 && (draft.price < 3 || !paidCount) && <p className="if-timed-warning">{t('timed.priceHint')}</p>}
          </section>
          <div className="if-timed-creators"><span>{t('timed.tagCreators')}</span><button onClick={() => setTagsOpen(true)}>{t('timed.addCreator')}</button><div>{draft.creatorTags.map(id => <span key={id}>{state.creators.find(item => item.id === id)?.name || id}</span>)}{draft.releaseFormIds?.map(id => <span key={id}>{state.releaseForms?.find(item => item.id === id)?.name || id}</span>)}</div></div>
        </> : <div className="if-timed-reminder"><label className="if-timed-label">{t('popup.alarm')}<SelectField label={t('popup.alarm')} width={280} value={sound} options={Array.from({ length: 12 }, (_, index) => ({ value: `audio${index + 1}`, label: t('popup.audio', [index + 1]) }))} onChange={value => { setSound(value); previewAlarm(value) }}/></label></div>}
      </div>
      <footer className="if-timed-footer"><button onClick={onClose}>{t('interface.072')}</button><button className="if-primary" disabled={!validDuration || (mode === 'timed' && invalidMessage)} onClick={start}>{t('popup.start')}</button></footer>
    </div>
    {emojiAnchor && <AnchoredPopover title={t('interface.028')} anchor={emojiAnchor} onClose={() => setEmojiAnchor(null)} width={380} className="if-emoji-popover"><EmojiPicker onPick={insert}/></AnchoredPopover>}
    {emojiSettings && <Modal title={t('interface.029')} onClose={() => setEmojiSettings(false)} maskClosable={false} className="if-tool-dialog"><div className="if-timed-favorite-emojis">{favoriteEmojis.map(emoji => <button key={emoji} title={t('popup.removeMedia', [emoji])} onClick={() => setFavoriteEmojis(items => items.filter(item => item !== emoji))}>{emoji} ×</button>)}</div><EmojiPicker onPick={emoji => setFavoriteEmojis(items => items.includes(emoji) ? items : [...items,emoji].slice(0,40))}/><div className="if-modal-actions"><button onClick={() => setEmojiSettings(false)}>{t('interface.072')}</button><button className="if-primary" onClick={() => { dispatch({ type: 'PATCH_EMOJIS', payload: favoriteEmojis }); setEmojiSettings(false) }}>{t('interface.073')}</button></div></Modal>}
    {scriptsOpen && <Modal title={t('ui.280')} width={1100} header={false} maskClosable={false} onClose={() => setScriptsOpen(false)} className="if-timed-library"><ScriptLibrary scripts={state.scripts} media={state.media} messages={messages} onChoose={script => { setDraft({ ...emptyDraft(), ...fillScript({ ...script, text: displaySample(script.text) }, fan, displaySample(creator.defaultNickname)) }); setScriptsOpen(false) }} onManage={() => notify(t('navigation.page', [t('chat.complete.scriptsPage')]))}/><footer className="if-timed-footer"><button onClick={() => setScriptsOpen(false)}>{t('lists.close')}</button></footer></Modal>}
    {mediaOpen && <Modal title={t('popup.vault')} width={1100} header={false} maskClosable={false} onClose={() => setMediaOpen(false)} className="if-vault-modal"><ChatMediaPicker media={state.media.filter(item => !draft.attachments.some(attachment => attachment.mediaId === item.id))} messages={messages} selectedIds={selectedMedia} onSelect={selectMedia}/><footer className="if-timed-footer"><button onClick={() => setMediaOpen(false)}>{t('lists.close')}</button>{selectedMedia.length > 0 && <button className="if-primary" disabled={!selectedMedia.length} onClick={() => { patch({ attachments: [...draft.attachments,...selectedMedia.map(mediaId => ({ mediaId, free: draft.price === 0 }))] }); setMediaOpen(false) }}>{t('popup.add')} ({selectedMedia.length})</button>}</footer></Modal>}
    {tagsOpen && <CreatorTagsDialog creators={state.creators} selectedIds={draft.creatorTags} releaseForms={state.releaseForms?.filter(item => !item.creatorId || item.creatorId === creator.id)} selectedReleaseFormIds={draft.releaseFormIds} onClose={() => setTagsOpen(false)} onAdd={(creatorTags, releaseFormIds) => { patch({ creatorTags, releaseFormIds }); setTagsOpen(false) }}/>}
    {previewId && <MediaPreviewDialog media={state.media.filter(item => item.id === previewId)} initialIndex={0} onClose={() => setPreviewId(null)}/>}
  </Modal>
}
