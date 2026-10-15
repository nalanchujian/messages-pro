import { t } from './i18n'
import { useEffect, useState } from 'react'
import type { Media } from './types'

function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open('infloww-demo-media',1);request.onupgradeneeded=()=>request.result.createObjectStore('blobs');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
export async function saveMedia(file:File):Promise<Media>{
  if(!/^image\/|^video\/|^audio\//.test(file.type))throw new Error(t('ui.398'))
  if(file.size>30*1024*1024)throw new Error(t('ui.399'))
  const id='upload-'+crypto.randomUUID();const db=await database();await new Promise<void>((resolve,reject)=>{const tx=db.transaction('blobs','readwrite');tx.objectStore('blobs').put(file,id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close()
  return {id,title:file.name,type:file.type==='image/gif'?'gif':file.type.startsWith('video/')?'video':file.type.startsWith('audio/')?'audio':'image',category:t('ui.400'),tags:[t('ui.400')],price:0,creatorTags:[],uploaded:true}
}
async function readBlob(id:string){const db=await database();try{return await new Promise<Blob|undefined>((resolve,reject)=>{const request=db.transaction('blobs','readonly').objectStore('blobs').get(id);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}finally{db.close()}}
export function useMediaUrl(media:Media|undefined){
  const [url,setUrl]=useState(media?.url??'')
  useEffect(()=>{let active=true;let objectUrl='';setUrl(media?.url??'');if(media?.uploaded){readBlob(media.id).then(blob=>{if(!active||!blob)return;objectUrl=URL.createObjectURL(blob);setUrl(objectUrl)}).catch(()=>setUrl(''))}return()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}},[media?.id,media?.url,media?.uploaded])
  return url
}
