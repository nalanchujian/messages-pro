import './value-playbook.css'
import { values, platforms, sources, sourceMap, pointCount, solutionCount, executiveSummary, frameworkScope, auditedAt, auditNote, buildMarkdown, type BusinessValue, type LandingPoint, type Solution, type EvidenceClaim } from './value-playbook-data'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
const sourceNumbers = new Map(sources.map((source, index) => [source.id, index + 1]))
const numbered = (index: number) => String(index + 1).padStart(2, '0')

function references(solution: Solution) {
  return solution.refs.map(ref => {
    const source = sourceMap.get(ref)!
    return `<a class="reference" href="#source-${source.id}" aria-label="来源 ${sourceNumbers.get(ref)}：${escape(source.title)}" title="${escape(source.title)}">[${sourceNumbers.get(ref)}]</a>`
  }).join(' ')
}

function evidenceClaim(claim: EvidenceClaim) {
  const source = sourceMap.get(claim.ref)!
  return `<li class="evidence-claim" data-source="${escape(claim.ref)}"><p>${escape(claim.text)}</p><a class="claim-source" href="${escape(source.url)}" target="_blank" rel="noopener noreferrer"><span>官方依据</span> ${escape(source.title)} <span class="source-section">· ${escape(claim.section)}</span> <span aria-hidden="true">↗</span></a></li>`
}

function solutionRow(solution: Solution) {
  const platform = platforms.find(item => item.id === solution.platform)!
  return `<tr data-platform="${platform.id}">
    <th scope="row"><span class="platform-name ${platform.id}">${platform.name}</span><span class="row-references"><span>官方资料</span>${references(solution)}</span></th>
    <td class="implementation-cell"><h4>${escape(solution.feature)}</h4><div class="current-implementation"><span class="cell-label">当前实现</span><ul class="implementation-claims">${solution.claims.map(evidenceClaim).join('')}</ul></div>${solution.limits.length ? `<div class="implementation-boundary"><span>资料限定</span><ul class="implementation-claims">${solution.limits.map(evidenceClaim).join('')}</ul></div>` : ''}</td>
  </tr>`
}

function landingPoint(point: LandingPoint, index: number, chapter: string) {
  return `<section class="landing-point" id="point-${point.id}" aria-labelledby="title-${point.id}">
    <header class="point-header"><p class="point-index">${chapter}.${index + 1}</p><h3 id="title-${point.id}">${escape(point.title)}</h3></header>
    <div class="point-context"><p class="point-problem"><strong>经营问题</strong><span>${escape(point.problem)}</span></p><p class="point-mechanism"><strong>经营作用</strong><span>${escape(point.mechanism)}</span></p></div>
    <p class="example"><strong>场景示例</strong><span>${escape(point.example)}</span></p>
    <div class="comparison-heading"><span>当前实现 · ${point.solutions.length} 家有直接资料依据</span><p class="point-owner">主要使用者 <span>${escape(point.owner)}</span></p></div>
    <div class="table-scroll comparison-scroll" role="region" tabindex="0" aria-label="${escape(point.title)}：有官方资料依据的实现"><table class="comparison-table"><caption class="sr-only">${escape(point.title)}的当前实现及对应官方依据</caption><colgroup><col class="platform-column"/><col class="implementation-column"/></colgroup><thead><tr><th scope="col">平台 / 资料</th><th scope="col">承载功能、实现方式与官方依据</th></tr></thead><tbody>${point.solutions.map(solutionRow).join('')}</tbody></table></div>
  </section>`
}

function chapter(value: BusinessValue, index: number) {
  const label = String(index + 1)
  return `<section class="value-chapter" data-value-kind="core" id="value-${value.id}" aria-labelledby="heading-${value.id}">
    <header class="chapter-header"><span class="chapter-number">${numbered(index)}</span><div><p class="chapter-kicker"><span class="value-tier-badge">核心价值</span><span>${escape(value.short)}</span></p><h2 id="heading-${value.id}">${escape(value.title)}</h2><p class="chapter-thesis">${escape(value.thesis)}</p></div></header>
    <div class="chapter-summary"><p><strong>分析范围</strong><span>${escape(value.scope)}</span></p></div>
    <nav class="point-toc" aria-label="${escape(value.short)}的具体落地点">${value.points.map((point, pointIndex) => `<a href="#point-${point.id}"><span class="toc-index">${label}.${pointIndex + 1}</span><span class="toc-title">${escape(point.title)}</span><i aria-hidden="true">↓</i></a>`).join('')}</nav>
    ${value.points.map((point, pointIndex) => landingPoint(point, pointIndex, label)).join('')}
  </section>`
}

