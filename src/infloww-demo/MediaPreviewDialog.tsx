import { useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Media } from './types'
import { displaySample, t } from './i18n'
import { IconButton, MediaView, Modal } from './ui'
import './media-details.css'

export default function MediaPreviewDialog({ media, initialIndex, onClose, selectAction }: {
  media: Media[]; initialIndex: number; onClose: () => void;
  selectAction?: { label: string; onSelect: (media: Media) => void; selectedIds?: string[] };
}) {
  const [index, setIndex] = useState(Math.max(0, Math.min(initialIndex, media.length - 1)))
  const body=useRef<HTMLDivElement>(null)
  const mediaKey=media.map(item=>item.id).join('\0')
  useEffect(()=>{if(!media.length){onClose();return}setIndex(Math.max(0,Math.min(initialIndex,media.length-1)))},[mediaKey,initialIndex])
  useEffect(()=>{const move=(event:KeyboardEvent)=>{if(!body.current||!media.length||event.defaultPrevented||event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement||event.target instanceof HTMLMediaElement)return;const dialogs=Array.from(document.querySelectorAll('dialog[open]'));if(body.current.closest('dialog')!==dialogs.at(-1))return;if(event.key==='ArrowLeft'){event.preventDefault();setIndex(value=>Math.max(0,value-1))}if(event.key==='ArrowRight'){event.preventDefault();setIndex(value=>Math.min(media.length-1,value+1))}};document.addEventListener('keydown',move);return()=>document.removeEventListener('keydown',move)},[media.length])
  const current = media[Math.min(index,media.length-1)]
  if (!current) return null
  return <Modal title={displaySample(current.title)} width={1000} onClose={onClose} className="if-media-preview-modal if-shared-media-preview">
    <div className="if-vault-large-preview" ref={body}>
      <IconButton label={t('popup.previousMedia')} disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft size={24}/></IconButton><MediaView key={current.id} media={current}/><IconButton label={t('popup.nextMedia')} disabled={index === media.length - 1} onClick={() => setIndex(index + 1)}><ChevronRight size={24}/></IconButton>
    </div><footer><span>{index + 1} / {media.length}</span>{selectAction && <button className="if-secondary" aria-pressed={selectAction.selectedIds?.includes(current.id)} onClick={() => selectAction.onSelect(current)}><Check size={15}/>{selectAction.selectedIds?.includes(current.id) ? t('popup.deselect') : selectAction.label}</button>}</footer>
  </Modal>
}
