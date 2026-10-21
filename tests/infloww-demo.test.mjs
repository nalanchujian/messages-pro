import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

// Load the actual state engine using the repository's existing Vite test approach.
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false},appType:'custom'})
const {createSeed}=await server.ssrLoadModule('/src/infloww-demo/seed.ts')
const {emptyDraft,key}=await server.ssrLoadModule('/src/infloww-demo/types.ts')
const {demoReducer:reduce,fanMetrics,fanSignals,messagesFor,selectFans,restoreState,serializeState}=await server.ssrLoadModule('/src/infloww-demo/engine.ts')
const {setLocale,t,sourceValue,sourceLabel,countryLabel,displayScriptTitle,displayScriptCategory}=await server.ssrLoadModule('/src/infloww-demo/i18n.ts')
const {sampleTranslation}=await server.ssrLoadModule('/src/infloww-demo/chatTools.ts')
const {selectOnlineFans,normalizeAudience}=await server.ssrLoadModule('/src/infloww-demo/audience.ts')
const {mediaHistory,mediaMetrics}=await server.ssrLoadModule('/src/infloww-demo/mediaActivity.ts')
const {parseMessagePrice,purchasedPpvHistory}=await server.ssrLoadModule('/src/infloww-demo/messagePricing.ts')
const {calendarDays,scheduleTimestamp,isPastScheduleDay}=await server.ssrLoadModule('/src/infloww-demo/scheduleCalendar.ts')
const {sameMessageGroup,chatMediaAccess}=await server.ssrLoadModule('/src/infloww-demo/chatPresentation.ts')
const seed=()=>createSeed(Date.now())
const send=(s,draft,cid='harriet',fid='mason')=>reduce(s,{type:'SEND',creatorId:cid,fanId:fid,payload:{draft}})

test('workspace persistence never saves or replays a previous send notification',()=>{
  const draft={...emptyDraft(),text:'Persistence regression'}
  const sent=send(seed(),draft)
  assert.ok(sent.feedback)
  const serialized=JSON.parse(serializeState(sent))
  assert.equal(Object.hasOwn(serialized,'feedback'),false)
  const before=messagesFor(sent,'harriet','mason').length
  const restored=restoreState({...serialized,feedback:sent.feedback})
  assert.ok(restored)
  assert.equal(Object.hasOwn(restored,'feedback'),false)
  assert.equal(messagesFor(restored,'harriet','mason').length,before)
  const entered=reduce(restored,{type:'TICK',payload:Date.now()})
  assert.equal(entered.feedback,undefined)
  assert.equal(messagesFor(entered,'harriet','mason').length,before)
  const next=send(entered,{...draft,text:'A new explicit send'})
  assert.ok(next.feedback)
  assert.notEqual(next.feedback.id,sent.feedback.id)
  assert.equal(messagesFor(next,'harriet','mason').length,before+1)
})

test('chat grouping separates dates, senders, direction and withdrawn messages',()=>{
  const s=seed(),base=messagesFor(s,'harriet','mason')[0]
  const first={...base,createdAt:new Date(2026,9,15,23,59).getTime(),sender:'Alex',status:'sent',direction:'outbound'}
  assert.equal(sameMessageGroup(undefined,first),false)
  assert.equal(sameMessageGroup(first,{...first,createdAt:first.createdAt+1000}),true)
  assert.equal(sameMessageGroup(first,{...first,createdAt:new Date(2026,9,16,0,1).getTime()}),false)
  assert.equal(sameMessageGroup(first,{...first,sender:'Sam'}),false)
  assert.equal(sameMessageGroup(first,{...first,direction:'inbound'}),false)
  assert.equal(sameMessageGroup({...first,status:'withdrawn'},first),false)
})

test('incoming PPV previews exclude locked media while creators can preview their own messages',()=>{
  const s=seed(),base=messagesFor(s,'harriet','mason')[0]
  const message={...base,price:12,purchasedAt:undefined,lockedText:true,direction:'inbound',attachments:[{mediaId:'paid',free:false},{mediaId:'free',free:true}]}
  const before=structuredClone(message)
  assert.deepEqual(chatMediaAccess(message),{available:[{mediaId:'free',free:true}],locked:[{mediaId:'paid',free:false}],textLocked:true})
  assert.deepEqual(message,before)
  for(const available of [{...message,direction:'outbound'},{...message,purchasedAt:Date.now()},{...message,price:0}]){
    assert.deepEqual(chatMediaAccess(available),{available:message.attachments,locked:[],textLocked:false})
  }
})

test('vault metrics count bundles once and do not attribute purchases to free previews',()=>{
  const s=seed(),base=messagesFor(s,'harriet','mason')[0]
  const bundle={...base,id:'bundle-metric',direction:'outbound',status:'read',price:20,purchasedAt:Date.now(),attachments:[{mediaId:'paid',free:false},{mediaId:'preview',free:true}]}
  const failed={...bundle,id:'failed-metric',status:'failed'}
  const inbound={...bundle,id:'inbound-metric',direction:'inbound'}
  assert.deepEqual(mediaMetrics([bundle,failed,inbound],['paid','preview']),{sent:1,rate:100,revenue:20})
  assert.deepEqual(mediaMetrics([bundle],['preview']),{sent:1,rate:0,revenue:0})
  assert.deepEqual(mediaMetrics([bundle],['missing']),{sent:0,rate:0,revenue:0})
})

test('schedule calendar uses Sunday-first six-week grids and retains leap days',()=>{
  const days=calendarDays(2026,9)
  assert.equal(days.length,42);assert.equal(days[0].getDay(),0)
  assert.equal(days[0].getMonth(),8);assert.equal(days[0].getDate(),27)
  assert.equal(days[19].getMonth(),9);assert.equal(days[19].getDate(),16)
  assert.ok(calendarDays(2028,1).some(day=>day.getMonth()===1&&day.getDate()===29))
})
test('schedule time preserves midnight and noon and rejects out-of-range time fields',()=>{
  const day=new Date(2026,9,16),now=new Date(2026,9,16,16,10).getTime()
  assert.equal(new Date(scheduleTimestamp(day,0,0)).getHours(),0)
  assert.equal(new Date(scheduleTimestamp(day,12,10)).getHours(),12)
  assert.equal(new Date(scheduleTimestamp(day,23,59)).getMinutes(),59)
  assert.ok(Number.isNaN(scheduleTimestamp(day,24,0)));assert.ok(Number.isNaN(scheduleTimestamp(day,12,60)))
  assert.equal(isPastScheduleDay(new Date(2026,9,15),now),true)
  assert.equal(isPastScheduleDay(day,now),false)
  assert.equal(isPastScheduleDay(new Date(2026,9,17),now),false)
})

