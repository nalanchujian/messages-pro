import { displaySample, t } from './i18n'
import { createSeed, initialReleaseForms, initialMedia } from './seed'
import { emptyDraft, key } from './types'
import { normalizeAudience, selectOnlineFans } from './audience'
import type { Action, Campaign, DemoState, Draft, Fan, Message, Notification, Workspace } from './types'

const uid = () => crypto.randomUUID()
export const money = (amount: number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number.isFinite(amount)?amount:0)
export const displayName = (fan: Fan) => fan.name
export function relativeTime(at: number, now = Date.now()) {
  const seconds=Math.max(0,Math.floor((now-at)/1000));
  if(seconds<60)return t('engine.01');if(seconds<3600)return t('engine.02', [Math.floor(seconds/60)]);if(seconds<86400)return t('engine.03', [Math.floor(seconds/3600)]);
  return new Intl.DateTimeFormat('zh-CN',{month:'short',day:'numeric',timeZone:'Asia/Shanghai'}).format(at)
}
export const messagesFor = (s: DemoState,cid: string,fid: string) => s.messages[key(cid,fid)] ?? []
const allowedFormIds=(s:DemoState,cid:string,ids:unknown):string[]=>Array.isArray(ids)?[...new Set<string>(ids.filter((id:unknown):id is string=>typeof id==='string'&&!!s.releaseForms?.some(form=>form.id===id&&(!form.creatorId||form.creatorId===cid)&&!['declined','failed','expired'].includes(form.status))))]:[]
export const latestMessage = (s: DemoState,cid: string,fid: string) => messagesFor(s,cid,fid).filter(m=>m.status!=='withdrawn').at(-1)
export type FanSignal = 'Expired' | 'New' | 'Off' | 'PPV' | '72h'
export function fanSignals(s: DemoState, cid: string, fid: string, now: number): FanSignal[] {
  const fan = s.fans[cid]?.find(item => item.id === fid)
  if (!fan) return []
  const day = 86_400_000, signals: FanSignal[] = []
  if (fan.subscriptionStatus === 'expired') signals.push('Expired')
  else if (now >= fan.subscribedAt && now - fan.subscribedAt <= 7 * day) signals.push('New')
  if (!fan.renew && fan.subscriptionStatus !== 'expired') signals.push('Off')
  if (s.transactions.some(item => item.creatorId === cid && item.fanId === fid && item.kind === 'ppv' && item.at <= now && now - item.at <= 7 * day)) signals.push('PPV')
  // The supplied desktop client derives snow from the latest chat timestamp and nonzero spend.
  const last = messagesFor(s, cid, fid).reduce<Message | undefined>((latest, message) => !latest || message.createdAt > latest.createdAt ? message : latest, undefined)
  if (last && now - last.createdAt > 3 * day && fanMetrics(s, cid, fid).spent > 0) signals.push('72h')
  return signals
}
const focusAllowed = (w: Workspace) => w.view==='all'&&w.extraFilter==='all'&&w.sort==='newest'&&!w.search.trim()&&!w.inboxIds.length&&!w.hideMuted&&!w.hideAI&&(!w.aiFilter||w.aiFilter==='include')
export function fanMetrics(s:DemoState,cid:string,fid:string) {
  const tx=s.transactions.filter(t=>t.creatorId===cid&&t.fanId===fid)
  const tips=tx.filter(t=>t.kind==='tip').reduce((a,t)=>a+t.amount,0)
  const messages=tx.filter(t=>t.kind==='ppv').reduce((a,t)=>a+t.amount,0)
  const purchases=tx.filter(t=>t.kind==='ppv').sort((a,b)=>b.at-a.at)
  const ppvs=messagesFor(s,cid,fid).filter(m=>m.direction==='outbound'&&m.price>0&&m.status!=='withdrawn'&&m.status!=='failed'&&m.status!=='sending')
  const prices=ppvs.map(m=>m.price)
  return {tips,messages,spent:Math.round((tips+messages)*100)/100,lastPaid:purchases[0]?.at??null,highestPurchase:purchases.length?Math.max(...purchases.map(t=>t.amount)):0,ppvs,buyRate:ppvs.length?ppvs.filter(m=>m.purchasedAt).length/ppvs.length:0,highestPrice:prices.length?Math.max(...prices):0,lowestPrice:prices.length?Math.min(...prices):0}
}
export function selectFans(s:DemoState,cid:string):Fan[] {
  const w=s.workspaces[cid];if(!w)return [];
  let fans=(s.fans[cid]??[]).filter(f=>!f.hidden&&!f.cleared)
  if(w.inboxIds.length)fans=fans.filter(f=>w.inboxIds.includes(f.inboxId))
  if(w.hideMuted)fans=fans.filter(f=>!f.muted)
  if(w.hideAI||w.aiFilter==='hide')fans=fans.filter(f=>!f.aiAssigned)
  if(w.aiFilter==='only')fans=fans.filter(f=>f.aiAssigned)
  if(w.view==='pinned')fans=fans.filter(f=>messagesFor(s,cid,f.id).some(m=>m.pinned&&m.status!=='withdrawn'))
  if(w.view==='priority')fans=fans.filter(f=>f.priority)
  if(w.view==='unread')fans=fans.filter(f=>f.unread)
  if(w.view==='tips')fans=fans.filter(f=>fanMetrics(s,cid,f.id).tips>0)
  if(w.view.startsWith('list:'))fans=fans.filter(f=>f.listIds.includes(w.view.slice(5)))
  if(w.extraFilter==='unread')fans=fans.filter(f=>f.unread)
  if(w.extraFilter==='priority')fans=fans.filter(f=>f.priority)
  if(w.extraFilter==='unread_tips')fans=fans.filter(f=>f.unread&&fanMetrics(s,cid,f.id).tips>0)
  const query=w.search.trim().toLowerCase()
  if(query)fans=fans.filter(f=>(f.name+' '+f.handle+' '+messagesFor(s,cid,f.id).map(m=>m.text).join(' ')).toLowerCase().includes(query))
  const focused=w.focus&&focusAllowed(w)
  if(focused){fans=fans.filter(f=>w.focusOrder.includes(f.id));fans.sort((a,b)=>w.focusOrder.indexOf(a.id)-w.focusOrder.indexOf(b.id))}
  else fans.sort((a,b)=>(latestMessage(s,cid,a.id)?.createdAt??0)-(latestMessage(s,cid,b.id)?.createdAt??0))
  if(!focused&&w.sort==='newest')fans.reverse()
  return fans
}
function notice(s:DemoState,text:string){s.feedback={id:uid(),text}}
function notification(s:DemoState,cid:string,fid:string,kind:Notification['kind'],title:string,text:string,now:number){s.notifications.unshift({id:uid(),creatorId:cid,fanId:fid,kind,title,text,at:now,unread:true})}
function openFan(s:DemoState,cid:string,fid:string){const f=s.fans[cid]?.find(f=>f.id===fid);const w=s.workspaces[cid];if(!f||!w)return;w.activeFanId=fid;if(!w.openFanIds.includes(fid))w.openFanIds.push(fid);f.unread=false;f.hidden=false;f.cleared=false;messagesFor(s,cid,fid).filter(m=>m.direction==='inbound'&&m.status==='sent').forEach(m=>{m.status='read'})}
function openDedicatedChat(s:DemoState,cid:string,fid:string){
  const w=s.workspaces[cid]
  if(!w||!s.fans[cid]?.some(fan=>fan.id===fid))return
  if(!w.activePinnedFanId)w.homeFanId=w.activeFanId
  if(!(w.pinnedFanIds??[]).includes(fid))w.pinnedFanIds=[fid,...(w.pinnedFanIds??[])].slice(0,20)
  w.activePinnedFanId=fid;openFan(s,cid,fid);s.activeCreatorId=cid
  if(!s.openCreatorIds.includes(cid))s.openCreatorIds.push(cid)
}
export function canWithdrawMessage(message:Message,now:number){return message.direction==='outbound'&&!message.purchasedAt&&['sent','read'].includes(message.status)&&message.createdAt<=now&&now-message.createdAt<=3600000}
function withdrawMessage(s:DemoState,cid:string,fid:string,message:Message,now:number){
  if(!canWithdrawMessage(message,now))return false
  const creator=s.creators.find(creator=>creator.id===cid)!,fan=s.fans[cid]?.find(fan=>fan.id===fid)
  s.withdrawals??=[]
  s.withdrawals.unshift({id:uid(),creatorId:cid,creatorName:creator.name,fanId:fid,fanName:fan?.name??fid,withdrawnAt:now,withdrawnBy:s.role==='admin'?'Admin':'Alex',sender:message.sender,read:false,message:structuredClone(message),media:structuredClone(s.media.filter(media=>message.attachments.some(attachment=>attachment.mediaId===media.id)))})
  message.status='withdrawn';message.pinned=false
  return true
}
function addMessage(s:DemoState,cid:string,fid:string,draft:Draft,now:number,source:Message['source']='manual'):Message|null {
  const fan=s.fans[cid]?.find(f=>f.id===fid)
  if(!fan)return null
  if(fan.blocked||fan.restricted){notice(s,t('engine.04'));return null}
  if(!draft.text.trim()&&!draft.attachments.length){notice(s,t('engine.05'));return null}
  if(/(?:whatsapp|telegram|私下转账|加我微信)/i.test(draft.text)){notice(s,t('engine.06'));return null}
  if(!Number.isFinite(draft.price)||draft.price<0||draft.price>200||(draft.price>0&&draft.price<3)){notice(s,t('engine.07'));return null}
  if(draft.price>0&&!draft.lockedText&&!draft.attachments.some(a=>!a.free)){notice(s,t('engine.08'));return null}
  const forms=allowedFormIds(s,cid,draft.releaseFormIds)
  if((draft.releaseFormIds??[]).some(id=>!forms.includes(id))){notice(s,t('completion.invalidForms'));return null}
  const m:Message={id:uid(),creatorId:cid,fanId:fid,text:draft.text,attachments:structuredClone(draft.attachments),price:draft.price,lockedText:draft.lockedText,creatorTags:[...draft.creatorTags],format:{...draft.format},replyToId:draft.replyToId,scriptId:draft.scriptId,releaseFormIds:forms,createdAt:now,direction:'outbound',status:s.simulateFailure?'failed':'sent',liked:false,pinned:false,viewed:false,sender:source==='auto'?'Automation':t('engine.09'),source}
  const k=key(cid,fid);s.messages[k]??=[];s.messages[k].push(m);fan.cleared=false;fan.hidden=false;return m
}
function purchase(s:DemoState,cid:string,fid:string,mid:string,now:number){
  const m=messagesFor(s,cid,fid).find(m=>m.id===mid)
  if(!m||m.price<=0||m.purchasedAt||m.status==='withdrawn'||m.status==='failed'||m.direction!=='outbound')return
  m.purchasedAt=now;m.viewed=true;m.status='read'
  if(!s.transactions.some(t=>t.messageId===mid&&t.kind==='ppv'))s.transactions.push({id:uid(),creatorId:cid,fanId:fid,kind:'ppv',amount:m.price,at:now,messageId:mid})
  notification(s,cid,fid,'purchase',t('engine.10'),`${money(m.price)} · ${m.text.slice(0,60)}`,now)
}
function runCampaign(s:DemoState,c:Campaign,now:number){
  const ids:string[]=[];let failed=0;let succeeded=0
  const eligible=c.audience?new Set(selectOnlineFans(s,c.creatorId,c.audience,now).map(fan=>fan.id)):null
  c.fanIds.forEach(fid=>{const fan=s.fans[c.creatorId]?.find(f=>f.id===fid);if(!fan||fan.blocked||fan.restricted||(eligible&&!eligible.has(fid))){failed++;return}const draft=structuredClone(c.draft);draft.scheduledAt=undefined;draft.text=draft.text.replaceAll('{name}',fan.nickname||s.creators.find(a=>a.id===c.creatorId)?.defaultNickname||fan.name.split(' ')[0]);const m=addMessage(s,c.creatorId,fid,draft,now,c.type==='auto'?'auto':c.type==='mass'?'mass':'smart');if(m){ids.push(m.id);if(m.status==='failed')failed++;else succeeded++}else failed++})
  c.messageIds=ids;c.status='sent';notice(s,t('engine.11', [succeeded, failed]))
}
function processDue(s:DemoState,now:number){
  s.tasks.filter(task=>task.status==='pending'&&task.dueAt<=now).forEach(task=>{
    task.status='done'
    if(task.kind==='reminder'){
      notification(s,task.creatorId,task.fanId,'platform',t('engine.12'),task.text,now)
      notice(s,t('engine.13')+task.text)
    }else if(task.draft){
      const draft={...structuredClone(task.draft),scheduledAt:undefined}
      const sent=addMessage(s,task.creatorId,task.fanId,draft,now,'manual')
      if(!sent||sent.status==='failed'){task.status='failed';if(sent)notice(s,t('engine.18'))}
      else notice(s,t('engine.14'))
    }
  })
  s.campaigns.filter(c=>c.status==='scheduled'&&(c.scheduledAt??Infinity)<=now).forEach(c=>runCampaign(s,c,now))
}
function fixWorkspace(s:DemoState,cid:string){
  const w=s.workspaces[cid];const available=(s.fans[cid]??[]).filter(f=>!f.cleared&&!f.hidden)
  w.pinnedFanIds=(w.pinnedFanIds??[]).filter(id=>available.some(f=>f.id===id))
  if(w.activePinnedFanId&&!w.pinnedFanIds.includes(w.activePinnedFanId))w.activePinnedFanId=null
  if(w.homeFanId&&!available.some(f=>f.id===w.homeFanId))w.homeFanId=null
  w.openFanIds=w.openFanIds.filter(id=>available.some(f=>f.id===id));if(!available.some(f=>f.id===w.activeFanId)){w.activeFanId=w.openFanIds[0]??available[0]?.id??null;if(w.activeFanId&&!w.openFanIds.includes(w.activeFanId))w.openFanIds.push(w.activeFanId)}
  if(!w.activePinnedFanId)w.homeFanId=w.activeFanId
}
export function demoReducer(state:DemoState,action:Action):DemoState {
  if(action.type==='RESET')return createSeed()
  const now=Date.now()+state.clockOffset
  if(action.type==='TICK'&&!state.tasks.some(t=>t.status==='pending'&&t.dueAt<=(action.payload??now))&&!state.campaigns.some(c=>c.status==='scheduled'&&(c.scheduledAt??Infinity)<=(action.payload??now)))return state
  const s=structuredClone(state);const cid=action.creatorId??s.activeCreatorId;const w=s.workspaces[cid];if(!w)return state
  const fid=action.fanId??w.activeFanId??'';const fan=s.fans[cid]?.find(f=>f.id===fid);const k=key(cid,fid);const p=action.payload;
  const message=messagesFor(s,cid,fid).find(m=>m.id===action.messageId)
  switch(action.type){
    case 'OPEN_CREATOR':case 'SET_ACTIVE_CREATOR':{const id=typeof p==='string'?p:p?.creatorId;if(s.creators.some(c=>c.id===id)){s.activeCreatorId=id;if(!s.openCreatorIds.includes(id))s.openCreatorIds.push(id)}break}
    case 'CLOSE_CREATOR':{const id=typeof p==='string'?p:p?.creatorId;if(s.openCreatorIds.length>1){s.openCreatorIds=s.openCreatorIds.filter(i=>i!==id);if(s.activeCreatorId===id)s.activeCreatorId=s.openCreatorIds[0]}else notice(s,t('engine.15'));break}
    case 'MOVE_CREATOR_TAB':{const from=s.openCreatorIds.indexOf(p?.id);const to=s.openCreatorIds.indexOf(p?.targetId);if(from<0||to<0||from===to)break;const reordered=[...s.openCreatorIds];reordered.splice(from,1);reordered.splice(to,0,p.id);s.openCreatorIds=reordered;break}
    case 'OPEN_FAN':if(fid){w.activePinnedFanId=null;w.homeFanId=fid;openFan(s,cid,fid)}break
    case 'OPEN_NOTIFICATION_CHAT':{
      const item=s.notifications.find(item=>item.id===p?.notificationId&&item.creatorId===cid)
      if(!item||!s.fans[cid]?.some(fan=>fan.id===item.fanId))break
      openDedicatedChat(s,cid,item.fanId);item.unread=false
      break
    }
    case 'READ_WITHDRAWALS':if(s.role==='admin')(s.withdrawals??[]).filter(item=>!p?.id||item.id===p.id).forEach(item=>item.read=true);break
    case 'OPEN_WITHDRAWAL_CHAT':{
      if(s.role!=='admin')break
      const record=s.withdrawals?.find(record=>record.id===p?.id)
      if(record){openDedicatedChat(s,record.creatorId,record.fanId);record.read=true}
      break
    }
    case 'PIN_FAN_TAB':if(fid&&s.fans[cid]?.some(f=>f.id===fid&&!f.hidden&&!f.cleared)){w.pinnedFanIds=[fid,...(w.pinnedFanIds??[]).filter(id=>id!==fid)].slice(0,20)}break
    case 'SELECT_FAN_TAB':if(fid&&(w.pinnedFanIds??[]).includes(fid)){w.activePinnedFanId=fid;openFan(s,cid,fid)}break
    case 'SELECT_HOME_TAB':{w.activePinnedFanId=null;const home=w.homeFanId??w.openFanIds[0]??s.fans[cid]?.find(f=>!f.hidden&&!f.cleared)?.id;if(home)openFan(s,cid,home);break}
    case 'CLOSE_FAN_TAB':{const before=w.pinnedFanIds??[];const index=before.indexOf(fid);if(index<0)break;w.pinnedFanIds=before.filter(id=>id!==fid);if(w.activePinnedFanId===fid){const next=w.pinnedFanIds[Math.min(index,w.pinnedFanIds.length-1)];w.activePinnedFanId=next??null;const target=next??w.homeFanId;if(target)openFan(s,cid,target)}break}
    case 'MOVE_FAN_TAB':{const before=w.pinnedFanIds??[];const from=before.indexOf(fid);const to=before.indexOf(p?.targetId);if(from<0||to<0||from===to)break;const reordered=[...before];reordered.splice(from,1);reordered.splice(to,0,fid);w.pinnedFanIds=reordered;break}
    case 'CLOSE_FAN':w.openFanIds=w.openFanIds.filter(id=>id!==fid);if(w.activeFanId===fid)w.activeFanId=w.openFanIds[0]??null;break
    case 'PATCH_WORKSPACE':{const was=w.focus;Object.assign(w,p);if(!focusAllowed(w))w.focus=false;if(!was&&w.focus){w.focusOrder=(s.fans[cid]??[]).filter(f=>!f.hidden&&!f.cleared).sort((a,b)=>(latestMessage(s,cid,b.id)?.createdAt??0)-(latestMessage(s,cid,a.id)?.createdAt??0)).map(f=>f.id);w.heldFanIds=[]}if(was&&!w.focus){w.focusOrder=[];w.heldFanIds=[]}break}
    case 'FLUSH_FOCUS':w.heldFanIds=[];w.focusOrder=(s.fans[cid]??[]).filter(f=>!f.hidden&&!f.cleared).sort((a,b)=>(latestMessage(s,cid,b.id)?.createdAt??0)-(latestMessage(s,cid,a.id)?.createdAt??0)).map(f=>f.id);break
    case 'PATCH_FAN':if(fan)Object.assign(fan,p);break
    case 'PATCH_CREATOR':{const c=s.creators.find(c=>c.id===cid);if(s.role!=='admin'){if(c&&typeof p?.notes==='string')c.notes=p.notes;if(p?.defaultNickname!==undefined)notice(s,t('engine.16'));break}if(c)Object.assign(c,p);break}
    case 'SET_NOTE_TEMPLATE':{
      const creator=s.creators.find(creator=>creator.id===cid)
      if(creator&&typeof p==='string'&&p.length<=10000)creator.fanNoteTemplate=p
      break
    }
    case 'PATCH_DRAFT':s.drafts[k]={...(s.drafts[k]??emptyDraft()),...p};break
    case 'CLEAR_DRAFT':s.drafts[k]=emptyDraft();break
    case 'SEND':{const draft=p?.draft??s.drafts[k]??emptyDraft();if(draft.scheduledAt&&draft.scheduledAt>now){s.tasks.push({id:uid(),creatorId:cid,fanId:fid,kind:'scheduled',dueAt:draft.scheduledAt,status:'pending',draft:structuredClone(draft),text:draft.text});if(!p?.preserveDraft)s.drafts[k]=emptyDraft();notice(s,t('engine.17'))}else{const m=addMessage(s,cid,fid,draft,now,p?.source??'manual');if(m){if(!p?.preserveDraft)s.drafts[k]=emptyDraft();notice(s,m.status==='failed'?t('engine.18'):t('engine.19'))}}break}
    case 'RETRY':if(message&&message.status==='failed'){message.status=s.simulateFailure?'failed':'sent';notice(s,s.simulateFailure?t('engine.20'):t('engine.21'))}break
    case 'MARK_READ':(s.fans[cid]??[]).filter(f=>p?.ids?.includes(f.id)).forEach(f=>{f.unread=!!p.unread});break
    case 'CLEAR_FANS':if(s.role!=='admin'){notice(s,t('engine.22'));break}(s.fans[cid]??[]).filter(f=>Array.isArray(p)&&p.includes(f.id)).forEach(f=>{f.cleared=true;f.unread=false;s.messages[key(cid,f.id)]=[];s.drafts[key(cid,f.id)]=emptyDraft();s.tasks.filter(t=>t.creatorId===cid&&t.fanId===f.id&&t.status==='pending').forEach(t=>t.status='cancelled')});fixWorkspace(s,cid);notice(s,t('engine.23'));break
    case 'HIDE_FAN':if(fan){fan.hidden=true;fixWorkspace(s,cid);notice(s,t('engine.24'))}break
    case 'PIN_LIST':{const list=s.creators.find(c=>c.id===cid)?.lists.find(l=>l.id===p?.listId);if(list)list.pinned=!!p.pinned;break}
    case 'ADD_LIST':{const c=s.creators.find(c=>c.id===cid);const name=String(p?.name??'').trim();if(c&&name&&!c.lists.some(l=>l.name===name))c.lists.push({id:uid(),name,pinned:true});break}
    case 'SET_FAN_LISTS':if(fan&&Array.isArray(p))fan.listIds=p.filter(id=>s.creators.find(c=>c.id===cid)?.lists.some(l=>l.id===id));break
    case 'MOVE_INBOX':if(s.role==='admin'&&s.creators.find(c=>c.id===cid)?.splitEnabled)(s.fans[cid]??[]).filter(f=>p?.fanIds?.includes(f.id)).forEach(f=>{f.inboxId=Math.max(1,Math.min(s.creators.find(c=>c.id===cid)!.inboxCount,Number(p.inboxId)||1))});break
    case 'SPLIT_INBOX':{if(s.role!=='admin'){notice(s,t('engine.25'));break}const c=s.creators.find(c=>c.id===cid)!;c.splitEnabled=!!p?.enabled;const n=Math.max(2,Math.min(9,Number(p?.count)||2));if(n!==c.inboxCount){c.inboxCount=n;(s.fans[cid]??[]).forEach((f,i)=>f.inboxId=i%n+1)}w.inboxIds=[];notice(s,t('engine.26'));break}
    case 'PIN_MESSAGE':if(message&&message.status!=='withdrawn')message.pinned=!message.pinned;break
    case 'LIKE_MESSAGE':if(message&&message.direction==='inbound')message.liked=!message.liked;break
    case 'WITHDRAW':if(message&&withdrawMessage(s,cid,fid,message,now))notice(s,t('engine.27'));else notice(s,t('engine.28'));break
    case 'COPY_DRAFT':if(message){s.drafts[k]={text:displaySample(message.text),attachments:message.attachments.filter(a=>s.media.some(m=>m.id===a.mediaId)).map(a=>({...a})),price:message.price,lockedText:message.lockedText,creatorTags:[...message.creatorTags],releaseFormIds:allowedFormIds(s,cid,message.releaseFormIds),scriptId:message.scriptId,format:{...message.format}};notice(s,t('engine.29'))}break
    case 'REPLY':if(message)s.drafts[k]={...(s.drafts[k]??emptyDraft()),replyToId:message.id};break
    case 'SET_MESSAGE_TAGS':if(message&&message.direction==='outbound'&&message.status!=='withdrawn'){const tags=Array.isArray(p)?p:p?.creatorTags;if(Array.isArray(tags))message.creatorTags=[...new Set<string>(tags.filter((id:unknown)=>typeof id==='string'&&s.creators.some(creator=>creator.id===id)))].slice(0,40);if(!Array.isArray(p)&&Array.isArray(p?.releaseFormIds))message.releaseFormIds=allowedFormIds(s,cid,p.releaseFormIds)}break
    case 'ADD_SCRIPT_MESSAGE':if(message){s.scripts.push({id:uid(),title:'Saved · '+message.text,category:'Saved',text:message.text,attachments:structuredClone(message.attachments),price:message.price,creatorTags:[...message.creatorTags],releaseFormIds:allowedFormIds(s,cid,message.releaseFormIds),founder:s.role==='admin'?'Admin':'Alex',createdAt:now});notice(s,t('engine.31'))}break
    case 'ADD_MEDIA':if(p?.id&&!s.media.some(m=>m.id===p.id))s.media.push(p);break
    case 'PATCH_MEDIA':{const media=s.media.find(media=>media.id===p?.id);if(media){if(typeof p.notes==='string')media.notes=p.notes.slice(0,1000);if(Array.isArray(p.tags))media.tags=[...new Set<string>(p.tags.filter((tag:unknown)=>typeof tag==='string'&&tag.trim()).map((tag:string)=>tag.trim()))].slice(0,20)}break}
    case 'ADD_SCRIPT':if(p?.id)s.scripts.push(p);break
    case 'PATCH_EMOJIS':if(Array.isArray(p))s.emojis=[...new Set(p.filter(e=>typeof e==='string'))].slice(0,40);break
    case 'READ_NOTIFICATIONS':s.notifications.filter(n=>n.creatorId===cid&&(!p?.kind||n.kind===p.kind)).forEach(n=>n.unread=false);break
    case 'NOTIFICATION_REPLY':{const n=s.notifications.find(n=>n.id===p?.notificationId&&n.creatorId===cid);if(n&&String(p?.text??'').trim()){const d=emptyDraft();d.text=p.text;const m=addMessage(s,cid,n.fanId,d,now);if(m){n.unread=false;notice(s,m.status==='failed'?t('engine.32'):t('engine.33'))}}break}
    case 'VIEW_PPV':if(message&&message.price>0&&message.status!=='withdrawn'&&message.status!=='failed'){message.viewed=true;message.status='read'}break
    case 'PURCHASE':purchase(s,cid,fid,action.messageId??'',now);break
    case 'CREATE_TASK':{
      const kind=p?.kind, dueAt=p?.minutes===undefined?p?.dueAt:now+p.minutes*60000, draft=p?.draft as Draft|undefined
      const duration=dueAt-now
      if(!fan||!['reminder','timed'].includes(kind)||!Number.isFinite(dueAt)||duration<=0||duration>3600000||(p.minutes!==undefined&&(!Number.isInteger(p.minutes)||p.minutes<1||p.minutes>60))){notice(s,t('engine.35'));break}
      if(kind==='timed'&&(!draft||fan.blocked||fan.restricted||(!draft.text.trim()&&!draft.attachments.length)||!Number.isFinite(draft.price)||draft.price<0||draft.price>200||(draft.price>0&&draft.price<3)||(draft.price>0&&!draft.lockedText&&!draft.attachments.some(item=>!item.free)))){notice(s,t('engine.05'));break}
      if(kind==='reminder')s.tasks.filter(task=>task.creatorId===cid&&task.fanId===fid&&task.kind==='reminder'&&task.status==='pending').forEach(task=>task.status='cancelled')
      s.tasks.push({id:uid(),creatorId:cid,fanId:fid,kind,dueAt,status:'pending',draft:kind==='timed'?{...structuredClone(draft!),scheduledAt:undefined}:undefined,text:kind==='timed'?draft!.text:String(p.text??''),alarmSound:kind==='reminder'?p.alarmSound:undefined})
      notice(s,t('engine.34'));break
    }
    case 'CANCEL_TASK':{const t=s.tasks.find(t=>t.id===p);if(t?.status==='pending')t.status='cancelled';break}
    case 'ADVANCE_TIME':s.clockOffset+=Math.max(0,Number(p)||0)*1000;processDue(s,Date.now()+s.clockOffset);break
    case 'TICK':processDue(s,Number(p)||now);break
    case 'CREATE_CAMPAIGN':{if(s.role!=='admin'){notice(s,t('engine.36'));break}const ids=Array.isArray(p?.fanIds)?[...new Set<string>(p.fanIds)].filter(id=>s.fans[cid]?.some(f=>f.id===id&&!f.hidden&&!f.cleared&&!f.blocked&&!f.restricted)):[];const audience=p?.audience?normalizeAudience(p.audience):undefined;const eligible=audience?new Set(selectOnlineFans(s,cid,audience,now).map(fan=>fan.id)):null;const recipients=eligible?ids.filter(id=>eligible.has(id)):ids;const draft=structuredClone(p?.draft??emptyDraft()) as Draft;if(!recipients.length&&!p?.saveOnly){notice(s,t('engine.37'));break}if(!String(p?.title??'').trim()||(!draft.text.trim()&&!draft.attachments.length)||!Number.isFinite(draft.price)||draft.price<0||draft.price>200||(draft.price>0&&draft.price<3)||(draft.price>0&&!draft.lockedText&&!draft.attachments.some(item=>!item.free))||(p?.scheduledAt!==undefined&&(!Number.isFinite(p.scheduledAt)||p.scheduledAt<=now))||(!p?.saveOnly&&p?.type==='auto'&&!p?.scheduledAt)){notice(s,t('completion.invalidCampaign'));break}const c:Campaign={id:uid(),creatorId:cid,type:p?.type??'smart',title:p.title.trim(),fanIds:recipients,messageIds:[],createdAt:now,status:p?.saveOnly?'draft':p?.scheduledAt>now?'scheduled':'sent',draft,scheduledAt:p?.scheduledAt,audience};s.campaigns.push(c);if(c.status==='sent')runCampaign(s,c,now);else notice(s,c.status==='draft'?t('engine.39'):t('engine.40'));break}
    case 'CANCEL_CAMPAIGN':{const c=s.campaigns.find(c=>c.id===p);if(s.role==='admin'&&c&&['draft','scheduled'].includes(c.status))c.status='cancelled';break}
    case 'REPORT_FAN':if(fan){fan.reportedAt=now;fan.reportReason=String(p?.reason??t('engine.41'));notification(s,cid,fid,'platform',t('engine.42'),fan.reportReason,now);notice(s,t('engine.43'))}break
    case 'SIMULATE':{let target=s.fans[cid]?.find(f=>f.id===(p?.fanId??fid))??s.fans[cid]?.[0];if(!target)break;
      if(p?.kind==='new-fan'){target={...structuredClone(target),id:uid(),name:t('engine.44')+((s.fans[cid]?.length??0)+1),handle:'@new_fan_'+(s.fans[cid]?.length??0),avatar:'N',isCreator:false,unread:true,online:true,priority:false,muted:false,restricted:false,blocked:false,hidden:false,cleared:false,listIds:[],notes:'',subscribedAt:now,subscriptionLabel:t('engine.46'),reportedAt:undefined,reportReason:undefined};s.fans[cid].push(target);s.drafts[key(cid,target.id)]=emptyDraft();notification(s,cid,target.id,'subscription',t('engine.47'),t('engine.48'),now)}
      if(p?.kind==='reply'||p?.kind==='new-fan'){const d=emptyDraft();d.text=p?.text||t('engine.49');const m:Message={id:uid(),creatorId:cid,fanId:target.id,text:d.text,createdAt:now,direction:'inbound',status:'sent',attachments:[],price:0,lockedText:true,creatorTags:[],format:d.format,liked:false,pinned:false,viewed:false,sender:target.name,source:'manual'};s.messages[key(cid,target.id)]??=[];s.messages[key(cid,target.id)].push(m);target.unread=true;target.hidden=false;target.cleared=false;if(w.focus&&focusAllowed(w)&&!w.heldFanIds.includes(target.id))w.heldFanIds.push(target.id)}
      else if(p?.kind==='purchase'){const mid=p?.messageId??messagesFor(s,cid,target.id).filter(m=>m.price>0&&!m.purchasedAt&&m.status!=='withdrawn'&&m.status!=='failed').at(-1)?.id;if(mid)purchase(s,cid,target.id,mid,now);else notice(s,t('engine.50'))}
      else if(p?.kind==='tip'){const amount=Number(p?.amount)||20;s.transactions.push({id:uid(),creatorId:cid,fanId:target.id,kind:'tip',amount,at:now});target.unread=true;notification(s,cid,target.id,'tip',t('engine.51', [money(amount)]),t('engine.52'),now)}
      else if(p?.kind==='subscription'){target.subscriptionStatus='active';target.renew=true;target.subscribedAt=now;target.subscriptionLabel=t('engine.46');s.transactions.push({id:uid(),creatorId:cid,fanId:target.id,kind:'subscription',amount:target.subscriptionPrice,at:now});notification(s,cid,target.id,'subscription',t('engine.53'),t('engine.54')+s.creators.find(c=>c.id===cid)?.name,now)}
      else if(p?.kind==='platform')notification(s,cid,target.id,'platform',t('engine.55'),t('engine.56'),now);break}
    case 'ROLE':if(p==='admin'||p==='chatter')s.role=p;break
    case 'FAILURE':s.simulateFailure=!!p;break
    default:return state
  }
  return s
}

export function restoreState(raw:unknown):DemoState|null {
  if(!raw||typeof raw!=='object')return null
  const s=raw as DemoState
  if(s.version!==1||!Array.isArray(s.creators)||!s.creators.length||!s.fans||!s.messages||!s.drafts||!s.workspaces||!Array.isArray(s.transactions)||!Array.isArray(s.notifications)||!Array.isArray(s.tasks)||!Array.isArray(s.media)||!Array.isArray(s.scripts)||!Array.isArray(s.campaigns)||!s.creators.some(c=>c.id===s.activeCreatorId))return null
  if(!s.creators.every(c=>Array.isArray(s.fans[c.id])&&s.workspaces[c.id]))return null
  s.withdrawals=Array.isArray(s.withdrawals)?s.withdrawals:[]
  s.releaseForms=Array.isArray(s.releaseForms)?s.releaseForms:initialReleaseForms()
  for(const media of initialMedia())if(!s.media.some(item=>item.id===media.id))s.media.push(media)
  s.creators.forEach(c=>{const w=s.workspaces[c.id];w.pinnedFanIds??=[];w.activePinnedFanId??=null;w.homeFanId??=w.activeFanId})
  return s
}
