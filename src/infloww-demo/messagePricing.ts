import type { Message } from './types'

export function parseMessagePrice(value: string): number | null {
  const text = value.trim()
  if (!text) return 0
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(text)) return null
  const amount = Number(text)
  return Number.isFinite(amount) && (amount === 0 || (amount >= 3 && amount <= 200)) ? amount : null
}

export function purchasedPpvHistory(messages: Message[]) {
  const items = messages.filter(message => message.direction === 'outbound' && message.price > 0 && Number.isFinite(message.price) && typeof message.purchasedAt === 'number' && Number.isFinite(message.purchasedAt) && message.purchasedAt > 0 && ['sent', 'read'].includes(message.status))
    .sort((a, b) => b.purchasedAt! - a.purchasedAt!).slice(0, 30)
  return { items, max: items.length ? Math.max(...items.map(item => item.price)) : 0, avg: items.length ? items.reduce((sum, item) => sum + item.price, 0) / items.length : 0 }
}
