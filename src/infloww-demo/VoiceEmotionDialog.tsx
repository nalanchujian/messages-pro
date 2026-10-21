import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { t } from './i18n'
import { Modal } from './ui'
import './voice-emotion.css'

const emotions = [
  { id: 'normal', emoji: '🙂', code: 'KeyZ', rate: 1, pitch: 1 },
  { id: 'annoyed', emoji: '😒', code: 'KeyD', rate: .95, pitch: .9 },
  { id: 'disappointed', emoji: '😞', code: 'KeyX', rate: .85, pitch: .85 },
  { id: 'excited', emoji: '😃', code: 'KeyC', rate: 1.15, pitch: 1.2 },
  { id: 'flirt', emoji: '😉', code: 'KeyA', rate: .9, pitch: 1.1 },
  { id: 'grateful', emoji: '🙏', code: 'KeyS', rate: .95, pitch: 1.05 },
] as const
const storageKey = 'infloww-voice-emotion-shortcuts'
type EmotionId = typeof emotions[number]['id']
type Shortcuts = Record<EmotionId, string>
const defaults = () => Object.fromEntries(emotions.map(item => [item.id, item.code])) as Shortcuts
function loadShortcuts(): Shortcuts {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as Shortcuts | null
    if (saved && emotions.every(item => /^Key[A-Z]$/.test(saved[item.id])) && new Set(Object.values(saved)).size === emotions.length) return saved
  } catch { /* Fall back to the screenshot's six shortcuts. */ }
  return defaults()
}

export default function VoiceEmotionDialog({ open, text, onClose, notify, disabled = false }: { open: boolean; text: string; onClose: () => void; notify: (message: string) => void; disabled?: boolean }) {
  const [shortcuts, setShortcuts] = useState(loadShortcuts)
  const [binding, setBinding] = useState<EmotionId | null>(null)
  const [playing, setPlaying] = useState<EmotionId | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const stop = () => {
    if (utteranceRef.current && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    utteranceRef.current = null
    setPlaying(null)
  }
  const preview = (id: EmotionId) => {
    if (disabled) return
    if (!text.trim()) { notify(t('voice.empty')); return }
    if (!('speechSynthesis' in window)) { notify(t('voice.unavailable')); return }
    const locale = /[\u3400-\u9fff]/.test(text) ? 'zh' : 'en'
    const voice = window.speechSynthesis.getVoices().find(item => item.localService && item.lang.toLowerCase().startsWith(locale))
    if (!voice) { notify(t('voice.unavailable')); return }
    stop()
    const emotion = emotions.find(item => item.id === id)!
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = voice
    utterance.lang = voice.lang
    utterance.rate = emotion.rate
    utterance.pitch = emotion.pitch
    utterance.onend = () => { if (utteranceRef.current === utterance) { utteranceRef.current = null; setPlaying(null) } }
    utterance.onerror = () => { if (utteranceRef.current === utterance) { utteranceRef.current = null; setPlaying(null); notify(t('voice.unavailable')) } }
    utteranceRef.current = utterance
    setPlaying(id)
    window.speechSynthesis.speak(utterance)
  }
  useEffect(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices()
    return () => { if (utteranceRef.current && 'speechSynthesis' in window) window.speechSynthesis.cancel() }
  }, [])
  useEffect(() => { if (!open) { setBinding(null); stop() } }, [open])
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing || binding || disabled || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      // Other dialogs and popovers own their keyboard input.
      if (!open && document.querySelector('dialog[open], [popover]:popover-open, [role=dialog][aria-modal=true]')) return
      const emotion = emotions.find(item => shortcuts[item.id] === event.code)
      if (!emotion) return
      event.preventDefault()
      preview(emotion.id)
    }
    document.addEventListener('keydown', keydown)
    return () => document.removeEventListener('keydown', keydown)
  }, [text, binding, disabled, open, shortcuts, notify])
  if (!open) return null
  const close = () => { setBinding(null); stop(); onClose() }
  return <Modal title={t('voice.title')} width={360} onClose={close} maskClosable={false} className="if-voice-emotion-dialog">
    <div className="if-voice-emotions" onKeyDownCapture={event => {
      if (!binding) return
      event.preventDefault(); event.stopPropagation()
      if (event.key === 'Escape') { setBinding(null); return }
      if (!/^Key[A-Z]$/.test(event.code) || event.metaKey || event.ctrlKey || event.shiftKey) return
      if (emotions.some(item => item.id !== binding && shortcuts[item.id] === event.code)) { notify(t('voice.conflict')); return }
      const next = { ...shortcuts, [binding]: event.code }
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { notify(t('voice.saveFailed')); return }
      setShortcuts(next); setBinding(null)
    }}>
      {emotions.map(emotion => <div className={`if-voice-emotion-row${playing === emotion.id ? ' is-playing' : ''}`} key={emotion.id}>
        <button className="if-voice-emotion-choice" disabled={disabled} onClick={() => { setBinding(null); preview(emotion.id) }}><span aria-hidden="true">{emotion.emoji}</span><strong>{t(`voice.emotion.${emotion.id}`)}</strong>{playing === emotion.id && <Loader2 size={14} className="if-spinning"/>}</button>
        <button className={`if-voice-shortcut${binding === emotion.id ? ' is-binding' : ''}`} aria-label={t('voice.rebind', [t(`voice.emotion.${emotion.id}`)])} aria-pressed={binding === emotion.id} onClick={() => setBinding(value => value === emotion.id ? null : emotion.id)} title={t('voice.rebindHint')}>{binding === emotion.id ? '…' : `⌥${shortcuts[emotion.id].slice(3)}`}</button>
      </div>)}
      <p>{binding ? t('voice.rebindHint') : t('voice.hint')}</p>
    </div>
    <footer className="if-voice-footer"><button onClick={close}>{t('lists.close')}</button></footer>
  </Modal>
}
