import type { Conversation, ConversationAction, FanFact, FanIntelligence } from './types'

export const conversations: Conversation[] = [
  {
    id: 'mason', name: 'Mason', handle: '@mason_88', avatar: 'M', online: true, unread: 2,
    preview: 'I might have to see that one later 😏', updatedAt: '刚刚', labels: ['VIP', '高互动'], spend: '$1,840',
    note: '喜欢健身和旅行内容；晚上（PST）回复更活跃。避免提及工作地点。',
    summary: '长期订阅者，本月已购买两次 PPV。对新健身系列有兴趣，适合在晚上跟进。',
    messages: [
      { id: '1', text: '你今天的训练怎么样？我刚剪完一支新视频。', sentAt: '21:14', direction: 'outbound', status: 'read' },
      { id: '2', text: 'Leg day 完全把我累坏了 😂 新视频是什么？', sentAt: '21:16', direction: 'inbound' },
      { id: '3', text: '在海边拍的训练片段，还有一点小惊喜。', sentAt: '21:17', direction: 'outbound', status: 'read' },
      { id: '4', text: 'I might have to see that one later 😏', sentAt: '21:19', direction: 'inbound' },
    ],
  },
  {
    id: 'nate', name: 'Nate Wilson', handle: '@natewilson', avatar: 'N', online: false, unread: 0,
    preview: 'Sounds good, talk tomorrow!', updatedAt: '18m', labels: ['续订提醒'], spend: '$245',
    note: '订阅将于两天后到期。偏好温和聊天，不发送高频促销。', summary: '新订阅者，互动稳定。应以续订关怀为主。',
    messages: [{ id: '1', text: 'Sounds good, talk tomorrow!', sentAt: '21:02', direction: 'inbound' }],
  },
  {
    id: 'leo', name: 'Leo Carter', handle: '@leo_c', avatar: 'L', online: true, unread: 1,
    preview: 'That photo set was amazing', updatedAt: '32m', labels: ['新粉丝'], spend: '$76',
    note: '来自 Instagram campaign #18。', summary: '首次购买者。先了解内容偏好，再考虑后续推荐。',
    messages: [{ id: '1', text: 'That photo set was amazing', sentAt: '20:48', direction: 'inbound' }],
  },
  {
    id: 'chris', name: 'Chris Bell', handle: '@c_bell', avatar: 'C', online: false, unread: 0,
    preview: 'Thanks!', updatedAt: '1h', labels: ['常规'], spend: '$420',
    note: '偏好照片集。', summary: '稳定低频消费用户。',
    messages: [{ id: '1', text: 'Thanks!', sentAt: '20:10', direction: 'inbound' }],
  },
  {
    id: 'riley', name: 'Riley', handle: '@riley_m', avatar: 'R', online: true, unread: 1,
    preview: '已经付款了，什么时候能收到？', updatedAt: '6m', labels: ['已付款请求'], spend: '$310',
    note: '定制内容请求已付款；交付时间需要由团队确认。', summary: '已付款请求等待履约确认，应先核对订单和交付安排。',
    messages: [{ id: '1', text: '已经付款了，什么时候能收到？', sentAt: '21:22', direction: 'inbound' }],
  },
]

export const conversationActions: Record<string, ConversationAction> = {
  mason: { kind: 'reply', title: '回应新消息', reason: '刚表达了对新视频的兴趣', due: '12 分钟内', afterSend: '等待粉丝确认预览意愿', source: '最近消息 · 刚刚' },
  leo: { kind: 'purchase-follow-up', title: '购买后致谢', reason: '首次购买后发来正面反馈', due: '购买后 2 小时内', afterSend: '等待粉丝回答内容偏好', source: '购买与消息记录 · 32 分钟前' },
  nate: { kind: 'renewal', title: '按约定明天跟进', reason: '粉丝约定明天再聊，订阅两天后到期', due: '明天', afterSend: '等待粉丝回复', source: '最近消息与订阅记录 · 18 分钟前' },
  chris: { kind: 'manual', title: '暂无主动行动', reason: '目前没有需要处理的请求或购买信号', due: '等待自然互动', afterSend: '等待粉丝回复', source: '最近消息 · 1 小时前' },
  riley: { kind: 'fulfillment', title: '核对已付款请求', reason: '已付款，粉丝正在询问交付时间', due: '优先处理', afterSend: '等待团队确认交付时间', source: '付款与消息记录 · 6 分钟前' },
}

