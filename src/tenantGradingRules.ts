import type { TenantDimensions } from './tenantProfiles'

type LevelRule = { criterion: string; behavior: string }
type GradingRules = {
  [K in keyof TenantDimensions]: {
    purpose: string
    levels: Record<TenantDimensions[K], LevelRule>
  }
}

// These are demo product rules. Keep the level descriptions aligned with
// tenantWorkspaceRules.ts and the visible interactions in main.tsx.
export const tenantGradingRules = {
  scale: {
    purpose: '决定单条会话的信息密度和连续处理节奏',
    levels: {
      low: { criterion: '日均少于 100 条会话', behavior: '会话行保留较完整的背景，直接逐条浏览。' },
      steady: { criterion: '日均 100–499 条会话', behavior: '每条会话显示行动与原因，可切换处理视图和下一条。' },
      surge: { criterion: '日均 500 条及以上', behavior: '会话行更紧凑，重点呈现行动、状态与时限；默认聚焦待处理。' },
    },
  },
  fans: {
    purpose: '决定每条会话展示多少关系价值线索',
    levels: {
      low: { criterion: '高价值粉丝少于 20%', behavior: '以待办和时限为主，不额外占用列表空间展示价值筛选。' },
      balanced: { criterion: '高价值粉丝占 20%–49%', behavior: '提供重点粉丝筛选；已确认消费参与排序。' },
      high: { criterion: '高价值粉丝占 50% 及以上', behavior: '高价值会话行直接显示消费和已知偏好，右侧关系记忆靠前。' },
    },
  },
  tasks: {
    purpose: '决定会话行的行动重点与聊天区的处理路径',
    levels: {
      conversation: { criterion: '主要处理日常对话', behavior: '需回复优先；每条会话按阅读背景、回应、等待反馈推进。' },
      fulfillment: { criterion: '主要处理已付款请求', behavior: '待履约优先；付款、团队核对和交付确认是独立步骤，回复不能替代交付。' },
      purchase: { criterion: '主要处理购买后互动', behavior: '购买跟进优先；先确认交易和购买体验，再决定后续互动。' },
    },
  },
  data: {
    purpose: '决定 AI 建议可依赖资料的程度',
    levels: {
      sparse: { criterion: '已知资料覆盖率低于 50%', behavior: '已知事实和普通回复继续可用；引用未确认线索的草稿需要先核对来源。' },
      partial: { criterion: '已知资料覆盖率 50%–79%', behavior: '显示来源和更新时间，待确认线索明确标记。' },
      complete: { criterion: '已知资料覆盖率 80% 及以上', behavior: '展示消费和已记录偏好，仍保留来源供复核。' },
    },
  },
  collaboration: {
    purpose: '决定会话归属与交接流程',
    levels: {
      solo: { criterion: '专人独立处理', behavior: '收起负责人信息，按会话保存草稿。' },
      team: { criterion: '小组共同处理', behavior: '显示负责人，支持认领与转交会话。' },
      shifts: { criterion: '轮班接续处理', behavior: '显示待交接队列、交接摘要与确认接手；调整维度保留原有归属。' },
    },
  },
  ai: {
    purpose: '决定 AI 何时出现在会话行和处理流程中',
    levels: {
      advisory: { criterion: '人工按需调用', behavior: '任务与资料照常可见，聊天行动中不主动出现生成入口；操作员可手动打开助手。' },
      assisted: { criterion: 'AI 主动辅助', behavior: '当前任务旁提示回复方向，提供可编辑草稿，由人工应用。' },
      triage: { criterion: '智能分流', behavior: '分类位置保持稳定；直接在推荐会话行标明下一条，并保留人工打开与发送。' },
    },
  },
} satisfies GradingRules

export function getTenantLevelRule<K extends keyof TenantDimensions>(key: K, value: TenantDimensions[K]): LevelRule {
  const levels = tenantGradingRules[key].levels as Record<string, LevelRule>
  return levels[value]
}
