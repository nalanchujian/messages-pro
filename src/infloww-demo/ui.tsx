import { displaySample, t } from './i18n'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { Image, X } from 'lucide-react'
import type { Media } from './types'
import { useMediaUrl } from './mediaStorage'

function topOverlay(node:HTMLElement){
  const overlays=Array.from(document.querySelectorAll<HTMLElement>('dialog[open], [popover]:popover-open'))
  const top=overlays.at(-1)
  return !top||top===node||top.contains(node)
}

export function Modal({title,onClose,children,wide=false,width,closable=true,maskClosable=true,header=true,className=''}:{title:string,onClose:()=>void,children:ReactNode,wide?:boolean,width?:number,closable?:boolean,maskClosable?:boolean,header?:boolean,className?:string}){
  const ref=useRef<HTMLDialogElement>(null)
  useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close()},[])
  return <dialog ref={ref} className={`if-modal${wide?' if-modal-wide':''} ${className}`} style={width?{width:`min(${width}px, calc(100vw - 32px))`}:undefined} onCancel={e=>{e.preventDefault();e.stopPropagation();onClose()}} onClick={e=>{if(maskClosable&&e.target===e.currentTarget)onClose()}} aria-label={title}><div className="if-modal-surface">{header&&<header><h2>{title}</h2>{closable&&<IconButton label={t('ui.395')} onClick={onClose}><X size={18}/></IconButton>}</header>}<div className="if-modal-body">{children}</div></div></dialog>
}
export function AnchoredPopover({title,anchor,onClose,children,width=400,placement='top',className=''}:{title:string;anchor:HTMLElement|null;onClose:()=>void;children:ReactNode;width?:number;placement?:'top'|'bottom';className?:string}){
  const ref=useRef<HTMLDivElement>(null)
  const [position,setPosition]=useState<CSSProperties>({visibility:'hidden'})
  useLayoutEffect(()=>{
    const node=ref.current
    if(!node||!anchor)return
    node.showPopover()
    const place=()=>{
      const rect=anchor.getBoundingClientRect(),availableWidth=Math.min(width,window.innerWidth-24)
      const height=node.getBoundingClientRect().height
      const above=rect.top-10,below=window.innerHeight-rect.bottom-10
      const useTop=placement==='top'?above>=Math.min(height,240)||above>below:below<Math.min(height,240)&&above>below
      const maxHeight=Math.max(100,(useTop?above:below)-12)
      setPosition({width:availableWidth,maxHeight,left:Math.max(12,Math.min(rect.left,window.innerWidth-availableWidth-12)),top:useTop?Math.max(12,rect.top-Math.min(height,maxHeight)-10):rect.bottom+10,visibility:'visible'})
    }
    place()
    const observer=new ResizeObserver(place);observer.observe(node)
    window.addEventListener('resize',place);window.addEventListener('scroll',place,true)
    return()=>{observer.disconnect();window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);node.hidePopover()}
  },[anchor,width,placement])
  useEffect(()=>{
    const dismiss=(event:PointerEvent)=>{const node=ref.current;const modal=Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')).at(-1);if(modal&&node&&!modal.contains(node))return;if(!node?.contains(event.target as Node)&&!anchor?.contains(event.target as Node))onClose()}
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!event.defaultPrevented&&ref.current&&topOverlay(ref.current)){event.preventDefault();onClose();anchor?.focus()}}
    document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',escape)
    return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape)}
  },[anchor,onClose])
  return <div ref={ref} popover="manual" role="dialog" aria-label={title} className={`if-popover ${className}`} style={position}>{children}</div>
}
export function Tooltip({id,anchor,children}:{id:string;anchor:HTMLElement;children:ReactNode}){
  const ref=useRef<HTMLDivElement>(null)
  const [position,setPosition]=useState<CSSProperties>({visibility:'hidden'})
  useLayoutEffect(()=>{
    const node=ref.current
    if(!node)return
    node.showPopover()
    const place=()=>{
      const rect=anchor.getBoundingClientRect(),size=node.getBoundingClientRect()
      const right=rect.right+10
      setPosition({left:right+size.width<=window.innerWidth-8?right:Math.max(8,rect.left-size.width-10),top:Math.max(8,Math.min(rect.top,window.innerHeight-size.height-8)),visibility:'visible'})
    }
    place()
    window.addEventListener('resize',place);window.addEventListener('scroll',place,true)
    return()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);node.hidePopover()}
  },[anchor])
  return <div id={id} ref={ref} popover="manual" role="tooltip" className="if-fan-tag-tooltip" style={position}>{children}</div>
}
export function IconButton({label,children,onClick,disabled=false,active=false}:{label:string,children:ReactNode,onClick?:(event:MouseEvent<HTMLButtonElement>)=>void,disabled?:boolean,active?:boolean}){return <button type="button" className={'if-icon-button'+(active?' active':'')} aria-label={label} title={label} onClick={onClick} disabled={disabled}>{children}</button>}
export function Avatar({name,color='#8192b4',online=false,size=36}:{name:string,color?:string,online?:boolean,size?:number}){return <span className="if-avatar" style={{width:size,height:size,background:color}}>{name.slice(0,1).toUpperCase()}{online&&<i/>}</span>}
export function MediaView({media,compact=false}:{media:Media|undefined,compact?:boolean}){
  const url=useMediaUrl(media)
  if(!media)return <span className="if-media-missing">{t('ui.396')}</span>
  return <div className={'if-media-view'+(compact?' compact':'')}>{url?(media.type==='video'?<video src={url} controls={!compact} preload="metadata"/>:media.type==='audio'?<audio src={url} controls/>:<img src={url} alt={displaySample(media.title)} loading="lazy"/>):<span className="if-media-missing"><Image size={24}/>{media.uploaded?t('ui.397'):displaySample(media.title)}</span>}</div>
}
