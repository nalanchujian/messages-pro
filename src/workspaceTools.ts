import type { Conversation, ConversationWorkflow } from './types'
import type { ContentRequest, MediaAsset, PpvRecord } from './operationalDemo'

export type OutgoingIssue = { code: string; title: string; detail: string; severity: 'review' | 'block' }

export function priceGuide(media: MediaAsset, records: PpvRecord[]) {
  const bought = records.filter((record) => record.status === 'purchased').map((record) => record.price)
  const average = bought.length ? bought.reduce((total, price) => total + price, 0) / bought.length : null
  const lowerAnchor = average === null ? media.suggestedPrice : Math.min(media.suggestedPrice, average)
  const upperAnchor = average === null ? media.suggestedPrice : Math.max(media.suggestedPrice, average)
  return {
    low: Math.max(1, Math.round(lowerAnchor * 0.8)),
    high: Math.max(1, Math.round(upperAnchor * 1.25)),
    average,
    purchases: bought.length,
    basis: average === null ? '仅按素材建议价估算；缺少这位粉丝的已购记录' : `参考 ${bought.length} 次已购价格与素材建议价`,
  }
}

export function inspectOutgoing(input: {
  text: string
  media: MediaAsset | undefined
  price: number
  records: PpvRecord[]
  unverifiedFact: boolean
  unconfirmedDelivery: boolean
}): OutgoingIssue[] {
  const issues: OutgoingIssue[] = []
  const text = input.text.trim()
  if (/(?:微信|WeChat|WhatsApp|Telegram|加我(?:好友|联系)|私下转账)/i.test(text)) {
    issues.push({ code: 'external-contact', title: '包含站外联系或付款措辞', detail: '请移除后再发送。', severity: 'block' })
  }
  if (input.unconfirmedDelivery && /(?:保证|确定|一定|肯定).{0,12}(?:交付|送到|发给你|完成)|(?:今天|明天|今晚).{0,8}(?:交付|送到|发给你)/.test(text)) {
    issues.push({ code: 'delivery-promise', title: '交付时间尚未确认', detail: '当前请求仍待核对，请先确认交付安排或改写承诺。', severity: 'review' })
  }
  if (input.unverifiedFact && /(?:你喜欢|你最爱|你一直|你肯定想看)/.test(text)) {
    issues.push({ code: 'unverified-preference', title: '引用了可能未核实的粉丝偏好', detail: '建议核对右侧资料来源，或改为询问式表达。', severity: 'review' })
  }
  if (input.media) {
    const previous = input.records.find((record) => record.mediaId === input.media?.id)
    if (previous) issues.push({ code: 'duplicate-media', title: '该素材已有发送记录', detail: `最近状态：${previous.status === 'purchased' ? '已购买' : previous.status === 'viewed' ? '已查看' : '已发送'}。请确认是否需要再次发送。`, severity: 'review' })
    const guide = priceGuide(input.media, input.records)
    if (input.price < guide.low || input.price > guide.high) issues.push({ code: 'price-outlier', title: '价格超出参考区间', detail: `当前 $${input.price}；参考 $${guide.low}–$${guide.high}。可修改价格或确认后发送。`, severity: 'review' })
  }
  return issues
}

const demoTranslations: Record<string, { zh: string; en: string }> = {
  'I might have to see that one later 😏': { zh: '我可能稍后会看看那个 😏', en: 'I might have to see that one later 😏' },
  'That photo set was amazing': { zh: '那组照片太棒了', en: 'That photo set was amazing' },
  'Sounds good, talk tomorrow!': { zh: '听起来不错，明天聊！', en: 'Sounds good, talk tomorrow!' },
  'Thanks!': { zh: '谢谢！', en: 'Thanks!' },
  'Leg day 完全把我累坏了 😂 新视频是什么？': { zh: '腿部训练累坏我了 😂 新视频是什么？', en: 'Leg day completely wore me out 😂 What is the new video about?' },
  '听起来你很感兴趣 😊 你更想先看哪一部分？': { zh: '听起来你很感兴趣 😊 你更想先看哪一部分？', en: 'Sounds like you are interested 😊 Which part would you like to see first?' },
  '谢谢你支持这组内容！你最喜欢其中哪一部分？我会记下来。': { zh: '谢谢你支持这组内容！你最喜欢其中哪一部分？我会记下来。', en: 'Thank you for supporting this set! Which part did you like most? I will remember it.' },
}

// A front-end demo has no translation provider. Unknown text must be reviewed and translated by a person.
export function demoTranslation(text: string, language: 'zh' | 'en'): string | null {
  return demoTranslations[text.trim()]?.[language] ?? null
}

export function summarizeConversation(input: {
  conversation: Conversation
  workflow: ConversationWorkflow
  ppvRecords: PpvRecord[]
  requests: ContentRequest[]
  owner: string
}): string {
  const recent = input.conversation.messages.slice(-3).map((message) => `${message.direction === 'inbound' ? '粉丝' : '团队'}：${message.text}`).join('\n')
  const openRequest = input.requests.find((request) => request.status !== 'delivered')
  const latestPpv = input.ppvRecords[0]
  return [
    `关系背景：${input.conversation.summary}`,
    `最近对话：\n${recent || '暂无消息记录'}`,
    `当前状态：${openRequest ? `${openRequest.title} · ${openRequest.status === 'paid' ? '已付款待交付' : openRequest.status === 'quoted' ? '已报价' : '待报价'}` : '无待处理内容请求'}${latestPpv ? `；最近 PPV ${latestPpv.status === 'purchased' ? '已购买' : latestPpv.status === 'viewed' ? '已查看' : '已发送'}` : ''}`,
    `交接提醒：${input.workflow.fulfillmentStatus === 'awaiting-review' || input.workflow.fulfillmentStatus === 'reviewing' ? '先核对交付安排，再向粉丝承诺时间。' : '回复前核对最新消息与记录。'}负责人：${input.owner}。`,
  ].join('\n\n')
}
