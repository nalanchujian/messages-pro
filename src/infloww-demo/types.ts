export type Media = {
  id: string; title: string; type: 'image' | 'video' | 'audio' | 'gif'; url?: string;
  category: string; tags: string[]; price: number; creatorTags: string[]; uploaded?: boolean;
  notes?: string; createdAt?: number; duration?: number;
}
export type Attachment = { mediaId: string; free: boolean }
export type TextFormat = { bold: boolean; italic: boolean; color: string; size: number }
export type Draft = {
  text: string; attachments: Attachment[]; price: number; lockedText: boolean;
  replyToId?: string; creatorTags: string[]; scheduledAt?: number; format: TextFormat;
  scriptId?: string; releaseFormIds?: string[];
}
export type Message = {
  id: string; creatorId: string; fanId: string; text: string; createdAt: number;
  direction: 'inbound' | 'outbound'; status: 'sending' | 'sent' | 'read' | 'failed' | 'withdrawn';
  attachments: Attachment[]; price: number; lockedText: boolean; creatorTags: string[];
  format: TextFormat; replyToId?: string; liked: boolean; pinned: boolean; viewed: boolean;
  purchasedAt?: number; sender: string; source: 'manual' | 'smart' | 'mass' | 'auto';
  scriptId?: string; releaseFormIds?: string[];
}
export type Fan = {
  id: string; name: string; handle: string; avatar: string; color: string; online: boolean;
  unread: boolean; priority: boolean; muted: boolean; restricted: boolean; blocked: boolean;
  hidden: boolean; cleared: boolean; inboxId: number; listIds: string[];
  subscribedAt: number; subscriptionStatus: 'active' | 'expired' | 'trial' | 'free';
  subscriptionPrice: number; subscriptionLabel: string; renew: boolean;
  country: string; timeZone: string; source: string; nickname: string; birthday: string;
  notes: string; lastSeenAt: number;
  isCreator?: boolean;
  verified?: boolean; aiStatus?: 'active' | 'paused' | 'needs-human';
  subscriptionExpiresAt?: number;
  organizationSpendingPower?: 'insufficient' | 'low' | 'medium' | 'high';
  chargebackRisk?: 'unknown' | 'low' | 'medium' | 'high';
  salaryAmount?: number; salaryCurrency?: string; salaryCycle?: 'weekly' | 'biweekly' | 'monthly' | 'yearly'; lastPayDate?: string;
  reportedAt?: number; reportReason?: string; aiAssigned?: boolean;
  creatorSubscribed?: boolean;
}
export type FanList = { id: string; name: string; pinned: boolean }
export type Creator = {
  id: string; name: string; avatar: string; color: string; notes: string;
  verificationStatus?: 'verified' | 'pending';
  fanNoteTemplate?: string;
  defaultNickname: string; splitEnabled: boolean; inboxCount: number; lists: FanList[];
  autoChatEnabled?: boolean;
}
export type Workspace = {
  activeFanId: string | null; openFanIds: string[]; search: string;
  pinnedFanIds?: string[]; activePinnedFanId?: string | null; homeFanId?: string | null;
  view: string; extraFilter: 'all' | 'unread' | 'priority' | 'unread_tips' | 'fan_last';
  sort: 'newest' | 'oldest'; inboxIds: number[]; focus: boolean;
  focusOrder: string[]; heldFanIds: string[]; listScroll: number; chatScroll: Record<string, number>;
  hideMuted: boolean; hideAI: boolean; hideCreators?: boolean;
  aiFilter?: 'include' | 'only' | 'hide';
  onlineAudience?: OnlineAudienceFilter;
}
export type OnlineAudienceFilter = {
  status: 'all' | 'active' | 'expired'; minSpend: number; minTips: number;
  minSubscriptionMonths: number; excludeListIds: string[];
  excludeCreators: boolean; excludeMessagedHours: number; includeMuted: boolean;
}
export const emptyOnlineAudience = (): OnlineAudienceFilter => ({ status: 'all', minSpend: 0, minTips: 0, minSubscriptionMonths: 0, excludeListIds: [], excludeCreators: false, excludeMessagedHours: 0, includeMuted: false })
export type Transaction = {
  id: string; creatorId: string; fanId: string; kind: 'tip' | 'ppv' | 'subscription';
  amount: number; at: number; messageId?: string;
}
export type Notification = {
  id: string; creatorId: string; fanId: string; kind: 'subscription' | 'tip' | 'purchase' | 'platform';
  title: string; text: string; at: number; unread: boolean;
  repliedAt?: number; repliedBy?: string; replyMessageId?: string;
}
export type WithdrawalRecord = {
  id: string; creatorId: string; creatorName: string; fanId: string; fanName: string;
  withdrawnAt: number; withdrawnBy: string; sender: string; read: boolean;
  message: Message; media: Media[];
}
export type Script = { id: string; title: string; category: string; text: string; attachments: Attachment[]; price: number; creatorTags: string[]; releaseFormIds?: string[]; founder?: string; note?: string; createdAt?: number }
export type ReleaseForm = { id: string; name: string; status: 'approved' | 'signed' | 'pending' | 'declined' | 'failed' | 'expired'; type?: 'link' | 'document'; creatorId?: string; createdAt?: number }
export type Task = {
  id: string; creatorId: string; fanId: string; kind: 'scheduled' | 'timed' | 'reminder';
  dueAt: number; status: 'pending' | 'done' | 'cancelled' | 'failed'; draft?: Draft; text: string;
  alarmSound?: 'soft' | 'bell' | 'none' | `audio${number}`;
}
export type Campaign = {
  id: string; creatorId: string; type: 'auto' | 'mass' | 'smart'; title: string;
  fanIds: string[]; messageIds: string[]; createdAt: number;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled'; draft: Draft; scheduledAt?: number;
  audience?: OnlineAudienceFilter;
}
export type DemoState = {
  version: 1; activeCreatorId: string; openCreatorIds: string[]; creators: Creator[];
  fans: Record<string, Fan[]>; messages: Record<string, Message[]>; drafts: Record<string, Draft>;
  workspaces: Record<string, Workspace>; media: Media[]; scripts: Script[];
  transactions: Transaction[]; notifications: Notification[]; tasks: Task[]; campaigns: Campaign[];
  withdrawals?: WithdrawalRecord[];
  releaseForms?: ReleaseForm[];
  role: 'admin' | 'chatter'; clockOffset: number; emojis: string[]; simulateFailure: boolean;
  feedback?: { id: string; text: string };
}
// Payloads are validated by the reducer. Components never call external product APIs.
export type Action = { type: string; creatorId?: string; fanId?: string; messageId?: string; payload?: any }
export const key = (creatorId: string, fanId: string) => `${creatorId}:${fanId}`
export const emptyDraft = (): Draft => ({ text: '', attachments: [], price: 0, lockedText: true, creatorTags: [], format: { bold: false, italic: false, color: '#263247', size: 14 } })
