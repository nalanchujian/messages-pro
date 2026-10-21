import type { PresetTenantId } from './tenantProfiles'

export const validationScenarios = {
  relationship: { title: '理解关系，再回应粉丝', tenantId: 'aster', conversationId: 'mason', goal: '核对已有背景，给出回应，并留下下一步行动。' },
  fulfillment: { title: '把已付款请求推进到交付', tenantId: 'north', conversationId: 'riley', goal: '核对付款、请求团队确认，再单独确认交付；发送回复不等于完成。' },
  handoff: { title: '让下一班接得住', tenantId: 'north', conversationId: 'riley', goal: '阅读交接上下文，确认负责人，保留尚未完成的承诺。' },
} satisfies Record<string, { title: string; tenantId: PresetTenantId; conversationId: string; goal: string }>

export function resolveValidationScenario(search: string) {
  const key = new URLSearchParams(search).get('scenario')
  return key && Object.hasOwn(validationScenarios, key)
    ? validationScenarios[key as keyof typeof validationScenarios]
    : null
}
