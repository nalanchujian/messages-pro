export type PresetTenantId = 'aster' | 'north' | 'pulse' | 'seed'
export type TenantId = PresetTenantId | 'custom'

export type TenantDimensions = {
  scale: 'low' | 'steady' | 'surge'
  fans: 'low' | 'balanced' | 'high'
  tasks: 'conversation' | 'fulfillment' | 'purchase'
  data: 'sparse' | 'partial' | 'complete'
  collaboration: 'solo' | 'team' | 'shifts'
  ai: 'advisory' | 'assisted' | 'triage'
}

export const tenantDimensionDefinitions = [
  { key: 'scale', label: '日均会话负载', options: [{ value: 'low', label: '低负载' }, { value: 'steady', label: '中负载' }, { value: 'surge', label: '高负载' }] },
  { key: 'fans', label: '高价值粉丝占比', options: [{ value: 'low', label: '低占比' }, { value: 'balanced', label: '中占比' }, { value: 'high', label: '高占比' }] },
  { key: 'tasks', label: '主导会话类型', options: [{ value: 'conversation', label: '日常互动' }, { value: 'fulfillment', label: '服务履约' }, { value: 'purchase', label: '购买跟进' }] },
  { key: 'data', label: '粉丝资料完备度', options: [{ value: 'sparse', label: '较低' }, { value: 'partial', label: '中等' }, { value: 'complete', label: '较高' }] },
  { key: 'collaboration', label: '会话协作模式', options: [{ value: 'solo', label: '专人负责' }, { value: 'team', label: '小组共享' }, { value: 'shifts', label: '轮班交接' }] },
  { key: 'ai', label: 'AI 介入级别', options: [{ value: 'advisory', label: '按需建议' }, { value: 'assisted', label: '主动辅助' }, { value: 'triage', label: '队列自适应' }] },
] as const

export const defaultCustomDimensions: TenantDimensions = {
  scale: 'steady', fans: 'balanced', tasks: 'conversation', data: 'partial', collaboration: 'team', ai: 'assisted',
}

export function dimensionLabel(key: keyof TenantDimensions, value: string): string {
  return tenantDimensionDefinitions.find((dimension) => dimension.key === key)?.options.find((option) => option.value === value)?.label ?? value
}

export type TenantProfile = {
  id: TenantId
  name: string
  description: string
  dimensions: TenantDimensions
  portrait: {
    archetype: string
    signature: string
    highlight: { value: string; label: string }
  }
  signals: {
    conversationsPerDay: number
    operators: number
    highValueShare: number
    purchaseShare: number
    renewalShare: number
    replyBacklogShare: number
    newOperatorShare: number
    dataCoverage: number
  }
  policy: {
    aiBudget: '精简' | '均衡' | '充足'
  }
}

// Representative tenant signals for the front-end demo. These are not inferred from real accounts.
export const tenantProfiles: TenantProfile[] = [
  {
    id: 'aster', name: 'Aster Studio', description: '小团队 · 高客单 · 关系经营',
    dimensions: { scale: 'low', fans: 'high', tasks: 'conversation', data: 'complete', collaboration: 'team', ai: 'assisted' },
    portrait: {
      archetype: '精品关系型', signature: '粉丝量不大，但每段关系都值得长期经营。',
      highlight: { value: '64%', label: '高价值粉丝占比' },
    },
    signals: { conversationsPerDay: 42, operators: 2, highValueShare: 0.64, purchaseShare: 0.14, renewalShare: 0.26, replyBacklogShare: 0.12, newOperatorShare: 0.08, dataCoverage: 0.91 },
    policy: { aiBudget: '充足' },
  },
  {
    id: 'north', name: 'North Agency', description: '大团队 · 高并发 · 效率优先',
    dimensions: { scale: 'surge', fans: 'balanced', tasks: 'fulfillment', data: 'complete', collaboration: 'shifts', ai: 'triage' },
    portrait: {
      archetype: '规模效率型', signature: '消息涌入快，核心挑战是稳定分流与按时处理。',
      highlight: { value: '760', label: '日均会话量' },
    },
    signals: { conversationsPerDay: 760, operators: 20, highValueShare: 0.20, purchaseShare: 0.24, renewalShare: 0.12, replyBacklogShare: 0.46, newOperatorShare: 0.15, dataCoverage: 0.84 },
    policy: { aiBudget: '精简' },
  },
  {
    id: 'pulse', name: 'Pulse House', description: '增长团队 · 购买活跃 · 转化导向',
    dimensions: { scale: 'steady', fans: 'balanced', tasks: 'purchase', data: 'partial', collaboration: 'team', ai: 'assisted' },
    portrait: {
      archetype: '增长转化型', signature: '购买行为频繁，关键在抓住购买后的下一次互动。',
      highlight: { value: '53%', label: '购买后跟进占比' },
    },
    signals: { conversationsPerDay: 180, operators: 5, highValueShare: 0.24, purchaseShare: 0.53, renewalShare: 0.15, replyBacklogShare: 0.26, newOperatorShare: 0.24, dataCoverage: 0.78 },
    policy: { aiBudget: '均衡' },
  },
  {
    id: 'seed', name: 'Seed Club', description: '起步团队 · 新人多 · 数据薄弱',
    dimensions: { scale: 'low', fans: 'low', tasks: 'conversation', data: 'sparse', collaboration: 'solo', ai: 'advisory' },
    portrait: {
      archetype: '冷启动带教型', signature: '团队和资料都在建立，先要把基础动作做稳。',
      highlight: { value: '68%', label: '新操作员占比' },
    },
    signals: { conversationsPerDay: 72, operators: 3, highValueShare: 0.10, purchaseShare: 0.16, renewalShare: 0.28, replyBacklogShare: 0.28, newOperatorShare: 0.68, dataCoverage: 0.38 },
    policy: { aiBudget: '精简' },
  },
]

export const defaultTenantId: TenantId = 'aster'

export function getTenantProfile(id: TenantId, customDimensions: TenantDimensions = defaultCustomDimensions): TenantProfile {
  if (id !== 'custom') return tenantProfiles.find((tenant) => tenant.id === id) ?? tenantProfiles[0]
  const dimensions = customDimensions
  const conversationsPerDay = dimensions.scale === 'surge' ? 760 : dimensions.scale === 'steady' ? 180 : 42
  const operators = dimensions.collaboration === 'shifts' ? 20 : dimensions.collaboration === 'team' ? 5 : 1
  const highValueShare = dimensions.fans === 'high' ? 0.64 : dimensions.fans === 'balanced' ? 0.28 : 0.12
  const purchaseShare = dimensions.tasks === 'purchase' ? 0.53 : 0.17
  const dataCoverage = dimensions.data === 'complete' ? 0.91 : dimensions.data === 'partial' ? 0.7 : 0.38
  return {
    id, name: '自定义租户',
    description: `${dimensionLabel('scale', dimensions.scale)} · ${dimensionLabel('fans', dimensions.fans)} · ${dimensionLabel('tasks', dimensions.tasks)}`,
    dimensions,
    portrait: {
      archetype: '组合画像', signature: '根据六个维度即时组合工作台。',
      highlight: { value: String(conversationsPerDay), label: '日均会话量' },
    },
    signals: {
      conversationsPerDay, operators, highValueShare, purchaseShare,
      renewalShare: dimensions.fans === 'high' ? 0.26 : 0.15,
      replyBacklogShare: dimensions.tasks === 'fulfillment' ? 0.46 : 0.16,
      newOperatorShare: dimensions.data === 'sparse' ? 0.42 : 0.16,
      dataCoverage,
    },
    policy: { aiBudget: '均衡' },
  }
}
