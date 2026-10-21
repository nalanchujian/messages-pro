import { sample } from './i18n'
import { emptyDraft, key } from './types'
import type { Creator, DemoState, Fan, Media, Message, ReleaseForm } from './types'

function illustration(title: string, a: string, b: string, scene: number) {
  const shapes = scene % 2 ? '<circle cx="310" cy="110" r="70" fill="#ffffff" opacity=".35"/><path d="M0 250 Q170 100 360 245 T720 210 V480 H0Z" fill="#ffffff" opacity=".25"/><path d="M0 310 Q260 200 400 330 T720 280 V480 H0Z" fill="#163a5a" opacity=".4"/>' : '<rect x="65" y="65" width="270" height="310" rx="140" fill="#fff" opacity=".16"/><circle cx="500" cy="270" r="160" fill="#fff" opacity=".16"/><path d="M120 335 L340 135 L500 335" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>'
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 480"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="720" height="480" fill="url(#g)"/>${shapes}<text x="38" y="415" font-family="sans-serif" fill="white" font-size="31">${title}</text><text x="40" y="449" font-family="sans-serif" fill="white" opacity=".6" font-size="14">Demo art · Original illustration</text></svg>`)
}
export function initialMedia(): Media[] {
  const defs = [['coast',sample('sample.01'),'#6a9bc0','#16395a',sample('sample.02'),18],['studio',sample('sample.03'),'#b7a9db','#625a88',sample('sample.04'),24],['morning',sample('sample.05'),'#e6b885','#9e634f',sample('sample.06'),12],['garden',sample('sample.07'),'#9ab9a3','#345d55',sample('sample.06'),16],['blue',sample('sample.08'),'#607bad','#263a5d',sample('sample.04'),22],['weekend',sample('sample.09'),'#daaf99','#8b596c',sample('sample.02'),20]] as const
  const base = import.meta.env?.BASE_URL ?? '/messages-pro/'
  const images: Media[] = defs.map((a,i)=>({id:a[0],title:a[1],type:'image',url:illustration(a[1],a[2],a[3],i),category:a[4],tags:[a[4],sample('sample.10')],price:a[5],creatorTags:[],notes:`Original ${a[0]} collection. Available for message bundles.`}))
  images.push(...[['city','City lights','#9787bb','#33405a'],['sunset','Sunset walk','#d69c6c','#7f596b']].map(([id,title,a,b],index):Media=>({id,title,type:'image',url:illustration(title,a,b,index),category:'Travel',tags:['Travel','Collection'],price:20,creatorTags:[],notes:`Original ${title.toLowerCase()} collection.`})))
  return images.concat([
    {id:'audio-ambient-demo',title:'Ambient audio demo',type:'audio',url:`${base}infloww-media/ambient-demo.wav`,category:'Audio',tags:['Audio'],price:0,creatorTags:[],duration:3},
    {id:'audio-chime-demo',title:'Chime audio demo',type:'audio',url:`${base}infloww-media/chime-demo.wav`,category:'Audio',tags:['Audio'],price:0,creatorTags:[],duration:5},
    {id:'gif-wave',title:sample('sample.11'),type:'gif',url:`${base}infloww-media/hello.gif`,category:'GIF',tags:[sample('sample.11'),sample('sample.12')],price:0,creatorTags:[]},
    {id:'gif-spark',title:sample('sample.13'),type:'gif',url:`${base}infloww-media/thanks.gif`,category:'GIF',tags:[sample('sample.13'),sample('sample.14')],price:0,creatorTags:[]},
  ]).concat(['happy','love','wow','laugh','party','cool'].map((name):Media => ({id:`gif-${name}`,title:sample(`gifSample.${name}`),type:'gif',url:`${base}infloww-media/${name}.gif`,category:'GIF',tags:[name,sample(`gifSample.${name}`)],price:0,creatorTags:[]}))).map((item,index) => ({ ...item, createdAt: Date.now() - index * 86400000 }))
}

export function initialReleaseForms(now=Date.now()):ReleaseForm[]{return [
  {id:'release-ava',name:'Ava Reed',status:'approved',type:'document',createdAt:now-86400000},
  {id:'release-sam',name:'Sam Parker',status:'signed',type:'link',createdAt:now-172800000},
  {id:'release-jordan',name:'Jordan Lee',status:'pending',type:'link',createdAt:now-3600000},
  {id:'release-casey',name:'Casey Morgan',status:'declined',type:'document',createdAt:now-259200000},
]}

export function createSeed(now = Date.now()): DemoState {
  const creators: Creator[] = [
    {id:'harriet',name:'Harriet_001',avatar:'H',color:'#758cc5',notes:sample('sample.15'),defaultNickname:sample('sample.16'),splitEnabled:true,inboxCount:3,lists:[{id:'vip',name:sample('sample.17'),pinned:true},{id:'new',name:sample('sample.18'),pinned:false},{id:'travel',name:sample('sample.19'),pinned:true}],autoChatEnabled:true},
    {id:'maya',name:'Maya Studio',avatar:'M',color:'#a98cad',notes:sample('sample.20'),defaultNickname:sample('sample.21'),splitEnabled:false,inboxCount:2,lists:[{id:'vip',name:sample('sample.22'),pinned:true},{id:'studio',name:sample('sample.23'),pinned:true}],autoChatEnabled:false},
    {id:'grace',name:'Grace',avatar:'G',color:'#84a895',notes:sample('sample.24'),defaultNickname:sample('sample.21'),splitEnabled:true,inboxCount:2,lists:[{id:'vip',name:sample('sample.25'),pinned:true},{id:'new',name:sample('sample.18'),pinned:true}],autoChatEnabled:false},
  ]
  const state: DemoState = {version:1,activeCreatorId:'harriet',openCreatorIds:['harriet','maya'],creators,fans:{},messages:{},drafts:{},workspaces:{},media:initialMedia(),scripts:[
    {id:'welcome',title:sample('sample.26'),category:sample('sample.27'),text:sample('sample.28'),attachments:[],price:0,creatorTags:[]},
    {id:'thanks',title:sample('sample.29'),category:sample('sample.30'),text:sample('sample.31'),attachments:[],price:0,creatorTags:[]},
    {id:'preview',title:sample('sample.32'),category:'PPV',text:sample('sample.33'),attachments:[{mediaId:'coast',free:false},{mediaId:'morning',free:true}],price:18,creatorTags:[]},
    {id:'followup',title:sample('sample.34'),category:sample('sample.35'),text:sample('sample.36'),attachments:[],price:0,creatorTags:[]},
  ],releaseForms:initialReleaseForms(now),transactions:[],notifications:[],tasks:[],campaigns:[],role:'admin',clockOffset:0,emojis:['😊','💜','✨','🌊','☀️','🥰','💕','😉'],simulateFailure:false}
  state.scripts.forEach(script=>{script.founder='Alex';script.note='Use a friendly tone and personalize before sending.';script.createdAt=now-86400000})
  state.scripts.find(script=>script.id==='preview')!.attachments.push({mediaId:'garden',free:false},{mediaId:'blue',free:false})
  const names=[['mason','Mason Brooks','mason.b','M'],['riley','Riley Parker','riley_p','R'],['leo','Leo Carter','leo.carter','L'],['nate','Nate Wilson','natew','N'],['emma','Emma Rivers','emma.r','E'],['alex','Alex Martin','alex_m','A']] as const
  creators.forEach((creator,ci)=>{
    state.fans[creator.id]=names.map((n,i):Fan=>({id:n[0],name:n[1],handle:'@'+n[2],avatar:n[3],color:['#b79e87','#809dae','#b8a6bc','#91a795','#a7b3cd','#c5a796'][i],isCreator:i===1,online:[0,1,4].includes(i),unread:[1,3,4].includes(i),priority:i===0||i===1,muted:i===5,restricted:false,blocked:false,hidden:false,cleared:false,inboxId:(i%creator.inboxCount)+1,listIds:i===0?['vip']:i===4?['new']:i===2?['travel']:[],subscribedAt:now-(i===4?2:30*(i+1))*86400000,subscriptionStatus:i===3?'expired':i===4?'free':i===5?'trial':'active',subscriptionPrice:9.99,subscriptionLabel:i===4?sample('sample.37'):sample('sample.65', [i+1]),renew:i!==3&&i!==5,country:i===3?sample('sample.38'):sample('sample.39'),timeZone:i===3?'Europe/London':'America/Los_Angeles',source:['Instagram',sample('sample.40'),sample('sample.41'),sample('sample.42'),'Instagram',sample('sample.41')][i],nickname:i===0?'Mason':'',birthday:i===0?'1995-06-15':'',notes:[sample('sample.43'),sample('sample.44'),sample('sample.45'),sample('sample.46'),sample('sample.47'),sample('sample.48')][i],lastSeenAt:now-(i+1)*3600000,aiAssigned:i===5&&!!creator.autoChatEnabled,creatorSubscribed:i!==3}))
    state.fans[creator.id].forEach((fan,i)=>{
      fan.organizationSpendingPower=i===0?'high':i===1?'medium':i===2?'low':'insufficient'
      fan.chargebackRisk=i===1?'medium':i===2?'low':'unknown'
      fan.subscriptionExpiresAt=now+(fan.subscriptionStatus==='expired'?-10:10+i)*86400000
      const t=now-(i+1)*900000-ci*1000
      const m=(id:string,text:string,direction:'inbound'|'outbound',at:number):Message=>({id:creator.id+'-'+fan.id+'-'+id,creatorId:creator.id,fanId:fan.id,text,createdAt:at,direction,status:direction==='outbound'?'read':'sent',attachments:[],price:0,lockedText:true,creatorTags:[],format:emptyDraft().format,liked:false,pinned:false,viewed:false,sender:direction==='outbound'?'Alex':fan.name,source:'manual'})
      const entries=[m('1',sample('sample.49'),'outbound',t-7200000),m('2',sample('sample.50'),'inbound',t-7100000),m('3',sample('sample.51'),'outbound',t-7000000)]
      const ppv=m('ppv',sample('sample.52'),'outbound',t-3600000);ppv.attachments=[{mediaId:'coast',free:false},{mediaId:'morning',free:true}];ppv.price=18+i;ppv.viewed=i!==4;if([0,2,5].includes(i))ppv.purchasedAt=t-3500000
      ppv.scriptId='preview'
      if(i===0){entries[1].pinned=true;const bundle=m('bundle','A complete travel collection.','outbound',now-5*86400000);bundle.price=32;bundle.attachments=state.media.filter(media=>media.type==='image').map(media=>({mediaId:media.id,free:false}));entries.unshift(bundle)}
      entries.push(ppv,m('last',[sample('sample.53'),sample('sample.54'),sample('sample.55'),sample('sample.56'),sample('sample.57'),sample('sample.58')][i],'inbound',t))
      state.messages[key(creator.id,fan.id)]=entries
      state.transactions.push({id:'tip-'+creator.id+fan.id,creatorId:creator.id,fanId:fan.id,kind:'tip',amount:i===0?120:i===2?15:i===4?0:5,at:t-86400000},{id:'sub-'+creator.id+fan.id,creatorId:creator.id,fanId:fan.id,kind:'subscription',amount:9.99,at:t-172800000})
      if(ppv.purchasedAt)state.transactions.push({id:'tx-'+ppv.id,creatorId:creator.id,fanId:fan.id,kind:'ppv',amount:ppv.price,at:ppv.purchasedAt,messageId:ppv.id})
      state.drafts[key(creator.id,fan.id)]=emptyDraft()
    })
    state.workspaces[creator.id]={activeFanId:'mason',openFanIds:['mason'],pinnedFanIds:[],activePinnedFanId:null,homeFanId:'mason',search:'',view:'all',extraFilter:'all',sort:'newest',inboxIds:[],focus:false,focusOrder:[],heldFanIds:[],listScroll:0,chatScroll:{},hideMuted:false,hideAI:false,aiFilter:'include'}
    state.notifications.push({id:creator.id+'-notification-tip',creatorId:creator.id,fanId:'mason',kind:'tip',title:sample('sample.59'),text:sample('sample.60'),at:now-2400000,unread:true},{id:creator.id+'-notification-sub',creatorId:creator.id,fanId:'emma',kind:'subscription',title:sample('sample.61'),text:sample('sample.62'),at:now-5400000,unread:true},{id:creator.id+'-notification-buy',creatorId:creator.id,fanId:'leo',kind:'purchase',title:sample('sample.63'),text:sample('sample.64'),at:now-7200000,unread:false})
  })
  addFanLabelExamples(state, now)
  return state
}

// Additive fixtures preserve saved conversations and demonstrate each visible status.
export function addFanLabelExamples(state: DemoState, now = Date.now()) {
  state.creators.forEach(creator => {
    const base = state.fans[creator.id]?.[0]
    if (!base) return
    const examples = [
      { id: 'demo-verified', name: 'Serene 🤍', verified: true, aiStatus: undefined, status: 'active', age: 1 },
      { id: 'demo-ai', name: 'Camila', verified: true, aiStatus: 'active', status: 'free', age: 2 },
      { id: 'demo-paused', name: 'Liam Hou', verified: false, aiStatus: 'paused', status: 'active', age: 4 },
      { id: 'demo-human', name: 'Sezai', verified: false, aiStatus: 'needs-human', status: 'active', age: 5 },
      { id: 'demo-expired', name: 'Harris Wei', verified: false, aiStatus: 'active', status: 'expired', age: 6 },
      { id: 'demo-cold', name: 'Custom name (Josh S)', verified: false, aiStatus: 'paused', status: 'active', age: 7 },
    ] as const
    examples.forEach((item, index) => {
      if (state.fans[creator.id].some(fan => fan.id === item.id)) return
      const fan: Fan = { ...structuredClone(base), id: item.id, name: item.name, handle: '@' + item.id.replace('demo-', ''), avatar: item.name[0], verified: item.verified, aiAssigned: !!item.aiStatus, aiStatus: item.aiStatus, online: index === 0 || index === 1, unread: index === 1, muted: index === 0, priority: false, nickname: '', notes: '', listIds: [], inboxId: index % creator.inboxCount + 1, subscribedAt: now - (index === 1 ? 2 : 90) * 86400000, subscriptionStatus: item.status, renew: index !== 3, subscriptionExpiresAt: now + (index === 4 ? -1 : 30) * 86400000 }
      state.fans[creator.id].push(fan)
      const draft = emptyDraft()
      state.drafts[key(creator.id, fan.id)] = draft
      state.messages[key(creator.id, fan.id)] = [{ id: creator.id + '-' + item.id, creatorId: creator.id, fanId: fan.id, text: 'Hi 👋', createdAt: now - item.age * 86400000, direction: 'inbound', status: 'sent', attachments: index === 1 ? [{ mediaId: 'coast', free: true }] : [], price: 0, lockedText: false, creatorTags: [], format: draft.format, liked: false, pinned: false, viewed: false, sender: fan.name, source: 'manual' }]
      if (index === 5) state.transactions.push({ id: creator.id + '-demo-cold-tip', creatorId: creator.id, fanId: fan.id, kind: 'tip', amount: 73, at: now - 8 * 86400000 })
    })
  })
}
