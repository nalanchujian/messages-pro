export type MediaAsset = {
  id: string
  title: string
  category: string
  tags: string[]
  suggestedPrice: number
  description: string
}

export type ScriptTemplate = {
  id: string
  title: string
  purpose: string
  text: string
}

export type PpvRecord = {
  id: string
  conversationId: string
  mediaId: string
  caption: string
  price: number
  status: 'sent' | 'viewed' | 'purchased'
  sentAt: string
  source: 'sample' | 'demo'
  followUpDone?: boolean
}

export type ContentRequest = {
  id: string
  conversationId: string
  title: string
  price: number | null
  status: 'new' | 'quoted' | 'paid' | 'delivered'
  owner: string
  updatedAt: string
  source: 'sample' | 'demo'
}

export type HandoffNote = { text: string; savedAt: number }

export type FollowUpReminder = {
  id: string
  conversationId: string
  text: string
  dueAt: number
  status: 'scheduled' | 'done'
}

export const mediaAssets: MediaAsset[] = [
  { id: 'beach-training', title: '海边训练预览', category: '训练', tags: ['海边', '运动'], suggestedPrice: 18, description: '短片预览，适合先征询兴趣。' },
  { id: 'studio-photos', title: '新照片集', category: '照片', tags: ['写真', '新内容'], suggestedPrice: 12, description: '最近更新的主题照片集。' },
  { id: 'travel-diary', title: '旅行日记', category: '生活', tags: ['旅行', '日常'], suggestedPrice: 16, description: '轻松的旅行片段与幕后记录。' },
  { id: 'custom-preview', title: '定制内容预览', category: '定制', tags: ['专属', '预览'], suggestedPrice: 25, description: '发送前需确认对应请求的交付安排。' },
]

export const scriptTemplates: ScriptTemplate[] = [
  { id: 'reply-interest', title: '回应兴趣', purpose: '先延续聊天，不直接推销', text: '听起来你很感兴趣 😊 你更想先看哪一部分？' },
  { id: 'purchase-thanks', title: '购买致谢', purpose: '确认购买体验与偏好', text: '谢谢你支持这组内容！你最喜欢其中哪一部分？我会记下来。' },
  { id: 'delivery-update', title: '交付进度', purpose: '已付款请求，避免承诺未确认时间', text: '我已看到你的付款，正在和团队核对交付安排。确认后会告诉你准确时间。' },
  { id: 'renewal-care', title: '续订关怀', purpose: '尊重已约定的沟通节奏', text: '按我们约定的时间来聊聊 🙂 最近有什么想看的内容吗？' },
]

export function initialPpvRecords(): PpvRecord[] {
  return [
    { id: 'sample-mason-beach', conversationId: 'mason', mediaId: 'beach-training', caption: '训练片段抢先看', price: 18, status: 'purchased', sentAt: '今日 09:10', source: 'sample', followUpDone: true },
    { id: 'sample-leo-studio', conversationId: 'leo', mediaId: 'studio-photos', caption: '新照片集', price: 12, status: 'purchased', sentAt: '32 分钟前', source: 'sample' },
    { id: 'sample-chris-travel', conversationId: 'chris', mediaId: 'travel-diary', caption: '旅行日记', price: 16, status: 'viewed', sentAt: '昨天', source: 'sample' },
  ]
}

export function initialContentRequests(): ContentRequest[] {
  return [{ id: 'sample-riley-request', conversationId: 'riley', title: '定制内容请求', price: null, status: 'paid', owner: '团队待确认', updatedAt: '6 分钟前', source: 'sample' }]
}

export function restorePpvRecords(saved: unknown, conversationIds: Set<string>): PpvRecord[] {
  if (!Array.isArray(saved)) return initialPpvRecords().filter((record) => conversationIds.has(record.conversationId))
  const valid = saved.filter((record): record is PpvRecord => record && typeof record === 'object'
    && typeof record.id === 'string' && conversationIds.has(record.conversationId)
    && mediaAssets.some((asset) => asset.id === record.mediaId)
    && typeof record.caption === 'string' && typeof record.price === 'number' && Number.isFinite(record.price)
    && ['sent', 'viewed', 'purchased'].includes(record.status)
    && typeof record.sentAt === 'string' && ['sample', 'demo'].includes(record.source))
  return valid
}

export function restoreContentRequests(saved: unknown, conversationIds: Set<string>): ContentRequest[] {
  if (!Array.isArray(saved)) return initialContentRequests().filter((request) => conversationIds.has(request.conversationId))
  return saved.filter((request): request is ContentRequest => request && typeof request === 'object'
    && typeof request.id === 'string' && conversationIds.has(request.conversationId)
    && typeof request.title === 'string' && (request.price === null || typeof request.price === 'number' && Number.isFinite(request.price))
    && ['new', 'quoted', 'paid', 'delivered'].includes(request.status)
    && typeof request.owner === 'string' && typeof request.updatedAt === 'string'
    && ['sample', 'demo'].includes(request.source))
}

export function restoreHandoffNotes(saved: unknown, conversationIds: Set<string>): Record<string, HandoffNote> {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
  return Object.fromEntries(Object.entries(saved).filter(([id, note]) => conversationIds.has(id)
    && note && typeof note === 'object' && typeof (note as HandoffNote).text === 'string'
    && typeof (note as HandoffNote).savedAt === 'number')) as Record<string, HandoffNote>
}

export function ppvFollowUpLabel(record: PpvRecord): string | null {
  if (record.followUpDone) return null
  if (record.status === 'viewed') return '已查看未购买'
  if (record.status === 'purchased') return '已购买待回应'
  return null
}

export function requestStatusLabel(status: ContentRequest['status']): string {
  return { new: '待报价', quoted: '已报价', paid: '已付款待交付', delivered: '已交付' }[status]
}

export function restoreReminders(saved: unknown, conversationIds: Set<string>): FollowUpReminder[] {
  if (!Array.isArray(saved)) return []
  return saved.filter((reminder): reminder is FollowUpReminder => reminder && typeof reminder === 'object'
    && typeof reminder.id === 'string' && conversationIds.has(reminder.conversationId)
    && typeof reminder.text === 'string' && typeof reminder.dueAt === 'number' && Number.isFinite(reminder.dueAt)
    && ['scheduled', 'done'].includes(reminder.status))
}

export function ppvStatusLabel(status: PpvRecord['status']): string {
  return status === 'purchased' ? '已购买' : status === 'viewed' ? '已查看' : '已发送'
}
