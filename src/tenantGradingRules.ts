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
    purpose: '决定列表密度与信息展开程度',
    levels: {
      low: { criterion: '日均少于 100 条会话', behavior: '标准列表、完整消息预览和关系信息。' },
      steady: { criterion: '日均 100–499 条会话', behavior: '突出待办与处理时限，保留必要上下文。' },
      surge: { criterion: '日均 500 条及以上', behavior: '紧凑列表、下一条待办，次要洞察默认折叠。' },
    },
  },
  fans: {
    purpose: '决定价值信号参与优先级的程度',
    levels: {
      low: { criterion: '高价值粉丝少于 20%', behavior: '主要看事件和时限，避免普遍贴上高价值标签。' },
      balanced: { criterion: '高价值粉丝占 20%–49%', behavior: '消费价值与近期行为共同决定处理顺序。' },
      high: { criterion: '高价值粉丝占 50% 及以上', behavior: '标出高价值关系，突出长期偏好和团队记忆。' },
    },
  },
  tasks: {
    purpose: '决定行动队列的首要任务',
    levels: {
      conversation: { criterion: '主要处理日常对话', behavior: '需回复优先；延续话题，避免过早转向销售。' },
      fulfillment: { criterion: '主要处理已付款请求', behavior: '待履约优先；回复后仍保留待办，交付需单独确认。' },
      purchase: { criterion: '主要处理购买后互动', behavior: '购买跟进优先；先致谢、确认偏好，再考虑后续推荐。' },
    },
  },
  data: {
    purpose: '决定 AI 建议可依赖资料的程度',
    levels: {
      sparse: { criterion: '已知资料覆盖率低于 50%', behavior: '事实优先展示；核对来源后才能插入 AI 草稿。' },
      partial: { criterion: '已知资料覆盖率 50%–79%', behavior: '显示来源和更新时间，待确认线索明确标记。' },
      complete: { criterion: '已知资料覆盖率 80% 及以上', behavior: '展示消费和已记录偏好，仍保留来源供复核。' },
    },
  },
  collaboration: {
    purpose: '决定会话归属与交接流程',
    levels: {
      solo: { criterion: '专人独立处理', behavior: '收起负责人信息，按会话保存草稿。' },
      team: { criterion: '小组共同处理', behavior: '显示负责人，支持认领与转交会话。' },
      shifts: { criterion: '轮班接续处理', behavior: '显示待交接队列、交接摘要与确认接手。' },
    },
  },
  ai: {
    purpose: '决定 AI 何时介入与如何调整队列',
    levels: {
      advisory: { criterion: '人工按需调用', behavior: '不主动展示下一步；需要时再打开 AI 建议。' },
      assisted: { criterion: 'AI 主动辅助', behavior: '提示下一步，提供可编辑草稿，由人工应用。' },
      triage: { criterion: '队列自适应', behavior: '次要队列随近期操作排序，可固定或恢复顺序。' },
    },
  },
} satisfies GradingRules

export function getTenantLevelRule<K extends keyof TenantDimensions>(key: K, value: TenantDimensions[K]): LevelRule {
  const levels = tenantGradingRules[key].levels as Record<string, LevelRule>
  return levels[value]
}
