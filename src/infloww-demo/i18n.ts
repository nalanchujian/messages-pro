import uiText from './ui-text.json'
import interfaceText from './interface-text.json'
import sampleText from './sample-text.json'
import engineText from './engine-text.json'
import chatText from './chat-text.json'
import completionText from './completion-text.json'
import chatCompletionText from './chat-completion-text.json'
import inboxCompletionText from './inbox-completion-text.json'
import insightsCompletionText from './insights-completion-text.json'
import type { Fan, Media, Message } from './types'

export type Locale = 'en' | 'zh'
export const LOCALE_STORAGE_KEY = 'infloww-demo-locale'

let currentLocale: Locale = 'en'
const catalog = { ...uiText, ...interfaceText, ...engineText, ...completionText, ...chatCompletionText, ...inboxCompletionText, ...insightsCompletionText } as Record<string, { en: string; zh: string }>

export function getLocale(): Locale { return currentLocale }
export function setLocale(locale: Locale) { currentLocale = locale }

export function t(id: string, args: unknown[] = []): string {
  const entry = catalog[id]
  const value = entry?.[currentLocale] || entry?.en || id
  return value.replace(/\{(\d+)\}/g, (_, index: string) => String(args[Number(index)] ?? ''))
}

export function subscriptionStatusLabel(status: Fan['subscriptionStatus']): string {
  return t(`status.subscription.${status}`)
}

export function messageStatusLabel(status: Message['status']): string {
  return t(`status.message.${status}`)
}

export function mediaTypeLabel(type: Media['type']): string {
  return t(`media.type.${type}`)
}

const sourceAliases: Record<string, string> = {
  Unknown: 'Unknown', '未知': 'Unknown',
  Other: 'Other', '其他': 'Other',
  'Free trial': 'Free trial link', 'Free trial link': 'Free trial link', '免费试用链接': 'Free trial link',
  'Tracking link': 'Tracking link', '追踪链接': 'Tracking link',
}

export function sourceValue(source: string): string { return sourceAliases[source] ?? source }
export function sourceLabel(source: string): string {
  const keys: Record<string, string> = { Unknown: 'ui.305', Other: 'ui.306', 'Free trial link': 'ui.307', 'Tracking link': 'ui.308' }
  return keys[sourceValue(source)] ? t(keys[sourceValue(source)]) : source
}

export function countryLabel(timeZone: string, fallback: string): string {
  const keys: Record<string, string> = {
    'America/New_York': 'ui.286', 'America/Los_Angeles': 'ui.286', 'Europe/London': 'ui.289',
    'America/Toronto': 'ui.291', 'Europe/Paris': 'ui.293', 'Europe/Berlin': 'ui.295',
    'Europe/Madrid': 'ui.297', 'Australia/Sydney': 'ui.299', 'Asia/Shanghai': 'ui.301', 'Asia/Tokyo': 'ui.303',
  }
  return keys[timeZone] ? t(keys[timeZone]) : displaySample(fallback)
}

// Seed values stay stable in persisted demo state.
export function sample(id: string, args: unknown[] = []): string {
  const value = (sampleText as Record<string, { en: string; zh: string }>)[id]?.zh ?? id
  return value.replace(/\{(\d+)\}/g, (_, index: string) => String(args[Number(index)] ?? ''))
}

export function content(id: string, locale: Locale, args: unknown[] = []): string {
  const value = (chatText as Record<string, { en: string; zh: string }>)[id]?.[locale] ?? id
  return value.replace(/\{(\d+)\}/g, (_, index: string) => String(args[Number(index)] ?? ''))
}

// Built-in demo records use persisted seed values. Resolve only whole, known values;
// user-entered text is never scanned or rewritten.
const sampleEntries = sampleText as Record<string, { en: string; zh: string }>
const sampleByValue = new Map<string, { en: string; zh: string }>()
for (const entry of Object.values(sampleEntries)) {
  if (entry.en.includes('{0}')) {
    for (let count = 0; count <= 24; count++) {
      const en = entry.en.replace('{0}', String(count))
      const expanded = { en: count === 1 ? en.replace(/\bmonths\b/, 'month').replace(/\bdays\b/, 'day') : en, zh: entry.zh.replace('{0}', String(count)) }
      sampleByValue.set(expanded.en, expanded)
      sampleByValue.set(expanded.zh, expanded)
    }
  } else {
    sampleByValue.set(entry.en, entry)
    sampleByValue.set(entry.zh, entry)
  }
}
export function displaySample(value: string): string { return sampleByValue.get(value)?.[currentLocale] ?? value }

// Generated script labels are UI copy; the message text itself remains a stable sample or user value.
export function displayScriptTitle(title: string): string {
  const prefix = 'Saved · '
  if (!title.startsWith(prefix)) return displaySample(title)
  const original = title.slice(prefix.length)
  const sampleEntry = sampleByValue.get(original) ?? Object.values(sampleEntries).find(entry => entry.zh.startsWith(original) || entry.en.startsWith(original))
  return `${t('engine.30')} · ${(sampleEntry?.[currentLocale] ?? original).slice(0, 24)}`
}

export function displayScriptCategory(category: string): string {
  return category === 'Saved' || category === '已保存' ? t('engine.30') : displaySample(category)
}