export const fanFacts: Record<string, FanFact[]> = {
  mason: [
    { label: '购买记录', value: '本月已购买 2 次 PPV', kind: 'recorded', source: '交易记录', updatedAt: '今日 09:10' },
    { label: '沟通偏好', value: '晚上（PST）回复更活跃', kind: 'team', source: '团队备注', updatedAt: '3 天前' },
    { label: '当前兴趣', value: '可能想看海边训练片段', kind: 'inferred', source: '最近对话', updatedAt: '刚刚' },
  ],
  leo: [
    { label: '购买记录', value: '已完成首次照片集购买', kind: 'recorded', source: '交易记录', updatedAt: '32 分钟前' },
    { label: '来源', value: 'Instagram campaign #18', kind: 'team', source: '团队备注', updatedAt: '今日' },
    { label: '内容偏好', value: '具体喜欢的主题尚未确认', kind: 'inferred', source: '最近对话', updatedAt: '32 分钟前' },
  ],
  nate: [
    { label: '订阅状态', value: '两天后到期', kind: 'recorded', source: '订阅记录', updatedAt: '今日 08:50' },
    { label: '沟通约定', value: '明天再聊', kind: 'team', source: '最近消息', updatedAt: '18 分钟前' },
  ],
  chris: [
    { label: '消费记录', value: '累计消费 $420', kind: 'recorded', source: '交易记录', updatedAt: '今日 06:10' },
    { label: '偏好', value: '喜欢照片集', kind: 'team', source: '团队备注', updatedAt: '3 天前' },
  ],
  riley: [
    { label: '请求状态', value: '定制内容请求已付款', kind: 'recorded', source: '付款记录', updatedAt: '6 分钟前' },
    { label: '交付安排', value: '尚未确认具体时间', kind: 'team', source: '团队备注', updatedAt: '刚刚' },
  ],
}