test('message pricing accepts free or valid cents and rejects invalid paid values',()=>{
  assert.equal(parseMessagePrice(''),0);assert.equal(parseMessagePrice('0'),0)
  assert.equal(parseMessagePrice('3.01'),3.01);assert.equal(parseMessagePrice('200.00'),200)
  for(const value of ['2.99','-3','200.01','3.001','Infinity','1e2','abc'])assert.equal(parseMessagePrice(value),null)
})
test('pricing history excludes unpaid, inbound, failed and withdrawn messages and uses the latest purchases',()=>{
  const s=seed(),base=messagesFor(s,'harriet','mason')[0]
  const messages=Array.from({length:32},(_,index)=>({...base,id:`history-${index}`,price:index+3,purchasedAt:1000+index,status:'read',direction:'outbound'}))
  messages.push({...base,id:'unpaid',price:999,purchasedAt:undefined,status:'read',direction:'outbound'},
    {...base,id:'inbound',price:999,purchasedAt:9999,status:'read',direction:'inbound'},
    {...base,id:'failed',price:999,purchasedAt:9999,status:'failed',direction:'outbound'},
    {...base,id:'withdrawn',price:999,purchasedAt:9999,status:'withdrawn',direction:'outbound'})
  const history=purchasedPpvHistory(messages)
  assert.equal(history.items.length,30);assert.equal(history.items[0].id,'history-31');assert.equal(history.items.at(-1).id,'history-2')
  assert.equal(history.max,34);assert.equal(history.avg,19.5)
  assert.deepEqual(purchasedPpvHistory([]),{items:[],max:0,avg:0})
})

test('split inbox distributes fans, filters groups and supports bulk reassignment',()=>{
  let s=seed();s.creators[0].splitEnabled=false
  s=reduce(s,{type:'SPLIT_INBOX',creatorId:'harriet',payload:{enabled:true,count:2}})
  assert.ok(s.fans.harriet.every((fan,index)=>fan.inboxId===index%2+1))
  s=reduce(s,{type:'MOVE_INBOX',creatorId:'harriet',payload:{fanIds:['mason','riley'],inboxId:2}})
  s=reduce(s,{type:'PATCH_WORKSPACE',creatorId:'harriet',payload:{inboxIds:[2]}})
  const group=selectFans(s,'harriet');assert.ok(group.every(fan=>fan.inboxId===2));assert.ok(group.some(fan=>fan.id==='mason'));assert.ok(group.some(fan=>fan.id==='riley'))
  s=restoreState(JSON.parse(JSON.stringify(s)));assert.equal(s.fans.harriet.find(fan=>fan.id==='mason').inboxId,2)
})

test('expired fan requires creator subscription before direct messaging',()=>{
  let s=seed();const before=messagesFor(s,'harriet','nate').length
  s=send(s,{...emptyDraft(),text:'Can we chat?'},'harriet','nate')
  assert.equal(messagesFor(s,'harriet','nate').length,before)
  s=reduce(s,{type:'PATCH_FAN',creatorId:'harriet',fanId:'nate',payload:{creatorSubscribed:true}})
  s=send(s,{...emptyDraft(),text:'Can we chat?'},'harriet','nate')
  assert.equal(messagesFor(s,'harriet','nate').length,before+1)
  assert.equal(s.fans.harriet.find(fan=>fan.id==='nate').subscriptionStatus,'expired')
})

