import { useState } from 'react'
import { Coins, GitBranch, Images, LayoutGrid, List, ListFilter, Percent, Search, X } from 'lucide-react'
import { displaySample, displayScriptCategory, displayScriptTitle, t } from './i18n'
import { IconButton, MediaView } from './ui'
import MediaPreviewDialog from './MediaPreviewDialog'
import { money } from './store'
import type { Media, Message, Script } from './types'
import './script-library.css'

export default function ScriptLibrary({ scripts, media, messages, onChoose, onManage }: { scripts: Script[]; media: Media[]; messages: Message[]; onChoose: (script: Script) => void; onManage: () => void }) {
  const [mode, setMode] = useState<'tag' | 'sequence'>('tag')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [categoryQuery, setCategoryQuery] = useState('')
  const [categorySearch, setCategorySearch] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [alphabetical, setAlphabetical] = useState(false)
  const [preview, setPreview] = useState<Media | null>(null)
  const categories = ['all', ...new Set(scripts.map(script => script.category))]
  const categoryName = (value: string) => value === 'all' ? t('library.all') : displayScriptCategory(value)
  const visibleCategories = categories.filter(value => categoryName(value).toLowerCase().includes(categoryQuery.toLowerCase()))
  if (alphabetical) visibleCategories.sort((a, b) => a === 'all' ? -1 : b === 'all' ? 1 : categoryName(a).localeCompare(categoryName(b)))
  const categoryScripts = scripts.filter(script => category === 'all' || script.category === category)
  const visibleScripts = categoryScripts.filter(script => `${displayScriptTitle(script.title)} ${displaySample(script.text)}`.toLowerCase().includes(query.toLowerCase()))
  const stats = (value: string) => {
    const ids = new Set(scripts.filter(script => value === 'all' || script.category === value).map(script => script.id))
    const sent = messages.filter(message => message.scriptId && ids.has(message.scriptId) && message.direction === 'outbound' && ['sent', 'read'].includes(message.status))
    const purchased = sent.filter(message => message.purchasedAt)
    return { sent: sent.length, rate: sent.length ? (purchased.length / sent.length * 100).toFixed(1) : '0', revenue: purchased.reduce((sum, message) => sum + message.price, 0) }
  }
  return <div className={`if-library${expanded ? ' is-expanded' : ''}`}>
    <header className="if-library-header">
      <div className="if-library-mode" role="tablist" aria-label={t('library.mode')}><button role="tab" aria-selected={mode === 'tag'} onClick={() => setMode('tag')}><List size={20}/>{t('library.tag')}</button><button role="tab" aria-selected={mode === 'sequence'} onClick={() => setMode('sequence')}><GitBranch size={20}/>{t('library.sequence')}</button></div>
      <div className="if-library-search"><input aria-label={t('library.search')} placeholder={t('library.search')} value={query} onChange={event => setQuery(event.target.value)}/>{query ? <IconButton label={t('popup.clear')} onClick={() => setQuery('')}><X size={16}/></IconButton> : <Search size={16}/>}</div>
      <label className="if-library-expanded">{t('library.expanded')}<input type="checkbox" role="switch" checked={expanded} onChange={event => setExpanded(event.target.checked)}/></label>
      <button className="if-library-manage" onClick={onManage}><LayoutGrid size={15}/>{t('library.manage')}</button>
    </header>
    <div className="if-library-body">
      <aside className="if-library-sidebar"><div className="if-library-sidebar-heading"><span>{mode === 'tag' ? t('library.custom') : t('library.sequence')}</span><IconButton label={t('library.sort')} active={alphabetical} onClick={() => setAlphabetical(value => !value)}><ListFilter size={18}/></IconButton><IconButton label={t('library.searchTags')} onClick={() => setCategorySearch(value => !value)}><Search size={19}/></IconButton></div>
        {categorySearch && <input className="if-library-tag-search" aria-label={t('library.searchTags')} placeholder={t('library.searchTags')} autoFocus value={categoryQuery} onChange={event => setCategoryQuery(event.target.value)}/>}
        <nav aria-label={t('library.categories')}>{visibleCategories.map(value => { const metric = stats(value); return <button key={value} className={category === value ? 'active' : ''} onClick={() => setCategory(value)}><strong>{categoryName(value)}</strong><span className="if-library-metrics"><span title={t('library.sent')}><List size={13}/>{metric.sent}</span><span title={t('library.conversion')}><Percent size={13}/>{metric.rate}%</span><span title={t('library.revenue')}><Coins size={13}/>{money(metric.revenue)}</span></span></button> })}</nav>
      </aside>
      <div className="if-library-results" role="tabpanel" aria-label={t(mode === 'tag' ? 'library.tag' : 'library.sequence')}>
        {mode === 'sequence' && <div className="if-library-sequence-heading">{t('library.mockSequence', [categoryName(category)])}</div>}
        {visibleScripts.map((script, index) => <article className="if-library-row" key={script.id}>
          <button className="if-library-script-name" onClick={() => onChoose(script)}>{mode === 'sequence' && <small>{index + 1}</small>}{displayScriptTitle(script.title)}</button>
          <div className="if-library-script-content"><button className="if-library-script-text" onClick={() => onChoose(script)}>{displaySample(script.text)}</button>
            {expanded && !!script.attachments.length && <div className="if-library-media-strip">{script.attachments.map(attachment => { const item = media.find(value => value.id === attachment.mediaId); return item ? <button key={item.id} aria-label={t('chat.complete.previewMedia', [displaySample(item.title)])} onClick={() => setPreview(item)}><MediaView compact media={item}/><Images size={12}/></button> : null })}{script.price > 0 && <span className="if-library-price">{money(script.price)}</span>}</div>}
          </div>
        </article>)}
        {!visibleScripts.length && <p className="if-chat-empty">{t('interface.363')}</p>}
      </div>
    </div>
    {preview && <MediaPreviewDialog media={[preview]} initialIndex={0} onClose={() => setPreview(null)}/>}
  </div>
}
