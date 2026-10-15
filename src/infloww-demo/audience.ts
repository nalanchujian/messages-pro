import { emptyOnlineAudience, key } from './types'
import type { DemoState, OnlineAudienceFilter } from './types'

const nonnegative = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
export function normalizeAudience(value?: Partial<OnlineAudienceFilter>): OnlineAudienceFilter {
  return { ...emptyOnlineAudience(), ...value,
    status: value?.status === 'active' || value?.status === 'expired' ? value.status : 'all',
    minSpend: nonnegative(value?.minSpend), minTips: nonnegative(value?.minTips),
    minSubscriptionMonths: nonnegative(value?.minSubscriptionMonths), excludeMessagedHours: nonnegative(value?.excludeMessagedHours),
    excludeListIds: Array.isArray(value?.excludeListIds) ? [...new Set(value.excludeListIds.filter(id => typeof id === 'string'))] : [],
    excludeCreators: value?.excludeCreators === true, includeMuted: value?.includeMuted === true,
  }
}

export function selectOnlineFans(state: DemoState, creatorId: string, value: Partial<OnlineAudienceFilter> | undefined, now: number) {
  const filter = normalizeAudience(value)
  const totals = new Map<string, { spend: number; tips: number }>()
  for (const transaction of state.transactions) {
    if (transaction.creatorId !== creatorId || transaction.at > now || transaction.kind === 'subscription') continue
    const total = totals.get(transaction.fanId) ?? { spend: 0, tips: 0 }
    total.spend += transaction.amount
    if (transaction.kind === 'tip') total.tips += transaction.amount
    totals.set(transaction.fanId, total)
  }
  return (state.fans[creatorId] ?? []).filter(fan => {
    if (!fan.online || fan.cleared || fan.hidden || fan.blocked || fan.restricted || (!filter.includeMuted && fan.muted)) return false
    if (filter.status !== 'all' && (fan.subscriptionStatus === 'expired') !== (filter.status === 'expired')) return false
    if (filter.excludeCreators && fan.isCreator) return false
    if (filter.excludeListIds.some(id => fan.listIds.includes(id))) return false
    const total = totals.get(fan.id) ?? { spend: 0, tips: 0 }
    if (total.spend < filter.minSpend || total.tips < filter.minTips || now - fan.subscribedAt < filter.minSubscriptionMonths * 30 * 86_400_000) return false
    const since = now - filter.excludeMessagedHours * 3_600_000
    if (filter.excludeMessagedHours > 0 && (state.messages[key(creatorId, fan.id)] ?? []).some(message => message.direction === 'outbound' && ['sent', 'read', 'withdrawn'].includes(message.status) && message.createdAt >= since && message.createdAt <= now)) return false
    return true
  })
}
