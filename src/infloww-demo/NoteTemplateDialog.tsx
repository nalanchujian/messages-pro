import { useEffect, useRef, useState } from 'react'
import { t } from './i18n'
import { useDemo } from './store'
import { Modal } from './ui'

export default function NoteTemplateDialog({ creatorId, onClose, onSaved }: { creatorId: string; onClose: () => void; onSaved: () => void }) {
  const { state, dispatch } = useDemo()
  const creator = state.creators.find(item => item.id === creatorId)!
  const original = creator.fanNoteTemplate ?? t('ui.309')
  const [template, setTemplate] = useState(original)
  const editor = useRef<HTMLTextAreaElement>(null)
  useEffect(() => editor.current?.focus(), [])
  return <Modal title={t('noteTemplate.title')} width={600} maskClosable={false} onClose={onClose} className="if-tool-dialog if-note-template-dialog">
    <form onSubmit={event => { event.preventDefault(); if (template === original) return; dispatch({ type: 'SET_NOTE_TEMPLATE', creatorId, payload: template }); onSaved(); onClose() }}>
      <p className="if-muted">{t('noteTemplate.description')}</p>
      <label className="if-field">{t('noteTemplate.content')}<textarea ref={editor} aria-label={t('noteTemplate.content')} rows={12} maxLength={10000} value={template} onChange={event => setTemplate(event.target.value)} /></label>
      <div className="if-modal-actions"><button type="button" onClick={onClose}>{t('interface.072')}</button><button type="submit" className="if-primary" disabled={template === original}>{t('ui.391')}</button></div>
    </form>
  </Modal>
}