$('framework-scope').textContent = frameworkScope
$('report-date').textContent = `更新于 ${auditedAt.replaceAll('-', '.')}`
$('point-count').textContent = `${pointCount} 个落地点`
$('audit-note').textContent = auditNote
$('executive-summary').innerHTML = `
  <div class="executive-conclusion"><h2 id="executive-summary-title">核心判断</h2><p>${escape(executiveSummary.conclusion)}</p></div>
  <div class="executive-perspectives">${executiveSummary.perspectives.map((item, index) => `<article><p class="perspective-number">${numbered(index)}</p><h3>${escape(item.title)}</h3><p class="perspective-text">${escape(item.text)}</p><nav aria-label="${escape(item.title)}的详细分析">${item.links.map(link => `<a href="#value-${link.id}">${escape(link.label)} <span aria-hidden="true">↗</span></a>`).join('')}</nav></article>`).join('')}</div>
  <div class="executive-implication"><h3>产品建设启示</h3><p>${escape(executiveSummary.implication)}</p></div>
`
$('overview-rows').innerHTML = values.map((value, index) => `<tr><th scope="row"><a href="#value-${value.id}"><span>${numbered(index)}</span><strong>${escape(value.short)}</strong><i aria-hidden="true">↗</i></a><p class="overview-description">${escape(value.thesis)}</p></th><td><ul>${value.points.map((point, pointIndex) => `<li><a href="#point-${point.id}"><span class="overview-point-index">${index + 1}.${pointIndex + 1}</span><span class="overview-point-title">${escape(point.title)}</span></a></li>`).join('')}</ul></td></tr>`).join('')
$('chapter-links').innerHTML = `<section class="nav-section" aria-label="核心价值"><p class="nav-section-label">核心价值<span>${values.length} 项</span></p>${values.map((value, index) => `<div class="nav-group" data-value="${value.id}"><a class="chapter-link" href="#value-${value.id}"><span>${numbered(index)}</span>${escape(value.short)}</a><div class="nav-points">${value.points.map(point => `<a href="#point-${point.id}">${escape(point.title)}</a>`).join('')}</div></div>`).join('')}</section>`
$('report').innerHTML = `<div class="report-part-heading"><span class="value-tier-badge">核心价值</span><p>五类核心产品价值 · 按业务对象展开</p></div>`
  + values.map((value, index) => chapter(value, index)).join('')
$('implementation-count').textContent = `${solutionCount} 项已核查实现`
$('source-count').textContent = `${sources.length} 份`
$('source-list').innerHTML = platforms.map(platform => `<section><h4>${platform.name}</h4><ol>${sources.filter(source => source.platform === platform.name).map(source => `<li id="source-${source.id}" value="${sourceNumbers.get(source.id)}"><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ol></section>`).join('')

// Keep links from the previous tabbed version useful; all chapters now remain visible.
const params = new URLSearchParams(location.search)
const previousValue = params.get('value')
if (params.has('value') || params.has('platform')) {
  const url = new URL(location.href)
  if (!url.hash && values.some(value => value.id === previousValue)) url.hash = `value-${previousValue}`
  url.searchParams.delete('value')
  url.searchParams.delete('platform')
  history.replaceState(null, '', url)
}
function markReadingPosition(id: string) {
  const active = values.find(value => `value-${value.id}` === id || value.points.some(point => `point-${point.id}` === id))
  $('chapter-links').querySelectorAll<HTMLElement>('.nav-group').forEach(group => {
    const isActive = group.dataset.value === active?.id
    group.classList.toggle('is-active', isActive)
    group.querySelectorAll<HTMLAnchorElement>('a').forEach(link => {
      if (isActive && (link.classList.contains('chapter-link') || link.hash === `#${id}`)) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    })
  })
}
function syncAnchor() { markReadingPosition(location.hash.slice(1)) }
window.addEventListener('hashchange', syncAnchor)
syncAnchor()
if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' }))

const readingSections = [...document.querySelectorAll<HTMLElement>('.value-chapter, .landing-point, #method, .closing-section')]
let readingFramePending = false
function updateReadingPosition() {
  readingFramePending = false
  if (document.documentElement.scrollHeight <= window.innerHeight) return
  const threshold = window.matchMedia('(min-width: 1200px)').matches ? 130 : 155
  let current = ''
  for (const section of readingSections) {
    if (section.getBoundingClientRect().top <= threshold) current = section.id
    else break
  }
  markReadingPosition(current)
}
function scheduleReadingUpdate() {
  if (readingFramePending) return
  readingFramePending = true
  requestAnimationFrame(updateReadingPosition)
}
window.addEventListener('scroll', scheduleReadingUpdate, { passive: true })
window.addEventListener('resize', scheduleReadingUpdate)

$('download-analysis').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([buildMarkdown()], { type: 'text/markdown;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'Onlyfans CRM 产品价值分析.md'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  $('download-status').textContent = `已生成完整分析文档，包含 ${pointCount} 个落地点和 ${solutionCount} 项平台实现，每条均附官方依据。`
})