test('creator workspaces and composite drafts survive switching and serialization',()=>{
  let s=seed();s=reduce(s,{type:'PATCH_DRAFT',payload:{text:'A draft',price:20,attachments:[{mediaId:'studio',free:false}],creatorTags:['maya']}})
  s=reduce(s,{type:'PATCH_WORKSPACE',payload:{view:'tips',search:'Mason',listScroll:120}})
  s=reduce(s,{type:'OPEN_CREATOR',payload:'maya'});s=reduce(s,{type:'PATCH_DRAFT',payload:{text:'B draft'}})
  s=restoreState(JSON.parse(JSON.stringify(s)));assert.ok(s)
  s=reduce(s,{type:'SET_ACTIVE_CREATOR',payload:'harriet'})
  assert.equal(s.drafts[key('harriet','mason')].text,'A draft');assert.equal(s.drafts[key('maya','mason')].text,'B draft')
  assert.equal(s.drafts[key('harriet','mason')].attachments[0].mediaId,'studio');assert.equal(s.workspaces.harriet.listScroll,120)
})
test('inbox menu filters creator chats and chats last answered by fans',()=>{
  let s=seed()
  s=reduce(s,{type:'PATCH_WORKSPACE',creatorId:'harriet',payload:{hideCreators:true}})
  assert.ok(selectFans(s,'harriet').every(fan=>!fan.isCreator))
  s=reduce(s,{type:'PATCH_WORKSPACE',creatorId:'harriet',payload:{hideCreators:false,extraFilter:'fan_last'}})
  assert.ok(selectFans(s,'harriet').every(fan=>messagesFor(s,'harriet',fan.id).at(-1)?.direction==='inbound'))
})
test('creator tabs reorder without changing the active creator or its workspace',()=>{
  let s=seed();const active=s.activeCreatorId
  s=reduce(s,{type:'MOVE_CREATOR_TAB',payload:{id:'maya',targetId:'harriet'}})
  assert.deepEqual(s.openCreatorIds,['maya','harriet'])
  assert.equal(s.activeCreatorId,active)
  assert.equal(s.workspaces.harriet.activeFanId,'mason')
})
test('copying PPV and closing a fan tab preserve history and draft without sending',()=>{
  let s=seed();const before=messagesFor(s,'harriet','mason').length
  s=reduce(s,{type:'COPY_DRAFT',messageId:'harriet-mason-ppv'});s=reduce(s,{type:'CLOSE_FAN',fanId:'mason'})
  assert.equal(messagesFor(s,'harriet','mason').length,before);assert.equal(s.drafts[key('harriet','mason')].price,18)
  s=reduce(s,{type:'OPEN_FAN',fanId:'mason'});assert.equal(s.drafts[key('harriet','mason')].attachments.length,2)
})
test('sending a script preview preserves the main draft and does not edit its template',()=>{
  let s=seed()
  s=reduce(s,{type:'PATCH_DRAFT',payload:{text:'Unfinished main draft',attachments:[{mediaId:'studio',free:true}]}})
  const script=structuredClone(s.scripts[0])
  const draft=emptyDraft();draft.text='Edited in preview only'
  const before=messagesFor(s,'harriet','mason').length
  s=reduce(s,{type:'SEND',payload:{draft,preserveDraft:true}})
  assert.equal(messagesFor(s,'harriet','mason').length,before+1)
  assert.equal(messagesFor(s,'harriet','mason').at(-1).text,'Edited in preview only')
  assert.equal(s.drafts[key('harriet','mason')].text,'Unfinished main draft')
  assert.equal(s.drafts[key('harriet','mason')].attachments[0].mediaId,'studio')
  assert.deepEqual(s.scripts[0],script)
})
test('tagging an existing message does not change its price or the draft selection',()=>{
  let s=seed()
  s=reduce(s,{type:'PATCH_DRAFT',payload:{creatorTags:['harriet']}})
  const before=messagesFor(s,'harriet','mason').find(message=>message.id==='harriet-mason-ppv')
  s=reduce(s,{type:'SET_MESSAGE_TAGS',messageId:before.id,payload:['maya','maya','unknown-creator']})
  const message=messagesFor(s,'harriet','mason').find(message=>message.id===before.id)
  assert.deepEqual(message.creatorTags,['maya'])
  assert.equal(message.price,before.price)
  assert.equal(message.purchasedAt,before.purchasedAt)
  assert.deepEqual(s.drafts[key('harriet','mason')].creatorTags,['harriet'])
})
test('top conversation tabs add without switching, reorder, and return to the home conversation',()=>{
  let s=seed();const w=()=>s.workspaces.harriet
  s=reduce(s,{type:'PIN_FAN_TAB',fanId:'mason'})
  assert.deepEqual(w().pinnedFanIds,['mason']);assert.equal(w().activePinnedFanId,null)
  s=reduce(s,{type:'OPEN_FAN',fanId:'leo'})
  s=reduce(s,{type:'PIN_FAN_TAB',fanId:'leo'})
  assert.deepEqual(w().pinnedFanIds,['leo','mason']);assert.equal(w().activeFanId,'leo')
  s=reduce(s,{type:'SELECT_FAN_TAB',fanId:'mason'})
  assert.equal(w().activeFanId,'mason');assert.equal(w().homeFanId,'leo')
  s=reduce(s,{type:'MOVE_FAN_TAB',fanId:'mason',payload:{targetId:'leo'}})
  assert.deepEqual(w().pinnedFanIds,['mason','leo'])
  s=reduce(s,{type:'CLOSE_FAN_TAB',fanId:'mason'})
  assert.equal(w().activePinnedFanId,'leo');assert.equal(w().activeFanId,'leo')
  s=reduce(s,{type:'SELECT_FAN_TAB',fanId:'leo'})
  s=reduce(s,{type:'SELECT_HOME_TAB'})
  assert.equal(w().activePinnedFanId,null);assert.equal(w().activeFanId,'leo')
  s=restoreState(JSON.parse(JSON.stringify(s)))
  assert.deepEqual(w().pinnedFanIds,['leo'])
})
test('fan signals retain all matching statuses in reference order and ignore another creator purchases',()=>{
  const now=Date.now(),s=createSeed(now),fan=s.fans.harriet.find(f=>f.id==='mason')
  fan.subscribedAt=now-4*86400000;fan.renew=false
  messagesFor(s,'harriet','mason').forEach(message=>message.createdAt=now-4*86400000)
  assert.deepEqual(fanSignals(s,'harriet','mason',now),['New','Off','PPV','72h'])
  s.transactions=s.transactions.filter(tx=>tx.creatorId!=='harriet'||tx.fanId!=='mason'||tx.kind!=='ppv')
  assert.deepEqual(fanSignals(s,'harriet','mason',now),['New','Off','72h'])
})
test('snow follows the supplied client rule: positive spend and latest chat older than 72 hours',()=>{
  const now=Date.now(),s=createSeed(now),thread=messagesFor(s,'harriet','mason')
  thread.forEach(message=>message.createdAt=now-72*3600000)
  assert.ok(!fanSignals(s,'harriet','mason',now).includes('72h'))
  thread.forEach(message=>message.createdAt--)
  assert.ok(fanSignals(s,'harriet','mason',now).includes('72h'))
  thread.at(-1).createdAt=now
  assert.ok(!fanSignals(s,'harriet','mason',now).includes('72h'))
  thread.at(-1).createdAt=now-73*3600000
  s.transactions=s.transactions.filter(tx=>tx.creatorId!=='harriet'||tx.fanId!=='mason')
  assert.ok(!fanSignals(s,'harriet','mason',now).includes('72h'))
})
test('notification chat opens one dedicated tab, keeps home context, and preserves both drafts',()=>{
  let s=seed()
  s=reduce(s,{type:'PATCH_DRAFT',payload:{text:'Home draft'}})
  s=reduce(s,{type:'PATCH_DRAFT',fanId:'emma',payload:{text:'Emma draft'}})
  s=reduce(s,{type:'OPEN_NOTIFICATION_CHAT',payload:{notificationId:'harriet-notification-sub'}})
  assert.equal(s.workspaces.harriet.activePinnedFanId,'emma')
  assert.equal(s.workspaces.harriet.activeFanId,'emma')
  assert.equal(s.workspaces.harriet.homeFanId,'mason')
  assert.equal(s.notifications.find(item=>item.id==='harriet-notification-sub').unread,false)
  s=reduce(s,{type:'OPEN_NOTIFICATION_CHAT',payload:{notificationId:'harriet-notification-sub'}})
  assert.deepEqual(s.workspaces.harriet.pinnedFanIds,['emma'])
  s=reduce(s,{type:'SELECT_HOME_TAB'})
  assert.equal(s.workspaces.harriet.activeFanId,'mason')
  assert.equal(s.drafts[key('harriet','mason')].text,'Home draft')
  assert.equal(s.drafts[key('harriet','emma')].text,'Emma draft')
  assert.equal(s.workspaces.maya.activeFanId,'mason')
})
test('PPV send, view and purchase are independent and purchase is idempotent',()=>{
  let s=seed();const baseline=fanMetrics(s,'harriet','mason').spent
  const d=emptyDraft();d.text='New collection';d.price=24;d.attachments=[{mediaId:'studio',free:false}]
  s=send(s,d);const m=messagesFor(s,'harriet','mason').at(-1)
  assert.equal(fanMetrics(s,'harriet','mason').spent,baseline)
  s=reduce(s,{type:'VIEW_PPV',messageId:m.id});assert.equal(fanMetrics(s,'harriet','mason').spent,baseline)
  s=reduce(s,{type:'PURCHASE',messageId:m.id});s=reduce(s,{type:'PURCHASE',messageId:m.id})
  assert.equal(fanMetrics(s,'harriet','mason').spent,baseline+24);assert.equal(s.transactions.filter(t=>t.messageId===m.id).length,1)
  assert.equal(s.notifications.filter(n=>n.kind==='purchase'&&n.fanId==='mason').length,1)
})
test('subscription payments do not inflate non-subscription spend',()=>{
  let s=seed();const baseline=fanMetrics(s,'harriet','mason').spent
  s=reduce(s,{type:'SIMULATE',payload:{kind:'subscription'}})
  assert.equal(fanMetrics(s,'harriet','mason').spent,baseline)
})
test('Pinned derives from individual message pins, and lists do not pin conversations',()=>{
  let s=seed();s=reduce(s,{type:'PATCH_WORKSPACE',payload:{view:'pinned'}})
  assert.deepEqual(selectFans(s,'harriet').map(f=>f.id),['mason'])
  s=reduce(s,{type:'PIN_MESSAGE',messageId:'harriet-mason-2'});assert.equal(selectFans(s,'harriet').length,0)
  s=reduce(s,{type:'PIN_LIST',payload:{listId:'new',pinned:true}});assert.equal(selectFans(s,'harriet').length,0)
})
test('With Tips and unread tips retain distinct semantics',()=>{
  let s=seed();s=reduce(s,{type:'PATCH_WORKSPACE',payload:{view:'tips',extraFilter:'all'}})
  assert.ok(selectFans(s,'harriet').some(f=>f.id==='mason'))
  s=reduce(s,{type:'PATCH_WORKSPACE',payload:{extraFilter:'unread_tips'}})
  assert.ok(!selectFans(s,'harriet').some(f=>f.id==='mason'))
})
test('Focus buffers new fans without list reorder, then flush exposes them',()=>{
  let s=seed();s=reduce(s,{type:'PATCH_WORKSPACE',payload:{focus:true}})
  const before=selectFans(s,'harriet').map(f=>f.id)
  s=reduce(s,{type:'SIMULATE',payload:{kind:'new-fan'}})
  assert.deepEqual(selectFans(s,'harriet').map(f=>f.id),before);assert.equal(s.workspaces.harriet.heldFanIds.length,1)
  s=reduce(s,{type:'FLUSH_FOCUS'});assert.equal(selectFans(s,'harriet').length,before.length+1)
})
test('scheduled messages execute once after clock advancement and reload',()=>{
  let s=seed();const before=messagesFor(s,'harriet','mason').length
  const d=emptyDraft();d.text='A scheduled hello';d.scheduledAt=Date.now()+30000
  s=send(s,d);assert.equal(messagesFor(s,'harriet','mason').length,before);assert.equal(s.tasks.length,1)
  s=restoreState(JSON.parse(JSON.stringify(s)));s=reduce(s,{type:'ADVANCE_TIME',payload:60});s=reduce(s,{type:'TICK',payload:Date.now()+s.clockOffset})
  assert.equal(messagesFor(s,'harriet','mason').length,before+1);assert.equal(s.tasks[0].status,'done')
})
test('reminders produce notifications without sending a message',()=>{
  let s=seed();const before=messagesFor(s,'harriet','mason').length
  s=reduce(s,{type:'CREATE_TASK',payload:{kind:'reminder',dueAt:Date.now()+20000,text:'Check the fan response'}})
  s=reduce(s,{type:'ADVANCE_TIME',payload:60});assert.equal(messagesFor(s,'harriet','mason').length,before)
  assert.ok(s.notifications.some(n=>n.title==='Follow-up reminder due'))
})
test('restarting a fan countdown replaces the previous timer and rings once',()=>{
  let s=seed();const before=messagesFor(s,'harriet','mason').length
  s=reduce(s,{type:'CREATE_TASK',payload:{kind:'reminder',dueAt:Date.now()+20000,text:'Mason',alarmSound:'audio3'}})
  const first=s.tasks.at(-1).id
  s=reduce(s,{type:'CREATE_TASK',payload:{kind:'reminder',dueAt:Date.now()+40000,text:'Mason',alarmSound:'audio12'}})
  assert.equal(s.tasks.find(task=>task.id===first).status,'cancelled')
  assert.equal(s.tasks.filter(task=>task.kind==='reminder'&&task.status==='pending').length,1)
  s=reduce(s,{type:'ADVANCE_TIME',payload:60})
  const notifications=s.notifications.length
  s=reduce(s,{type:'TICK',payload:Date.now()+s.clockOffset})
  assert.equal(s.notifications.length,notifications)
  assert.equal(messagesFor(s,'harriet','mason').length,before)
  assert.equal(s.tasks.at(-1).alarmSound,'audio12')
})
test('timed message captures its own draft, sends once after restoration, and leaves the main draft intact',()=>{
  let s=seed();const before=messagesFor(s,'harriet','mason').length
  s=reduce(s,{type:'PATCH_DRAFT',payload:{text:'Still composing'}})
  const draft={...emptyDraft(),text:'Send this later',price:25,attachments:[{mediaId:'studio',free:false}],creatorTags:['maya']}
  s=reduce(s,{type:'CREATE_TASK',payload:{kind:'timed',minutes:1,draft}})
  assert.equal(s.tasks.at(-1).kind,'timed')
  assert.equal(messagesFor(s,'harriet','mason').length,before)
  draft.text='Changed elsewhere';draft.attachments.length=0
  s=restoreState(JSON.parse(JSON.stringify(s)))
  s=reduce(s,{type:'ADVANCE_TIME',payload:61})
  s=reduce(s,{type:'TICK',payload:Date.now()+s.clockOffset})
  assert.equal(messagesFor(s,'harriet','mason').length,before+1)
  const sent=messagesFor(s,'harriet','mason').at(-1)
  assert.equal(sent.text,'Send this later');assert.equal(sent.price,25)
  assert.deepEqual(sent.creatorTags,['maya']);assert.equal(sent.attachments[0].mediaId,'studio')
  assert.equal(s.drafts[key('harriet','mason')].text,'Still composing')
})
test('timed actions reject invalid duration or empty content and cancelled messages never send',()=>{
  let s=seed();const before=messagesFor(s,'harriet','mason').length,draft={...emptyDraft(),text:'Cancelled message'}
  for(const minutes of [0,-1,61,1.5,NaN])s=reduce(s,{type:'CREATE_TASK',payload:{kind:'timed',minutes,draft}})
  s=reduce(s,{type:'CREATE_TASK',payload:{kind:'timed',minutes:1,draft:emptyDraft()}})
  assert.equal(s.tasks.length,0)
  s=reduce(s,{type:'CREATE_TASK',payload:{kind:'timed',minutes:1,draft}})
  s=reduce(s,{type:'CREATE_TASK',payload:{kind:'reminder',minutes:1,text:'Reminder'}})
  assert.equal(s.tasks.filter(task=>task.status==='pending').length,2)
  s=reduce(s,{type:'CANCEL_TASK',payload:s.tasks[0].id})
  s=reduce(s,{type:'ADVANCE_TIME',payload:61})
  assert.equal(messagesFor(s,'harriet','mason').length,before)
  assert.equal(s.tasks[0].status,'cancelled');assert.equal(s.tasks[1].status,'done')
})
test('a timed message that becomes unavailable fails without a false sent result or repeated delivery',()=>{
  let s=seed();const before=messagesFor(s,'harriet','mason').length
  s=reduce(s,{type:'CREATE_TASK',payload:{kind:'timed',minutes:1,draft:{...emptyDraft(),text:'Later'}}})
  s=reduce(s,{type:'PATCH_FAN',payload:{blocked:true}})
  s=reduce(s,{type:'ADVANCE_TIME',payload:61})
  assert.equal(s.tasks.at(-1).status,'failed')
  assert.equal(messagesFor(s,'harriet','mason').length,before)
  s=reduce(s,{type:'PATCH_FAN',payload:{blocked:false}})
  s=reduce(s,{type:'ADVANCE_TIME',payload:61})
  assert.equal(messagesFor(s,'harriet','mason').length,before)
})
test('fan note templates are creator-scoped, editable by chatters, and preserve existing fan and creator notes',()=>{
  let s=seed();const existing=s.fans.harriet.map(fan=>fan.notes),creatorNotes=s.creators[0].notes
  s=reduce(s,{type:'ROLE',payload:'chatter'})
  s=reduce(s,{type:'SET_NOTE_TEMPLATE',payload:'Custom fields:\nFavorite place:'})
  assert.equal(s.creators[0].fanNoteTemplate,'Custom fields:\nFavorite place:')
  assert.equal(s.creators[1].fanNoteTemplate,undefined)
  assert.deepEqual(s.fans.harriet.map(fan=>fan.notes),existing)
  assert.equal(s.creators[0].notes,creatorNotes)
  s=reduce(s,{type:'SIMULATE',payload:{kind:'new-fan'}})
  assert.equal(s.fans.harriet.at(-1).notes,'')
  s=restoreState(JSON.parse(JSON.stringify(s)))
  setLocale('zh');assert.equal(s.creators[0].fanNoteTemplate,'Custom fields:\nFavorite place:');setLocale('en')
})
test('interface copy defaults to English and switches to Chinese',()=>{
  assert.equal(t('ui.310'),'Spending behavior')
  setLocale('zh')
  assert.equal(t('ui.310'),'消费行为')
  assert.equal(t('ui.031',['Mason']),'打开 Mason 的会话页签')
  setLocale('en')
  assert.equal(t('ui.031',['Mason']),'Open chat tab for Mason')
})
test('clicked sample actions and profile selections follow the selected language',()=>{
  setLocale('en')
  let s=seed()
  s=reduce(s,{type:'COPY_DRAFT',messageId:'harriet-mason-ppv'})
  assert.equal(s.drafts[key('harriet','mason')].text,'A quiet afternoon by the sea 🌊')
  assert.equal(sourceValue('其他'),'Other')
  assert.equal(sourceLabel('其他'),'Other')
  assert.equal(countryLabel('America/Toronto','Canada'),'Canada')
  assert.equal(sampleTranslation('A quiet afternoon by the sea 🌊','zh'),'海边安静的午后 🌊')
  setLocale('zh')
  s=seed()
  s=reduce(s,{type:'COPY_DRAFT',messageId:'harriet-mason-ppv'})
  assert.equal(s.drafts[key('harriet','mason')].text,'海边安静的午后 🌊')
  assert.equal(sourceLabel('Other'),'其他')
  assert.equal(countryLabel('America/Toronto','Canada'),'加拿大')
  assert.equal(sampleTranslation('海边安静的午后 🌊','en'),'A quiet afternoon by the sea 🌊')
  setLocale('en')
})
test('saving a message as a script keeps generated labels bilingual',()=>{
  setLocale('en')
  let s=seed()
  s=reduce(s,{type:'ADD_SCRIPT_MESSAGE',messageId:'harriet-mason-ppv'})
  const script=s.scripts.at(-1)
  assert.equal(displayScriptTitle(script.title),'Saved · A quiet afternoon by the')
  assert.equal(displayScriptCategory(script.category),'Saved')
  setLocale('zh')
  assert.equal(displayScriptTitle(script.title),'已保存 · 海边安静的午后 🌊')
  assert.equal(displayScriptCategory(script.category),'已保存')
  setLocale('en')
})
test('failed delivery is retried once and does not create a purchased transaction',()=>{
  let s=seed();s=reduce(s,{type:'FAILURE',payload:true});const d=emptyDraft();d.text='Retry me';d.price=20
  s=send(s,d);const m=messagesFor(s,'harriet','mason').at(-1);assert.equal(m.status,'failed')
  s=reduce(s,{type:'PURCHASE',messageId:m.id});assert.ok(!messagesFor(s,'harriet','mason').at(-1).purchasedAt)
  s=reduce(s,{type:'FAILURE',payload:false});s=reduce(s,{type:'RETRY',messageId:m.id});assert.equal(messagesFor(s,'harriet','mason').at(-1).status,'sent')
})
test('purchased messages cannot be withdrawn and copied drafts do not change spend',()=>{
  let s=seed();const baseline=fanMetrics(s,'harriet','mason').spent
  s=reduce(s,{type:'WITHDRAW',messageId:'harriet-mason-ppv'})
  assert.equal(messagesFor(s,'harriet','mason').find(m=>m.id==='harriet-mason-ppv').status,'read')
  s=reduce(s,{type:'COPY_DRAFT',messageId:'harriet-mason-ppv'});assert.equal(fanMetrics(s,'harriet','mason').spent,baseline)
})
test('campaigns, notification quick replies and global drafts share correct creator scope',()=>{
  let s=seed();const beforeM=messagesFor(s,'maya','mason').length
  const d=emptyDraft();d.text='Hi {name}';s=reduce(s,{type:'CREATE_CAMPAIGN',payload:{title:'Hello',type:'smart',fanIds:['mason','leo'],draft:d}})
  assert.equal(s.campaigns[0].messageIds.length,2);assert.equal(messagesFor(s,'harriet','mason').at(-1).text,'Hi Mason')
  assert.equal(messagesFor(s,'maya','mason').length,beforeM)
  s=reduce(s,{type:'NOTIFICATION_REPLY',payload:{notificationId:'harriet-notification-sub',text:'Welcome!'}})
  assert.equal(messagesFor(s,'harriet','emma').at(-1).text,'Welcome!');assert.equal(s.notifications.find(n=>n.id==='harriet-notification-sub').unread,false)
})
test('clear messages is different from closing tabs, cancels tasks and supports empty state',()=>{
  let s=seed();s=reduce(s,{type:'CREATE_TASK',payload:{kind:'timed',dueAt:Date.now()+30000,text:'test',draft:{...emptyDraft(),text:'Later'}}})
  s=reduce(s,{type:'CLEAR_FANS',payload:s.fans.harriet.map(f=>f.id)})
  assert.equal(selectFans(s,'harriet').length,0);assert.equal(s.workspaces.harriet.activeFanId,null);assert.equal(s.tasks[0].status,'cancelled')
  assert.ok(messagesFor(s,'maya','mason').length>0)
})
test('demonstration roles restrict administration while allowing creator-note collaboration',()=>{
  let s=seed();s=reduce(s,{type:'ROLE',payload:'chatter'});const count=s.creators[0].inboxCount;const nickname=s.creators[0].defaultNickname
  s=reduce(s,{type:'SPLIT_INBOX',payload:{count:9,enabled:true}});s=reduce(s,{type:'CLEAR_FANS',payload:['mason']});s=reduce(s,{type:'PATCH_CREATOR',payload:{notes:'changed',defaultNickname:'blocked'}})
  assert.equal(s.creators[0].inboxCount,count);assert.equal(s.creators[0].notes,'changed');assert.equal(s.creators[0].defaultNickname,nickname);assert.ok(messagesFor(s,'harriet','mason').length>0)
})
test('invalid storage is rejected and incompatible sources cannot poison state',()=>{
  assert.equal(restoreState(null),null);assert.equal(restoreState({version:99}),null)
})
test('online audience combines thresholds, list exclusions, creator status and subscription status',()=>{
  const now=Date.now(),s=createSeed(now),ids=filter=>selectOnlineFans(s,'harriet',filter,now).map(fan=>fan.id)
  // Keep this threshold fixture scoped to the original six fans.
  s.fans.harriet.filter(fan=>fan.id.startsWith('demo-')).forEach(fan=>{fan.online=false})
  assert.deepEqual(ids({}),['mason','riley','emma'])
  assert.deepEqual(ids({minSpend:100}),['mason'])
  assert.deepEqual(ids({minTips:10}),['mason'])
  assert.deepEqual(ids({excludeListIds:['vip'],excludeCreators:true}),['emma'])
  assert.deepEqual(ids({minSubscriptionMonths:1,excludeCreators:true}),['mason'])
  assert.deepEqual(ids({status:'expired'}),[])
  s.fans.harriet.find(fan=>fan.id==='nate').online=true
  assert.deepEqual(ids({status:'expired'}),['nate'])
  s.transactions.push({id:'other-agency-tip',creatorId:'maya',fanId:'emma',kind:'tip',amount:999,at:now})
  assert.deepEqual(ids({minTips:500}),[])
})
test('recent-contact exclusion counts delivered outbound messages, including withdrawn ones, but not replies or failed sends',()=>{
  const now=Date.now(),s=createSeed(now),thread=messagesFor(s,'harriet','mason')
  thread.at(-1).createdAt=now
  assert.ok(selectOnlineFans(s,'harriet',{excludeMessagedHours:1},now).some(fan=>fan.id==='mason'))
  const outbound=thread.find(message=>message.direction==='outbound')
  outbound.createdAt=now-3600000
  assert.ok(!selectOnlineFans(s,'harriet',{excludeMessagedHours:1},now).some(fan=>fan.id==='mason'))
  outbound.status='failed'
  assert.ok(selectOnlineFans(s,'harriet',{excludeMessagedHours:1},now).some(fan=>fan.id==='mason'))
  outbound.status='withdrawn'
  assert.ok(!selectOnlineFans(s,'harriet',{excludeMessagedHours:1},now).some(fan=>fan.id==='mason'))
})
test('online campaign cannot bypass exclusions with manually supplied recipient IDs',()=>{
  let s=seed();const before=Object.fromEntries(['mason','riley','emma'].map(id=>[id,messagesFor(s,'harriet',id).length]))
  s=reduce(s,{type:'CREATE_CAMPAIGN',payload:{title:'Online only',type:'smart',fanIds:['mason','riley','emma','leo'],audience:{excludeListIds:['vip'],excludeCreators:true},draft:{...emptyDraft(),text:'A targeted hello'}}})
  assert.deepEqual(s.campaigns.at(-1).fanIds,['emma'])
  assert.equal(messagesFor(s,'harriet','emma').length,before.emma+1)
  assert.equal(messagesFor(s,'harriet','mason').length,before.mason)
  assert.equal(messagesFor(s,'harriet','riley').length,before.riley)
  const count=s.campaigns.length
  s=reduce(s,{type:'CREATE_CAMPAIGN',payload:{title:'Nobody eligible',type:'smart',fanIds:['mason'],audience:{minSpend:10000},draft:{...emptyDraft(),text:'Not sent'}}})
  assert.equal(s.campaigns.length,count)
})
test('scheduled online campaigns recheck recent contact at dispatch and retain filter settings after restoration',()=>{
  let s=seed();const audience=normalizeAudience({excludeMessagedHours:1})
  s=reduce(s,{type:'PATCH_WORKSPACE',payload:{onlineAudience:audience}})
  s=reduce(s,{type:'CREATE_CAMPAIGN',payload:{title:'Check at send time',type:'smart',fanIds:['mason'],audience,draft:{...emptyDraft(),text:'Scheduled online'},scheduledAt:Date.now()+30000}})
  s=send(s,{...emptyDraft(),text:'Already contacted'})
  const before=messagesFor(s,'harriet','mason').length
  s=restoreState(JSON.parse(JSON.stringify(s)))
  s=reduce(s,{type:'ADVANCE_TIME',payload:60})
  assert.equal(messagesFor(s,'harriet','mason').length,before)
  assert.deepEqual(s.campaigns.at(-1).messageIds,[])
  assert.equal(s.workspaces.harriet.onlineAudience.excludeMessagedHours,1)
  assert.equal(s.workspaces.maya.onlineAudience,undefined)
})
test('withdrawal snapshots are idempotent, retain original sender and survive chat clearing',()=>{
  let s=seed();const draft={...emptyDraft(),text:'Original withdrawn text',price:20,attachments:[{mediaId:'studio',free:false}]}
  s=send(s,draft);const message=messagesFor(s,'harriet','mason').at(-1)
  s=reduce(s,{type:'ROLE',payload:'chatter'})
  s=reduce(s,{type:'WITHDRAW',messageId:message.id})
  s=reduce(s,{type:'WITHDRAW',messageId:message.id})
  assert.equal(s.withdrawals.length,1)
  assert.equal(s.withdrawals[0].message.text,'Original withdrawn text')
  assert.equal(s.withdrawals[0].message.status,'sent')
  assert.equal(s.withdrawals[0].withdrawnBy,'Alex')
  assert.equal(s.withdrawals[0].sender,message.sender)
  assert.equal(s.withdrawals[0].media[0].id,'studio')
  s=reduce(s,{type:'READ_WITHDRAWALS'});assert.equal(s.withdrawals[0].read,false)
  s=reduce(s,{type:'OPEN_WITHDRAWAL_CHAT',payload:{id:s.withdrawals[0].id}});assert.equal(s.workspaces.harriet.activePinnedFanId,null)
  s=reduce(s,{type:'ROLE',payload:'admin'})
  s=reduce(s,{type:'CLEAR_FANS',payload:['mason']})
  s=restoreState(JSON.parse(JSON.stringify(s)))
  assert.equal(messagesFor(s,'harriet','mason').length,0)
  assert.equal(s.withdrawals[0].message.text,'Original withdrawn text')
  assert.equal(s.withdrawals[0].message.attachments.length,1)
})
test('agency withdrawal notification opens the correct creator and preserves Home and its draft',()=>{
  let s=seed()
  s=send(s,{...emptyDraft(),text:'Maya audit message'},'maya','leo')
  const message=messagesFor(s,'maya','leo').at(-1)
  s=reduce(s,{type:'WITHDRAW',creatorId:'maya',fanId:'leo',messageId:message.id})
  s=reduce(s,{type:'PATCH_DRAFT',creatorId:'maya',fanId:'mason',payload:{text:'Maya home draft'}})
  s=reduce(s,{type:'OPEN_WITHDRAWAL_CHAT',payload:{id:s.withdrawals[0].id}})
  assert.equal(s.activeCreatorId,'maya')
  assert.equal(s.workspaces.maya.activePinnedFanId,'leo')
  assert.equal(s.workspaces.maya.homeFanId,'mason')
  assert.equal(s.workspaces.harriet.activeFanId,'mason')
  assert.equal(s.withdrawals[0].read,true)
  assert.equal(s.drafts[key('maya','mason')].text,'Maya home draft')
})
test('failed or purchased messages create no withdrawal alert and cancelling a delivered campaign cannot bypass the audit',()=>{
  let s=seed()
  s=reduce(s,{type:'WITHDRAW',messageId:'harriet-mason-ppv'})
  s=reduce(s,{type:'FAILURE',payload:true});s=send(s,{...emptyDraft(),text:'Failed message'})
  s=reduce(s,{type:'WITHDRAW',messageId:messagesFor(s,'harriet','mason').at(-1).id})
  assert.equal(s.withdrawals?.length??0,0)
  s=reduce(s,{type:'FAILURE',payload:false})
  s=reduce(s,{type:'CREATE_CAMPAIGN',payload:{title:'Already sent',type:'mass',fanIds:['mason'],draft:{...emptyDraft(),text:'Delivered message'}}})
  const campaign=s.campaigns.at(-1),mid=campaign.messageIds[0]
  s=reduce(s,{type:'CANCEL_CAMPAIGN',payload:campaign.id})
  assert.equal(messagesFor(s,'harriet','mason').find(message=>message.id===mid).status,'sent')
  s=reduce(s,{type:'WITHDRAW',messageId:mid})
  assert.equal(s.withdrawals.length,1)
  const old=JSON.parse(JSON.stringify(s));delete old.withdrawals
  assert.deepEqual(restoreState(old).withdrawals,[])
})

