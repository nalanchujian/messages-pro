import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' })
const [{ composeWorkspace }, { getTenantProfile }, { conversations, conversationActions, fanFacts, fanIntelligence }, { initialWorkflow }] = await Promise.all([
  server.ssrLoadModule('/src/workspaceEngine.ts'),
  server.ssrLoadModule('/src/tenantProfiles.ts'),
  server.ssrLoadModule('/src/data.ts'),
  server.ssrLoadModule('/src/workflow.ts'),
])

const dimensions = {
  scale: ['low', 'steady', 'surge'],
  fans: ['low', 'balanced', 'high'],
  tasks: ['conversation', 'fulfillment', 'purchase'],
  data: ['sparse', 'partial', 'complete'],
  collaboration: ['solo', 'team', 'shifts'],
  ai: ['advisory', 'assisted', 'triage'],
}
const items = conversations.slice(0, 5)
const workflows = Object.fromEntries(items.map((item) => [item.id, initialWorkflow(conversationActions[item.id].kind)]))
const assignments = Object.fromEntries(items.map((item) => [item.id, { owner: '我', handoffPending: false, event: '已分配' }]))

function compose(tenant, changes = {}) {
  return composeWorkspace({ tenant, conversations: items, actions: conversationActions, workflows, intelligence: fanIntelligence,
    facts: fanFacts, assignments, activity: [], now: 1_000_000, ...changes })
}

test('all 729 custom tenant combinations preserve queue and paid fulfillment constraints', () => {
  let count = 0
  for (const scale of dimensions.scale)
    for (const fans of dimensions.fans)
      for (const tasks of dimensions.tasks)
        for (const data of dimensions.data)
          for (const collaboration of dimensions.collaboration)
            for (const ai of dimensions.ai) {
              const tenant = getTenantProfile('custom', { scale, fans, tasks, data, collaboration, ai })
              const result = compose(tenant)
              assert.equal(result.orderedConversationIds[0], 'riley', `paid fulfillment must lead: ${JSON.stringify(tenant.dimensions)}`)
              assert.ok(result.queueOrder.length >= 1 && result.queueOrder.length <= 6)
              assert.equal(result.queueOrder[0], 'all')
              assert.equal(new Set(result.queueOrder).size, result.queueOrder.length)
              assert.equal(result.presentation.defaultPendingOnly, scale === 'surge')
              assert.equal(result.presentation.showHandoffTools, collaboration === 'shifts')
              assert.equal(result.presentation.proactiveAi, ai !== 'advisory')
              assert.equal(result.decisions.leo.primaryAction, conversationActions.leo.title)
              assert.equal(result.decisions.leo.needsVerification, data === 'sparse')
              count++
            }
  assert.equal(count, 729)
})

test('handoff and AI queue adaptation never displace an open paid request', () => {
  const tenant = getTenantProfile('custom', { scale: 'surge', fans: 'high', tasks: 'purchase', data: 'complete', collaboration: 'shifts', ai: 'triage' })
  const handoff = { ...assignments, mason: { owner: 'Alex', handoffPending: true, event: '待交接' } }
  const activity = Array.from({ length: 6 }, (_, index) => ({ type: 'queue', focus: 'reply', at: 999_000 + index }))
  const result = compose(tenant, { assignments: handoff, activity })
  assert.equal(result.orderedConversationIds[0], 'riley')
  assert.equal(result.decisions.mason.lane, 'handoff')
  assert.equal(result.queueOrder[1], 'purchase-follow-up')
})

test.after(async () => { await server.close() })
