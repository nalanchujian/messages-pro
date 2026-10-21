import { t } from './i18n'
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { Context as ReactContext, Dispatch, ReactNode } from 'react'
import { createSeed } from './seed'
import { demoReducer, restoreState, serializeState } from './engine'
import { emptyDraft, key } from './types'
import type { Action, DemoState } from './types'
import { previewAlarm } from './chatTools'
export { selectFans, fanMetrics, fanSignals, canWithdrawMessage, messagesFor, money, relativeTime, displayName, latestMessage } from './engine'

export { selectOnlineFans, normalizeAudience } from './audience'

export const DEMO_STORAGE_KEY='messages-pro-infloww-demo-v1'
function initial(){try{return restoreState(JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY)??'null'))??createSeed()}catch{return createSeed()}}
function useModel(){
  const [state,dispatch]=useReducer(demoReducer,undefined,initial)
  const [now,setNow]=useState(Date.now()+state.clockOffset)
  const [toast,setToast]=useState('')
  const lastFeedbackId=useRef(state.feedback?.id)
  const completedReminders=useRef(new Set(state.tasks.filter(task=>task.status==='done').map(task=>task.id)))
  const countdownActive=state.tasks.some(task=>(task.kind==='reminder'||task.kind==='timed')&&task.status==='pending')
  const notify=useCallback((text:string)=>setToast(text),[])
  useEffect(()=>{try{localStorage.setItem(DEMO_STORAGE_KEY,serializeState(state))}catch{setToast(t('ui.402'))}},[state])
  useEffect(()=>{if(state.feedback&&state.feedback.id!==lastFeedbackId.current){lastFeedbackId.current=state.feedback.id;setToast(state.feedback.text)}},[state.feedback?.id])
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),4200);return()=>clearTimeout(t)},[toast])
  useEffect(()=>{for(const task of state.tasks){if(task.kind==='reminder'&&task.status==='done'&&!completedReminders.current.has(task.id)){completedReminders.current.add(task.id);previewAlarm(task.alarmSound??'audio1')}}},[state.tasks])
  useEffect(()=>{const tick=()=>{const at=Date.now()+state.clockOffset;setNow(at);dispatch({type:'TICK',payload:at})};tick();const t=setInterval(tick,countdownActive?1000:15000);const visible=()=>{if(!document.hidden)tick()};document.addEventListener('visibilitychange',visible);return()=>{clearInterval(t);document.removeEventListener('visibilitychange',visible)}},[state.clockOffset,countdownActive])
  const creator=state.creators.find(c=>c.id===state.activeCreatorId)!
  const workspace=state.workspaces[creator.id]
  const fan=state.fans[creator.id]?.find(f=>f.id===workspace.activeFanId)
  const draft=fan?state.drafts[key(creator.id,fan.id)]??emptyDraft():emptyDraft()
  // Actions can create messages between clock ticks; eligibility must use the current clock.
  const currentNow=Math.max(now,Date.now()+state.clockOffset)
  return {state,dispatch,creator,workspace,fan,draft,now:currentNow,notify,toast}
}
type Model = ReturnType<typeof useModel>
const Context:ReactContext<Model|null>=import.meta.hot?.data.demoContext??createContext<Model|null>(null)
if(import.meta.hot)import.meta.hot.data.demoContext=Context
export function DemoProvider({children}:{children:ReactNode}){const model=useModel();return <Context.Provider value={model}>{children}</Context.Provider>}
export function useDemo(){const model=useContext(Context);if(!model)throw new Error('DemoProvider is required');return model}
