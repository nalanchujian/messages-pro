import { displaySample, LOCALE_STORAGE_KEY, setLocale, t, type Locale } from './i18n'
import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { ArrowLeft, Bell, Check, ChevronDown, FlaskConical, Grid2X2, Inbox, Languages, Maximize2, MessageSquare, Plus, RotateCcw, UserRound, X } from 'lucide-react'
import { DemoProvider, messagesFor, useDemo } from './store'
import { Avatar, IconButton, Modal } from './ui'
import InboxPanel from './InboxPanel'
import ChatPanel from './ChatPanel'
import InsightsPanel from './InsightsPanel'
import { WithdrawalDetailsDialog } from './AgencyNotifications'
import './shell.css'

function App(){
  const [locale,setUiLocale]=useState<Locale>(()=>{
    const saved=localStorage.getItem(LOCALE_STORAGE_KEY)
    const selected:Locale=saved==='zh'?'zh':'en'
    setLocale(selected)
    return selected
  })
  setLocale(locale)
  const changeLocale=(next:Locale)=>{
    setLocale(next)
    localStorage.setItem(LOCALE_STORAGE_KEY,next)
    setUiLocale(next)
    setLanguageMenu(false)
  }
  const featureGroups = [
    [t('ui.001'),t('ui.002')], [t('ui.003'),t('ui.004')],
    [t('ui.005'),t('ui.006')], [t('ui.007'),t('ui.008')],
    [t('ui.009'),t('ui.010')], [t('ui.011'),t('ui.012')],
  ]
  const {state,dispatch,creator,workspace,fan,now,toast,notify}=useDemo()
  const [agencyOpen,setAgencyOpen]=useState(false)
  const [notificationDetail,setNotificationDetail]=useState<string|null>(null)
  const [withdrawalAlert,setWithdrawalAlert]=useState<string|null>(null)
  const seenWithdrawals=useRef(new Set((state.withdrawals??[]).map(record=>record.id)))
  const unreadWithdrawals=(state.withdrawals??[]).filter(record=>!record.read).length
  const alertRecord=state.withdrawals?.find(record=>record.id===withdrawalAlert)
  function openAgency(id:string|null=null){if(!id){notify(t('navigation.page',[t('withdrawal.center')]));return}setNotificationDetail(id);setAgencyOpen(true);setWithdrawalAlert(null)}
  useEffect(()=>{
    const fresh=(state.withdrawals??[]).filter(record=>!seenWithdrawals.current.has(record.id))
    fresh.forEach(record=>seenWithdrawals.current.add(record.id))
    if(state.role==='admin'&&fresh.length)setWithdrawalAlert(fresh[0].id)
    if(state.role!=='admin'){setAgencyOpen(false);setWithdrawalAlert(null)}
  },[state.withdrawals,state.role])
  useEffect(()=>{if(!withdrawalAlert)return;const timer=setTimeout(()=>setWithdrawalAlert(null),10000);return()=>clearTimeout(timer)},[withdrawalAlert])
  const [picker,setPicker]=useState(false)
  const [controls,setControls]=useState(false)
  const [features,setFeatures]=useState(false)
  const [resetConfirm,setResetConfirm]=useState(false)
  const [mobile,setMobile]=useState<'inbox'|'chat'|'insights'>('chat')
  const [compactInsights,setCompactInsights]=useState(false)
  const [sfw,setSfw]=useState(()=>localStorage.getItem('infloww-demo-sfw')==='true')
  const [languageMenu,setLanguageMenu]=useState(false)
  const [draggingFanTab,setDraggingFanTab]=useState<string|null>(null)
  const [draggingCreatorTab,setDraggingCreatorTab]=useState<string|null>(null)
  useEffect(()=>{
    const dismiss=(event:PointerEvent)=>{const target=event.target as HTMLElement;if(!target.closest('.if-creator-add'))setPicker(false);if(!target.closest('.if-language-anchor'))setLanguageMenu(false)}
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setPicker(false);setLanguageMenu(false)}}
    document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',escape)
    return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape)}
  },[])
  useEffect(()=>{
    localStorage.setItem('infloww-demo-sfw',String(sfw))
  },[sfw])
  useEffect(()=>{
    const shortcut=(event:KeyboardEvent)=>{
      if((event.metaKey||event.ctrlKey)&&event.shiftKey&&event.key.toLowerCase()==='s'){
        event.preventDefault();setSfw(value=>!value)
      }
    }
    window.addEventListener('keydown',shortcut)
    return()=>window.removeEventListener('keydown',shortcut)
  },[])
  useEffect(() => {
    document.documentElement.lang=locale==='zh'?'zh-CN':'en'
    document.title=t('ui.401')
  }, [locale])
  useEffect(()=>{setMobile('chat');setCompactInsights(false)},[creator.id,fan?.id])
  const allPending=state.tasks.filter(t=>t.status==='pending').length+state.campaigns.filter(c=>c.status==='scheduled').length
  return <div className="if-app" key={locale} data-mobile={mobile} data-sfw={sfw}>
    <header className="if-app-bar">
      <a className="if-brand" href={`${import.meta.env.BASE_URL}`} onClick={event=>{event.preventDefault();notify(t('navigation.page',[t('ui.013')]))}} title={t('ui.013')}><span className="if-brand-mark">i</span><span>infloww<span className="if-demo-tag">{t('ui.014')}</span></span></a>
      <div className="if-creator-tabs" role="tablist" aria-label={t('ui.015')}>
        {state.openCreatorIds.map((id,index)=>{const c=state.creators.find(c=>c.id===id)!;const count=state.fans[id].filter(f=>f.unread&&!f.cleared).length;return <div className={'if-creator-tab'+(id===creator.id?' active':'')} key={id} draggable onDragStart={event=>{event.dataTransfer.setData('text/plain',id);event.dataTransfer.effectAllowed='move';setDraggingCreatorTab(id)}} onDragEnd={()=>setDraggingCreatorTab(null)} onDragOver={event=>{event.preventDefault();event.dataTransfer.dropEffect='move'}} onDrop={event=>{event.preventDefault();if(draggingCreatorTab)dispatch({type:'MOVE_CREATOR_TAB',payload:{id:draggingCreatorTab,targetId:id}});setDraggingCreatorTab(null)}}><button role="tab" aria-selected={id===creator.id} aria-label={t('ui.016', [c.name])} onClick={()=>dispatch({type:'SET_ACTIVE_CREATOR',payload:id})} onKeyDown={event=>{if(event.altKey&&(event.key==='ArrowLeft'||event.key==='ArrowRight')){event.preventDefault();const target=state.openCreatorIds[index+(event.key==='ArrowLeft'?-1:1)];if(target)dispatch({type:'MOVE_CREATOR_TAB',payload:{id,targetId:target}})}}}><Avatar name={c.avatar} color={c.color} size={25}/><span>{c.name}</span>{count>0&&<b>{count}</b>}</button><IconButton label={t('ui.017', [c.name])} onClick={()=>dispatch({type:'CLOSE_CREATOR',payload:id})}><X size={12}/></IconButton></div>})}
        <div className="if-creator-add"><button className="if-add-creator-button" aria-expanded={picker} onClick={()=>setPicker(!picker)}><Plus size={19}/><span>{t('ui.018')}</span></button>{picker&&<div className="if-creator-picker"><strong>{t('ui.019')}</strong>{state.creators.map(c=><button key={c.id} onClick={()=>{dispatch({type:'OPEN_CREATOR',payload:c.id});setPicker(false)}}><Avatar name={c.avatar} color={c.color} size={26}/><span>{c.name}</span>{state.openCreatorIds.includes(c.id)&&<Check size={14}/>}</button>)}</div>}</div>
      </div>
      <div className="if-header-actions">{state.role==='admin'&&<button className="if-icon-button if-agency-bell" aria-label={t('withdrawal.center')} title={t('withdrawal.center')} onClick={()=>openAgency()}><Bell size={18}/>{unreadWithdrawals>0&&<b>{unreadWithdrawals}</b>}</button>}<button className="if-sfw-toggle" role="switch" aria-checked={sfw} aria-label={t('ui.020')} title={t('ui.021')} onClick={()=>setSfw(!sfw)}><span>{t('ui.022')}</span><i/></button><div className="if-language-anchor"><button className="if-language-button" aria-label={t('ui.023')} aria-expanded={languageMenu} onClick={()=>setLanguageMenu(!languageMenu)}><Languages size={18}/><ChevronDown size={15}/></button>{languageMenu&&<div className="if-language-menu"><strong>{t('ui.023')}</strong><button onClick={()=>changeLocale('en')} aria-pressed={locale==='en'}>{t('interface.389')}{locale==='en'&&<Check size={15}/>}</button><button onClick={()=>changeLocale('zh')} aria-pressed={locale==='zh'}>{t('ui.024')}{locale==='zh'&&<Check size={15}/>}</button></div>}</div><IconButton label={t('ui.025')} onClick={async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.if-app')?.requestFullscreen()}catch{notify(t('ui.026'))}}}><Maximize2 size={18}/></IconButton><button onClick={()=>setFeatures(true)} className="if-quiet-button if-feature-entry" title={t('ui.027')}>{t('ui.027')}</button><button className="if-control-entry" aria-label={t('ui.028')} title={t('ui.028')} onClick={()=>setControls(true)}><FlaskConical size={17}/>{allPending>0&&<b>{allPending}</b>}</button></div>
    </header>
    <div className="if-workspace-shell">
      <div className="if-workspace-caption"><div className="if-top-fan-tabs" role="tablist" aria-label={t('ui.029')}><button className={'if-home-tab'+(workspace.activePinnedFanId?'':' active')} role="tab" aria-selected={!workspace.activePinnedFanId} onClick={()=>dispatch({type:'SELECT_HOME_TAB',creatorId:creator.id})}><Grid2X2 size={15}/><b>{t('ui.030')}</b></button>{(workspace.pinnedFanIds??[]).map((id,index)=>{const item=state.fans[creator.id]?.find(value=>value.id===id);if(!item)return null;return <div className={'if-top-fan-tab'+(workspace.activePinnedFanId===id?' active':'')} key={id} draggable onDragStart={event=>{event.dataTransfer.setData('text/plain',id);event.dataTransfer.effectAllowed='move';setDraggingFanTab(id)}} onDragEnd={()=>setDraggingFanTab(null)} onDragOver={event=>{event.preventDefault();event.dataTransfer.dropEffect='move'}} onDrop={event=>{event.preventDefault();if(draggingFanTab)dispatch({type:'MOVE_FAN_TAB',creatorId:creator.id,fanId:draggingFanTab,payload:{targetId:id}});setDraggingFanTab(null)}}><button role="tab" aria-selected={workspace.activePinnedFanId===id} aria-label={t('ui.031', [item.name])} onClick={()=>{dispatch({type:'SELECT_FAN_TAB',creatorId:creator.id,fanId:id});setMobile('chat')}} onKeyDown={event=>{if(event.altKey&&(event.key==='ArrowLeft'||event.key==='ArrowRight')){event.preventDefault();const target=(workspace.pinnedFanIds??[])[index+(event.key==='ArrowLeft'?-1:1)];if(target)dispatch({type:'MOVE_FAN_TAB',creatorId:creator.id,fanId:id,payload:{targetId:target}})}}}><Avatar name={item.avatar} color={item.color} size={18}/><span>{item.name}</span>{item.unread&&<i aria-label={t('ui.032')}/>}</button><IconButton label={t('ui.033', [item.name])} onClick={()=>dispatch({type:'CLOSE_FAN_TAB',creatorId:creator.id,fanId:id})}><X size={12}/></IconButton></div>})}</div><div className="if-caption-controls"><button onClick={()=>setCompactInsights(true)} className="if-show-insights"><UserRound size={14}/>{t('ui.034')}</button></div></div>
    <nav className="if-mobile-nav" aria-label={t('ui.035')}><button className={mobile==='inbox'?'active':''} onClick={()=>setMobile('inbox')}><Inbox size={15}/>{t('ui.036')}</button><button className={mobile==='chat'?'active':''} onClick={()=>setMobile('chat')}><MessageSquare size={15}/>{t('ui.037')}</button><button className={mobile==='insights'?'active':''} onClick={()=>setMobile('insights')}><UserRound size={15}/>{t('ui.038')}</button></nav>
    <main className="if-three-columns">
      <div className="if-left-region"><InboxPanel/></div>
      <div className="if-middle-region"><ChatPanel/></div>
      <div className={'if-right-region'+(compactInsights?' drawer-open':'')}><div className="if-drawer-title"><strong>{t('ui.034')}</strong><IconButton label={t('ui.039')} onClick={()=>setCompactInsights(false)}><X size={16}/></IconButton></div><InsightsPanel/></div>
      {compactInsights&&<button className="if-drawer-backdrop" aria-label={t('ui.040')} onClick={()=>setCompactInsights(false)}/>}
    </main>
    </div>
    {agencyOpen&&notificationDetail&&state.role==='admin'&&<WithdrawalDetailsDialog id={notificationDetail} onClose={()=>setAgencyOpen(false)}/>}
    {alertRecord&&state.role==='admin'&&<aside className="if-withdrawal-alert" role="status"><header><strong>{t('withdrawal.title')}</strong><IconButton label={t('ui.395')} onClick={()=>setWithdrawalAlert(null)}><X size={14}/></IconButton></header><p>{t('withdrawal.summary',[alertRecord.withdrawnBy,alertRecord.creatorName,alertRecord.fanName])}</p><button onClick={()=>openAgency(alertRecord.id)}>{t('withdrawal.viewDetails')}</button></aside>}
    <footer className="if-app-footer"><span><i/>{t('ui.041')}</span><span>{state.role==='admin'?t('ui.042'):t('ui.043')}<span className="if-footer-divider"/> <a href={`${import.meta.env.BASE_URL}`} onClick={event=>{event.preventDefault();notify(t('navigation.page',[t('ui.044')]))}}>{t('ui.044')} <ArrowLeft size={10}/></a></span></footer>
    {toast&&<div className="if-toast" role="status"><Check size={14}/>{toast}</div>}
    {controls&&<Modal title={t('ui.028')} onClose={()=>setControls(false)} wide>
      <div className="if-demo-control-head"><FlaskConical size={23}/><div><strong>{t('ui.045')}</strong><p>{t('ui.046')}</p></div></div>
      <div className="if-control-grid"><label>{t('ui.047')}<select aria-label={t('ui.047')} value={state.role} onChange={e=>dispatch({type:'ROLE',payload:e.target.value})}><option value="admin">{t('ui.048')}</option><option value="chatter">{t('ui.049')}</option></select></label><label className="if-check-label"><input type="checkbox" checked={state.simulateFailure} onChange={e=>dispatch({type:'FAILURE',payload:e.target.checked})}/>{t('ui.050')}</label></div>
      <h3 className="if-control-section-title">{t('ui.051')} {fan?.name??t('ui.052')}</h3><div className="if-event-buttons">{[['reply',t('ui.053')],['tip',t('ui.054')],['purchase',t('ui.055')],['subscription',t('ui.056')],['platform',t('ui.057')],['new-fan',t('ui.058')]] .map(([kind,label])=><button className="if-secondary" key={kind} disabled={!fan&&kind!=='new-fan'} onClick={()=>{dispatch({type:'SIMULATE',payload:{kind}});notify(t('ui.059', [label]))}}>{label}</button>)}</div>
      <h3 className="if-control-section-title">{t('ui.060')}</h3><div className="if-clock-row"><strong>{new Intl.DateTimeFormat(locale==='zh'?'zh-CN':'en-US',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(now)}</strong><span>UTC+8 · {allPending} {t('ui.061')}</span></div><div className="if-event-buttons">{[60,300,3600,86400].map(seconds=><button className="if-secondary" key={seconds} onClick={()=>dispatch({type:'ADVANCE_TIME',payload:seconds})}>{t('ui.062')} {seconds===60?t('ui.063'):seconds===300?t('ui.064'):seconds===3600?t('ui.065'):t('ui.066')}</button>)}</div><p className="if-control-note">{t('ui.067')}</p>
      <div className="if-pending-tasks">{state.tasks.filter(task=>task.status==='pending').map(task=><div key={task.id}><span>{state.creators.find(c=>c.id===task.creatorId)?.name} · {task.kind==='reminder'?t('ui.068'):t('ui.069')}<small>{(task.text ? displaySample(task.text) : '')||t('ui.070')}</small></span><button className="if-quiet-button" onClick={()=>dispatch({type:'CANCEL_TASK',payload:task.id})}>{t('ui.071')}</button></div>)}</div>
      <div className="if-control-reset"><button className="if-danger" onClick={()=>setResetConfirm(true)}><RotateCcw size={14}/>{t('ui.072')}</button><span>{t('ui.073')}</span></div>
    </Modal>}
    {features&&<Modal title={t('ui.074')} onClose={()=>setFeatures(false)} wide><div className="if-feature-list">{featureGroups.map(([title,text])=><section key={title}><Check size={16}/><div><h3>{title}</h3><p>{text}</p></div></section>)}</div><div className="if-feature-notes"><strong>{t('ui.075')}</strong><ol><li>{t('ui.076')}</li><li>{t('ui.077')}</li><li>{t('ui.078')}</li><li>{t('ui.079')}</li><li>{t('ui.080')}</li></ol><p>{t('ui.081')}</p></div></Modal>}
    {resetConfirm&&<Modal title={t('ui.082')} onClose={()=>setResetConfirm(false)}><p className="if-reset-text">{t('ui.083')}</p><div className="if-dialog-actions"><button className="if-secondary" onClick={()=>setResetConfirm(false)}>{t('ui.071')}</button><button className="if-danger" onClick={()=>{dispatch({type:'RESET'});setResetConfirm(false);setControls(false);notify(t('ui.084'))}}>{t('ui.085')}</button></div></Modal>}
  </div>
}
// Reuse the entry root when Vite updates imported demo state or data modules.
const demoRoot: Root = import.meta.hot?.data.inflowwRoot ?? createRoot(document.getElementById('infloww-demo')!)
if (import.meta.hot) import.meta.hot.data.inflowwRoot = demoRoot
demoRoot.render(<DemoProvider><App/></DemoProvider>)
