import { Image as ImageIcon, Lock, Play } from 'lucide-react'
import type { Media, Message } from './types'
import { chatMediaAccess } from './chatPresentation'
import { displaySample, t } from './i18n'
import { MediaView } from './ui'

export default function ChatAttachments({ message, media, onPreview, onCheckout }: {
  message: Message; media: Media[]; onPreview: (ids: string[], initialId: string) => void; onCheckout: () => void;
}) {
  const access = chatMediaAccess(message)
  const availableIds = access.available.map(item => item.mediaId)
  const items = access.available.slice(0, 4)
  return <div className={`if-chat-attachments${items.length > 1 ? ' multiple' : ''}`}>
    {!!items.length && <div className="if-chat-media-grid">{items.map((attachment, index) => {
      const item = media.find(item => item.id === attachment.mediaId)
      const remaining = index === 3 && access.available.length > 4
      if (item?.type === 'audio') return <div className="if-chat-media-tile audio" key={attachment.mediaId}><MediaView media={item}/><button type="button" onClick={() => onPreview(availableIds, attachment.mediaId)}>{t('chat.openMedia')}</button></div>
      return <button type="button" key={attachment.mediaId} className="if-chat-media-tile" aria-label={remaining ? t('chat.showRemainingMedia', [access.available.length]) : t('chat.complete.previewMedia', [item ? displaySample(item.title) : attachment.mediaId])} onClick={() => onPreview(availableIds, attachment.mediaId)}>
        <MediaView compact media={item}/>
        {item?.type === 'video' && <span className="if-chat-media-play"><Play size={19} fill="currentColor"/></span>}
        {!remaining && <span className="if-chat-media-open">{t('chat.openMedia')}</span>}
        {item?.duration && <span className="if-chat-media-duration">{Math.floor(item.duration / 60).toString().padStart(2, '0')}:{Math.floor(item.duration % 60).toString().padStart(2, '0')}</span>}
        {remaining && <span className="if-chat-media-more">+{access.available.length - 3}</span>}
      </button>
    })}</div>}
    {!!access.locked.length && <button type="button" className="if-chat-locked-preview" aria-label={t('chat.unlockFor', [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(message.price)])} onClick={onCheckout}><MediaView compact media={media.find(item => item.id === access.locked[0].mediaId)}/><span className="if-chat-media-play"><Lock size={16}/></span></button>}
    {(access.locked.length > 0 || access.textLocked) && <div className="if-chat-paywall">
      <span><ImageIcon size={13}/>{access.locked.length || <Lock size={13}/>}</span>
      <button type="button" onClick={onCheckout}>{t('chat.unlockFor', [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(message.price)])}</button>
    </div>}
  </div>
}