export const fanIntelligence: Record<string, FanIntelligence> = {
  mason: {
    priorityScore: 92, priorityLabel: '高价值 · 正在活跃', signal: '本周已互动 4 次',
    reason: '近 30 天消费高，且当前对训练系列表现出兴趣。',
    strategy: {
      goal: '回应训练话题，延续互动', nextAction: '先回应训练话题；若对方有兴趣，再提供海边训练预览。',
      guardrail: '先确认预览意愿，避免跳过互动直接推销。', taskAction: '创建今晚跟进',
      drafts: [
        { tone: '自然回应', text: 'Leg day 听起来很累 😂 今天先好好休息。你最喜欢练哪个动作？' },
        { tone: '征询预览意愿', text: '辛苦啦！海边训练系列里有一小段我觉得你会喜欢，想先看看预览吗？' },
        { tone: '留待稍后', text: '那你先好好放松。等你有空，我可以把海边训练的预览发给你。' },
      ],
    },
    memoryCandidates: [
      { text: '喜欢健身和旅行内容', source: '内部备注' },
      { text: '晚上（PST）回复更活跃', source: '内部备注' },
      { text: '对海边训练片段表达过兴趣', source: '本次对话' },
    ],
    risk: '低', confidence: 88, bestTime: 'PST 20:00–23:00', suggestedContent: '海边训练系列',
    queues: ['reply'], sla: '12 分钟内回复', updatedAt: '刚刚 · 样例数据',
    scoreBreakdown: [{ label: '近 30 天消费', points: 34, source: 'Fan Insights', updatedAt: '今日 09:10' }, { label: '近期互动', points: 25, source: '消息事件', updatedAt: '3 分钟前' }, { label: '购买意向', points: 22, source: '对话意图识别', updatedAt: '刚刚' }, { label: '在线时机', points: 11, source: '在线状态', updatedAt: '实时' }],
  },
  nate: {
    priorityScore: 74, priorityLabel: '需要续订关怀', signal: '2 天后订阅到期',
    reason: '互动稳定但消费偏低，适合温和维系而不是促销。',
    strategy: {
      goal: '尊重约定，温和续订关怀', nextAction: '按约定明天再聊，届时先问候近况。',
      guardrail: '对方已说明明天再聊；不要今晚追发促销或续订催促。', taskAction: '创建续订提醒',
      drafts: [
        { tone: '简短确认', text: '好的，明天聊！祝你今晚过得愉快 🙂' },
        { tone: '明日问候', text: '嗨，昨天说好今天聊聊。你今天过得怎么样？' },
        { tone: '温和关怀', text: '最近有什么想看的内容吗？有空告诉我就好，不着急。' },
      ],
    },
    memoryCandidates: [
      { text: '偏好温和聊天，不喜欢高频促销', source: '内部备注' },
      { text: '约定明天再聊', source: '最近消息' },
    ],
    risk: '低', confidence: 84, bestTime: 'PST 19:00–22:00', suggestedContent: '欢迎内容合集',
    queues: ['renewal'], sla: '2 天内续订关怀', updatedAt: '今日 08:50 · 样例数据',
    scoreBreakdown: [{ label: '订阅到期风险', points: 31, source: '订阅事件', updatedAt: '今日 08:50' }, { label: '历史消费', points: 18, source: 'Fan Insights', updatedAt: '今日 08:45' }, { label: '互动稳定度', points: 17, source: '消息事件', updatedAt: '18 分钟前' }, { label: '回应时机', points: 8, source: '互动时段分析', updatedAt: '昨日 23:00' }],
  },
  leo: {
    priorityScore: 81, priorityLabel: '新粉丝 · 高意向', signal: '首次购买完成',
    reason: '新粉丝已完成首次购买，当前适合建立偏好和后续互动。',
    strategy: {
      goal: '回应反馈，确认内容偏好', nextAction: '感谢照片集反馈，并询问最喜欢的主题。',
      guardrail: '内容偏好尚未确认；不要假定他喜欢某个系列或立即追加销售。', taskAction: '创建偏好采集',
      drafts: [
        { tone: '回应反馈', text: '听你这么说我很开心 😊 照片集里你最喜欢哪一张？' },
        { tone: '探索偏好', text: '谢谢你告诉我！你更喜欢自然随拍，还是主题照片集？' },
        { tone: '延续互动', text: '很高兴你喜欢这组照片。下次想看到什么主题？我会记下来。' },
      ],
    },
    memoryCandidates: [
      { text: '称赞了最近的照片集', source: '最近消息' },
      { text: '来自 Instagram campaign #18', source: '内部备注' },
    ],
    risk: '中', confidence: 79, bestTime: 'PST 18:00–21:00', suggestedContent: '新粉丝精选',
    queues: ['purchase-follow-up'], sla: '购买后 2 小时内跟进', updatedAt: '32 分钟前 · 样例数据',
    scoreBreakdown: [{ label: '首次购买信号', points: 32, source: 'PPV 购买事件', updatedAt: '32 分钟前' }, { label: '新粉丝阶段', points: 23, source: '订阅事件', updatedAt: '今日 07:30' }, { label: '近期互动', points: 17, source: '消息事件', updatedAt: '32 分钟前' }, { label: '偏好待确认', points: 9, source: 'Fan Insights', updatedAt: '今日 07:30' }],
  },
  chris: {
    priorityScore: 48, priorityLabel: '常规维护', signal: '近期互动较低',
    reason: '消费稳定但频率低，过度触达可能降低体验。',
    strategy: {
      goal: '自然结束对话，等待下一次互动', nextAction: '简单回复致谢，暂不主动推荐或创建销售跟进。',
      guardrail: '当前没有购买意向信号；不发送内容预览或促销话术。', taskAction: null,
      drafts: [
        { tone: '自然回应', text: '不客气 🙂 很高兴你喜欢。' },
        { tone: '友好结束', text: '谢谢你告诉我，祝你今天过得愉快！' },
        { tone: '保持开放', text: '随时欢迎来聊，有空再见。' },
      ],
    },
    memoryCandidates: [
      { text: '偏好照片集', source: '内部备注' },
    ],
    risk: '低', confidence: 73, bestTime: 'PST 20:00–22:00', suggestedContent: '照片集',
    queues: [], sla: '等待自然互动', updatedAt: '1 小时前 · 样例数据',
    scoreBreakdown: [{ label: '历史消费', points: 19, source: 'Fan Insights', updatedAt: '今日 06:10' }, { label: '近期互动', points: 9, source: '消息事件', updatedAt: '1 小时前' }, { label: '内容偏好', points: 12, source: '已确认记忆', updatedAt: '3 天前' }, { label: '近期机会', points: 8, source: '机会识别', updatedAt: '1 小时前' }],
  },
  riley: {
    priorityScore: 96, priorityLabel: '已付款 · 待履约', signal: '粉丝正在询问交付时间',
    reason: '已付款请求先于一般销售机会处理，需要核对订单与交付安排。',
    strategy: {
      goal: '确认订单与交付安排', nextAction: '先核对付款和团队排期，再给出准确交付时间。',
      guardrail: '交付时间尚未确认；不要向粉丝承诺具体时刻。', taskAction: '创建履约核对',
      drafts: [
        { tone: '先确认', text: '我看到你的付款了，谢谢你！我先确认一下交付安排，确认后马上回复你。' },
        { tone: '简短回应', text: '已经收到你的请求了，我正在核对安排，稍后给你准确时间。' },
      ],
    },
    memoryCandidates: [{ text: '定制内容请求已付款', source: '付款记录' }],
    risk: '中', confidence: 92, bestTime: '当前在线', suggestedContent: '待确认',
    queues: ['fulfillment'], sla: '优先处理', updatedAt: '6 分钟前 · 样例数据',
    scoreBreakdown: [{ label: '已付款待履约', points: 60, source: '付款记录', updatedAt: '6 分钟前' }, { label: '粉丝主动询问', points: 36, source: '最近消息', updatedAt: '6 分钟前' }],
  },
}