test('media history ignores replies and failed sends and preserves purchase versus free-preview semantics',()=>{
  const s=seed(),base=messagesFor(s,'harriet','mason').find(message=>message.id==='harriet-mason-ppv')
  const list=[base,{...structuredClone(base),id:'failed',status:'failed'},{...structuredClone(base),id:'reply',direction:'inbound'},{...structuredClone(base),id:'pending',status:'sending'}]
  const paid=mediaHistory(list,'coast')
  assert.deepEqual(paid.map(record=>record.kind),['bought','unpaid'])
  assert.equal(paid[0].price,18)
  assert.deepEqual(mediaHistory(list,'morning').map(record=>[record.kind,record.price]),[['sent',0]])
})
test('media history retains a single send and withdrawal after clearing the conversation',()=>{
  let s=send(seed(),{...emptyDraft(),text:'Media audit',attachments:[{mediaId:'studio',free:false}],price:20})
  const message=messagesFor(s,'harriet','mason').at(-1)
  s=reduce(s,{type:'WITHDRAW',messageId:message.id})
  const scoped=s.withdrawals.filter(record=>record.creatorId==='harriet'&&record.fanId==='mason')
  assert.deepEqual(mediaHistory(messagesFor(s,'harriet','mason'),'studio',scoped).filter(record=>record.messageId===message.id).map(record=>record.kind),['withdrawn','unpaid'])
  s=reduce(s,{type:'CLEAR_FANS',payload:['mason']})
  assert.deepEqual(mediaHistory(messagesFor(s,'harriet','mason'),'studio',scoped).map(record=>record.kind),['withdrawn','unpaid'])
})
test('script preview carries attribution and forms while preserving the main draft and copied tags',()=>{
  let s=seed();s=reduce(s,{type:'PATCH_DRAFT',payload:{text:'Retained draft'}})
  s=reduce(s,{type:'SEND',payload:{preserveDraft:true,draft:{...emptyDraft(),text:'Tagged script',scriptId:'welcome',releaseFormIds:['release-ava','release-jordan']}}})
  const message=messagesFor(s,'harriet','mason').at(-1)
  assert.equal(message.scriptId,'welcome');assert.deepEqual(message.releaseFormIds,['release-ava','release-jordan'])
  assert.equal(s.drafts[key('harriet','mason')].text,'Retained draft')
  s=reduce(s,{type:'COPY_DRAFT',messageId:message.id});assert.equal(s.drafts[key('harriet','mason')].scriptId,'welcome')
  s=reduce(s,{type:'ADD_SCRIPT_MESSAGE',messageId:message.id});assert.deepEqual(s.scripts.at(-1).releaseFormIds,['release-ava','release-jordan'])
})
test('unavailable forms cannot be sent or tagged and editing sent forms is isolated from the composer',()=>{
  let s=seed();const before=messagesFor(s,'harriet','mason').length
  s=send(s,{...emptyDraft(),text:'Unavailable form',releaseFormIds:['release-casey']});assert.equal(messagesFor(s,'harriet','mason').length,before)
  s=send(s,{...emptyDraft(),text:'Valid form',releaseFormIds:['release-ava']});const message=messagesFor(s,'harriet','mason').at(-1)
  s=reduce(s,{type:'PATCH_DRAFT',payload:{text:'Separate draft',creatorTags:['maya'],releaseFormIds:['release-sam']}})
  s=reduce(s,{type:'SET_MESSAGE_TAGS',messageId:message.id,payload:{creatorTags:['grace'],releaseFormIds:['release-jordan','release-casey']}})
  assert.deepEqual(messagesFor(s,'harriet','mason').at(-1).releaseFormIds,['release-jordan'])
  assert.deepEqual(s.drafts[key('harriet','mason')].releaseFormIds,['release-sam'])
  s=reduce(s,{type:'SET_MESSAGE_TAGS',messageId:message.id,payload:['maya']});assert.deepEqual(messagesFor(s,'harriet','mason').at(-1).releaseFormIds,['release-jordan'])
})
test('media information edits are scoped, normalized and restored without replacing user changes',()=>{
  let s=seed();const other=structuredClone(s.media.find(media=>media.id==='studio'))
  s=reduce(s,{type:'PATCH_MEDIA',payload:{id:'coast',notes:'Custom media note',tags:[' Sea ','Sea','','New'],category:' New collection ',price:19.995,creatorTags:['maya','maya','unknown']}})
  s=restoreState(JSON.parse(JSON.stringify(s)))
  assert.deepEqual(s.media.find(media=>media.id==='coast').tags,['Sea','New'])
  assert.equal(s.media.find(media=>media.id==='coast').notes,'Custom media note')
  assert.equal(s.media.find(media=>media.id==='coast').category,'New collection')
  assert.equal(s.media.find(media=>media.id==='coast').price,20)
  assert.deepEqual(s.media.find(media=>media.id==='coast').creatorTags,['maya'])
  s=reduce(s,{type:'PATCH_MEDIA',payload:{id:'coast',category:'  ',price:1000,creatorTags:['unknown']}})
  assert.equal(s.media.find(media=>media.id==='coast').category,'New collection')
  assert.equal(s.media.find(media=>media.id==='coast').price,20)
  assert.deepEqual(s.media.find(media=>media.id==='coast').creatorTags,[])
  assert.deepEqual(s.media.find(media=>media.id==='studio'),other)
})
test('campaign validation rejects invalid PPV and schedules and excludes unavailable recipients',()=>{
  let s=seed();const draft={...emptyDraft(),text:'Valid message'}
  for(const payload of [{draft:{...draft,price:1}},{draft:{...draft,price:12,lockedText:false}},{scheduledAt:Date.now()-60000},{type:'auto'}]){
    const count=s.campaigns.length;s=reduce(s,{type:'CREATE_CAMPAIGN',payload:{title:'Invalid send',type:'mass',fanIds:['mason'],draft,...payload}});assert.equal(s.campaigns.length,count)
  }
  s=reduce(s,{type:'PATCH_FAN',fanId:'riley',payload:{blocked:true}})
  s=reduce(s,{type:'CREATE_CAMPAIGN',payload:{title:'Qualified recipients',type:'mass',fanIds:['riley','mason'],draft}})
  assert.deepEqual(s.campaigns.at(-1).fanIds,['mason'])
})

await server.close()
