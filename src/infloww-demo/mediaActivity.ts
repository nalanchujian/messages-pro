import type { Message, WithdrawalRecord } from './types'

export type MediaActivity = {
  id: string; messageId: string; kind: 'sent' | 'unpaid' | 'bought' | 'withdrawn';
  at: number; price: number; sender: string;
}

// The caller supplies one creator/fan scope; withdrawal snapshots also retain cleared history.
export function mediaHistory(messages: Message[], mediaId: string, withdrawals: WithdrawalRecord[] = []): MediaActivity[] {
  const entries = new Map(messages.map(message => [message.id, message]))
  withdrawals.forEach(record => { if (!entries.has(record.message.id)) entries.set(record.message.id, record.message) })
  const result: MediaActivity[] = []
  for (const message of entries.values()) {
    const attachment = message.attachments.find(item => item.mediaId === mediaId)
    if (!attachment || message.direction !== 'outbound' || ['failed', 'sending'].includes(message.status)) continue
    const price = attachment.free ? 0 : message.price
    result.push({ id: `${message.id}:sent`, messageId: message.id, kind: price > 0 ? 'unpaid' : 'sent', at: message.createdAt, price, sender: message.sender })
    if (price > 0 && message.purchasedAt) result.push({ id: `${message.id}:bought`, messageId: message.id, kind: 'bought', at: message.purchasedAt, price, sender: message.sender })
    const withdrawal = withdrawals.find(record => record.message.id === message.id)
    if (withdrawal) result.push({ id: `${message.id}:withdrawn`, messageId: message.id, kind: 'withdrawn', at: withdrawal.withdrawnAt, price, sender: withdrawal.withdrawnBy })
    else if (message.status === 'withdrawn') result.push({ id: `${message.id}:withdrawn`, messageId: message.id, kind: 'withdrawn', at: message.createdAt, price, sender: message.sender })
  }
  const rank={withdrawn:3,bought:2,unpaid:1,sent:1}
  return result.sort((a, b) => b.at - a.at || rank[b.kind]-rank[a.kind] || a.id.localeCompare(b.id))
}

export function latestMediaActivity(messages: Message[], mediaId: string, withdrawals: WithdrawalRecord[] = []) {
  return mediaHistory(messages, mediaId, withdrawals)[0]
}
