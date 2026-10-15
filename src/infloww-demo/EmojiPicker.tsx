import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { getLocale, t } from './i18n'
import categories from './emoji-data.json'

export default function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const matches = categories.filter(item => (category === 'all' || category === item.id) && (!query.trim() || `${item.en} ${item.zh} ${item.emojis.join('')}`.toLowerCase().includes(query.trim().toLowerCase())))
  return <div className="if-emoji-browser">
    <div className="if-emoji-search"><Search size={16} /><input aria-label={t('popup.emojiSearch')} placeholder={t('popup.emojiSearch')} value={query} onChange={event => setQuery(event.target.value)} />{query && <button aria-label={t('popup.clear')} onClick={() => setQuery('')}><X size={14} /></button>}</div>
    <nav aria-label={t('popup.categories')}><button aria-label={t('interface.361')} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>◷</button>{categories.map(item => <button key={item.id} title={item[getLocale()]} aria-label={item[getLocale()]} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.icon}</button>)}</nav>
    <div className="if-emoji-categories">{matches.map(item => <section key={item.id}><h3>{item[getLocale()]}</h3><div>{item.emojis.map(emoji => <button type="button" key={emoji} onClick={() => onPick(emoji)}>{emoji}</button>)}</div></section>)}</div>
  </div>
}
