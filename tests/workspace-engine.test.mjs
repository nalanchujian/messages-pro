import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' })
const [{ composeWorkspace }, { getTenantProfile }, { conversations, conversationActions, fanFacts, fanIntelligence }, { initialWorkflow }, { buildWorkPlan }, { presentConversation }] = await Promise.all([
  server.ssrLoadModule('/src/workspaceEngine.ts'),
  server.ssrLoadModule('/src/tenantProfiles.ts'),
  server.ssrLoadModule('/src/data.ts'),
  server.ssrLoadModule('/src/workflow.ts'),
  server.ssrLoadModule('/src/workPlan.ts'),
  server.ssrLoadModule('/src/conversationPresentation.ts'),
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
              assert.equal(result.decisions.mason.needsVerification, data === 'sparse')
              assert.equal(result.decisions.nate.needsVerification, false)
              count++
            }
  assert.equal(count, 729)
})

test('reviewing one fan only unlocks that fan’s unverified drafts', () => {
  const tenant = getTenantProfile('seed')
  const before = compose(tenant)
  const after = compose(tenant, { reviewedEvidenceId: 'mason' })
  assert.equal(before.decisions.mason.needsVerification, true)
  assert.equal(before.decisions.nate.needsVerification, false)
  assert.equal(after.decisions.mason.needsVerification, false)
})

test('handoff remains visible and recent clicks never reshuffle queue categories', () => {
  const tenant = getTenantProfile('custom', { scale: 'surge', fans: 'high', tasks: 'purchase', data: 'complete', collaboration: 'shifts', ai: 'triage' })
  const handoff = { ...assignments, mason: { owner: 'Alex', handoffPending: true, event: '待交接' } }
  const activity = Array.from({ length: 6 }, (_, index) => ({ type: 'queue', focus: 'reply', at: 999_000 + index }))
  const result = compose(tenant, { assignments: handoff, activity })
  const withoutClicks = compose(tenant, { assignments: handoff })
  assert.equal(result.orderedConversationIds[0], 'riley')
  assert.equal(result.decisions.mason.lane, 'handoff')
  assert.equal(result.queueOrder[1], 'reply')
  assert.ok(result.queueOrder.includes('purchase-follow-up'))
  assert.deepEqual(result.queueOrder, withoutClicks.queueOrder)
})

test('the same conversation exposes tenant-specific reasons on its own row', () => {
  const mason = conversations.find((item) => item.id === 'mason')
  const scenarios = [
    { tenant: getTenantProfile('aster'), emphasis: 'relationship', context: '$1,840' },
    { tenant: getTenantProfile('seed'), emphasis: 'verification', context: '推断需核对' },
  ]
  for (const scenario of scenarios) {
    const decision = compose(scenario.tenant).decisions.mason
    const row = presentConversation({ tenant: scenario.tenant, item: mason, action: conversationActions.mason,
      workflow: workflows.mason, facts: fanFacts.mason, assignment: assignments.mason, decision, recommended: false })
    assert.equal(row.emphasis, scenario.emphasis)
    assert.ok(row.context.includes(scenario.context))
  }
  const pulse = getTenantProfile('pulse')
  const leo = items.find((item) => item.id === 'leo')
  const purchase = presentConversation({ tenant: pulse, item: leo, action: conversationActions.leo,
    workflow: workflows.leo, facts: fanFacts.leo, assignment: assignments.leo,
    decision: compose(pulse).decisions.leo, recommended: false })
  assert.equal(purchase.emphasis, 'purchase')
  assert.ok(purchase.context.includes('PPV 已购'))
  assert.ok(!purchase.badges.includes('PPV 已购'))
})

test('conversations in one tenant retain distinct evidence and handling reasons', () => {
  const allWorkflows = Object.fromEntries(conversations.map((item) => [item.id, initialWorkflow(conversationActions[item.id].kind)]))
  const allAssignments = Object.fromEntries(conversations.map((item) => [item.id, { owner: '我', handoffPending: false, event: '已分配' }]))
  const contexts = (tenantId, ids) => {
    const tenant = getTenantProfile(tenantId)
    const decisions = compose(tenant, { conversations, workflows: allWorkflows, assignments: allAssignments }).decisions
    return ids.map((id) => presentConversation({ tenant, item: conversations.find((item) => item.id === id), action: conversationActions[id],
      workflow: allWorkflows[id], facts: fanFacts[id], assignment: allAssignments[id], decision: decisions[id], recommended: false }).context)
  }
  for (const [tenant, ids] of [['north', ['oliver', 'devon', 'micah']], ['pulse', ['leo', 'jules', 'harper']], ['seed', ['mason', 'aria', 'blake']]]) {
    const rows = contexts(tenant, ids)
    assert.equal(new Set(rows).size, rows.length, `${tenant} should show a different reason for each conversation`)
  }
})

test('work plans track business milestones without treating a reply as delivery', () => {
  const owner = { owner: '我', handoffPending: false, event: '已分配' }
  const action = conversationActions.riley
  const initial = initialWorkflow(action.kind)
  assert.deepEqual(buildWorkPlan(action, initial, owner, 'team', false).map((step) => step.state), ['done', 'current', 'next'])
  const replied = { ...initial, lastOutboundAt: 1000 }
  assert.deepEqual(buildWorkPlan(action, replied, owner, 'team', false).map((step) => step.state), ['done', 'current', 'next'])
  const reviewing = { ...replied, fulfillmentStatus: 'reviewing' }
  assert.deepEqual(buildWorkPlan(action, reviewing, owner, 'shifts', false).map((step) => step.state), ['done', 'done', 'current'])
  const handoff = { ...owner, owner: 'Alex', handoffPending: true }
  const plan = buildWorkPlan(action, reviewing, handoff, 'shifts', false)
  assert.equal(plan[0].label, '确认交接')
  assert.equal(plan[0].state, 'current')
})

test.after(async () => { await server.close() })
