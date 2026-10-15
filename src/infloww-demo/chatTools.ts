import type { Draft, Fan, Message, Script } from './types'
import { content } from './i18n'
import sampleText from './sample-text.json'

const chatTranslations: Array<[string, string]> = Array.from({ length: 10 }, (_, index) => {
  const id = `translation.${String(index + 1).padStart(2, '0')}`
  return [content(id, 'en'), content(id, 'zh')]
})
const sampleTranslations: Array<[string, string]> = Object.values(sampleText as Record<string, { en: string; zh: string }>)
  .filter(entry => !entry.en.includes('{0}') && !entry.zh.includes('{0}'))
  .map(entry => [entry.en, entry.zh])
const translations = [...sampleTranslations, ...chatTranslations]

export function sampleTranslation(text: string, target: 'en' | 'zh'): string | undefined {
  const match = translations.find(pair => pair.includes(text.trim()))
  return match?.[target === 'en' ? 0 : 1]
}

export function fillScript(script: Script, fan: Fan, fallback: string): Partial<Draft> {
  return { text: script.text.replaceAll('{name}', fan.nickname || fallback), attachments: script.attachments.map(item => ({ ...item })), price: script.price, lockedText: script.price > 0, creatorTags: [...script.creatorTags], scheduledAt: undefined, scriptId: script.id, releaseFormIds: [...(script.releaseFormIds || [])] }
}

// A deterministic sample generator. No model or external service is called.
export function sampleSeli(fan: Fan, messages: Message[], prompt: string, count: number, revision: number): string[] {
  const last = messages.filter(message => message.status !== 'withdrawn').slice(-count).at(-1)?.text || ''
  const name = fan.nickname || fan.name.split(' ')[0]
  const chinese = /(?:中文|Chinese|zh-CN)/i.test(prompt)
  let options: string[]
  const locale = chinese ? 'zh' : 'en'
  if (/ready|when|date|delivery|什么时候|交付/i.test(last)) {
    options = [content('seli.ready1', locale, [name]), content('seli.ready2', locale, [name])]
  } else if (/preview|travel|coast|sea|预览|旅行|海边/i.test(last)) {
    options = [content('seli.preview1', locale, [name]), content('seli.preview2', locale, [name])]
  } else {
    options = [content('seli.generic1', locale, [name]), content('seli.generic2', locale, [name])]
  }
  if (/short|concise|简短/i.test(prompt)) options = options.map(text => text.split(/[.。?？]/)[0] + (chinese ? '。' : '.'))
  return revision % 2 ? [...options].reverse() : options
}

export function localDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

let alarmContext: AudioContext | undefined
export function prepareAlarm() {
  alarmContext ??= new AudioContext()
  if (alarmContext.state === 'suspended') void alarmContext.resume()
  return alarmContext
}

export function previewAlarm(sound: string) {
  if (sound === 'none') return
  const context = prepareAlarm()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.connect(gain); gain.connect(context.destination)
  const audioNumber = Number(sound.replace('audio', ''))
  oscillator.frequency.value = sound === 'bell' ? 880 : Number.isFinite(audioNumber) ? 420 + audioNumber * 55 : 520
  gain.gain.setValueAtTime(.08, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .4)
  oscillator.start(); oscillator.stop(context.currentTime + .45)
}
