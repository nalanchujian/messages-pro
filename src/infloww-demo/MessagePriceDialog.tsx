import { useState } from 'react'
import { CircleHelp } from 'lucide-react'
import type { Message } from './types'
import { t } from './i18n'
import { Modal } from './ui'
import { PpvChart } from './InsightsPanel'
import { parseMessagePrice, purchasedPpvHistory } from './messagePricing'
import './message-price.css'

const formatAmount = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)

export default function MessagePriceDialog({ initialPrice, messages, onSave, onClose }: { initialPrice: number; messages: Message[]; onSave: (price: number) => void; onClose: () => void }) {
  const [value, setValue] = useState(initialPrice ? String(initialPrice) : '')
  const price = parseMessagePrice(value)
  const history = purchasedPpvHistory(messages)
  const canSave = price !== null && price !== initialPrice
  return <Modal title={t('interface.024')} width={600} closable={false} maskClosable={false} onClose={onClose} className="if-message-price-dialog"><form onSubmit={event => { event.preventDefault(); if (canSave && price !== null) onSave(price) }}>
    <div className="if-message-price-body">
      <label className="if-message-price-label"><span>{t('messagePrice.price')}</span><div className="if-message-price-input"><span>$</span><input autoFocus aria-label={t('messagePrice.price')} aria-invalid={price === null} aria-describedby="if-message-price-hint" type="text" inputMode="decimal" placeholder={t('messagePrice.free')} value={value} onChange={event => setValue(event.target.value)} /></div></label>
      <p id="if-message-price-hint" className={price === null ? 'if-message-price-invalid' : ''}>{t(price === null ? 'messagePrice.invalid' : 'messagePrice.minimum')}</p>
      <div className="if-message-price-history-heading"><h3>{t('messagePrice.history')}<span className="if-message-price-info" tabIndex={0} aria-label={t('messagePrice.historyHint')}><CircleHelp size={12}/><span role="tooltip">{t('messagePrice.historyHint')}</span></span></h3><div><span>{t('messagePrice.max')} <b>{formatAmount(history.max)}</b></span><span>{t('messagePrice.avg')} <b>{formatAmount(history.avg)}</b></span></div></div>
      <section className="if-message-price-history" aria-label={t('messagePrice.history')}>
        {history.items.length ? <PpvChart pricing messages={history.items}/> : <div className="if-message-price-empty"><svg viewBox="0 0 100 100" width="90" height="90" aria-hidden="true"><g fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><path d="M30 20h28l16 17v45a7 7 0 0 1-7 7H27a7 7 0 0 1-7-7V28a8 8 0 0 1 8-8Z" fill="#fff"/><path d="M58 20v10a7 7 0 0 0 7 7h9" fill="#444"/><path d="m17 18-5-3m12-4-1-5m44 6 2-6m7 13 5-3"/><path stroke="#d6d6d6" strokeWidth="4" d="M29 32h18m-18 8h14m-14 8h19"/><path stroke="#556fff" strokeWidth="4" d="M30 56h9m12 0h10M37 72h14"/></g><g fill="#e9e6ff"><circle cx="5" cy="52" r="2"/><circle cx="88" cy="39" r="2"/><circle cx="83" cy="72" r="1.5"/></g></svg><span>{t('messagePrice.empty')}</span></div>}
      </section>
    </div>
    <footer className="if-message-price-footer"><button type="button" onClick={onClose}>{t('interface.072')}</button><button type="submit" className="if-primary" disabled={!canSave}>{t('interface.073')}</button></footer>
  </form></Modal>
}
