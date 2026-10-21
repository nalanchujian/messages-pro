import type { Message } from './types'

export function sameMessageGroup(previous: Message | undefined, current: Message): boolean {
  return !!previous && previous.direction === current.direction && previous.sender === current.sender
    && new Date(previous.createdAt).toDateString() === new Date(current.createdAt).toDateString()
    && previous.status !== 'withdrawn' && current.status !== 'withdrawn'
}

// The creator can preview their own PPV. Incoming unpaid content stays locked.
export function chatMediaAccess(message: Message) {
  const locked = message.direction === 'inbound' && message.price > 0 && !message.purchasedAt
  return {
    available: message.attachments.filter(item => !locked || item.free),
    locked: message.attachments.filter(item => locked && !item.free),
    textLocked: locked && message.lockedText,
  }
}
