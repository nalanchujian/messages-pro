import test from 'node:test'
import assert from 'node:assert/strict'
import { initialWorkflow, resolveWorkflow } from '../src/workflow.ts'

const event = (type, at = 1) => ({ id: `${type}-${at}`, conversationId: 'riley', type, at })

test('a reply does not complete paid fulfillment', () => {
  const state = resolveWorkflow('fulfillment', [event('message_sent')])
  assert.equal(state.paymentStatus, 'paid')
  assert.equal(state.lastOutboundAt, 1)
  assert.equal(state.fulfillmentStatus, 'awaiting-review')
  assert.equal(state.actionStatus, 'pending')
})

test('team review and delivery remain separate transitions', () => {
  const reviewing = resolveWorkflow('fulfillment', [event('review_requested')])
  assert.equal(reviewing.fulfillmentStatus, 'reviewing')
  assert.equal(reviewing.actionStatus, 'waiting')
  const delivered = resolveWorkflow('fulfillment', [event('review_requested'), event('delivery_confirmed', 2)])
  assert.equal(delivered.fulfillmentStatus, 'delivered')
  assert.equal(delivered.actionStatus, 'done')
  assert.equal(delivered.lastOutboundAt, null)
})

test('a purchased PPV is independent of follow-up reply status', () => {
  const purchased = initialWorkflow('purchase-follow-up')
  assert.equal(purchased.ppvStatus, 'purchased')
  assert.equal(purchased.actionStatus, 'pending')
  const replied = resolveWorkflow('purchase-follow-up', [event('message_sent')])
  assert.equal(replied.ppvStatus, 'purchased')
  assert.equal(replied.actionStatus, 'waiting')
})

test('a completed delivery cannot be silently undone by reopening a task', () => {
  const reopened = resolveWorkflow('fulfillment', [event('delivery_confirmed'), event('action_reopened', 2)])
  assert.equal(reopened.paymentStatus, 'paid')
  assert.equal(reopened.fulfillmentStatus, 'delivered')
  assert.equal(reopened.actionStatus, 'done')
})
