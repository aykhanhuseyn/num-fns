import { type CardView, renderCard } from './card'
import { reviews } from './items'
import {
  buildIssueBody,
  buildIssueLink,
  buildIssueTitle,
  buildPatch,
  collectCorrections,
} from './report'
import './review.css'
import { clearVerdicts, loadReviewer, loadVerdicts, saveReviewer, saveVerdicts } from './storage'
import type { LocaleReview, ReviewItem, Verdicts } from './types'
import { itemQuestion, resolveMode, reviewFileName, sectionText } from './ui'

const REPO_URL = 'https://github.com/aykhanhuseyn/num-fns'

type Filter = 'priority' | 'todo' | 'flagged' | 'all'

const FILTERS: readonly Filter[] = ['priority', 'todo', 'flagged', 'all']

/** `?lang=ru` locks the page to one locale and speaks its language (`ui.ts`). */
const mode = resolveMode(window.location.search, reviews)
const ui = mode.ui

const state = {
  review: mode.locked ?? (reviews[0] as LocaleReview),
  filter: 'priority' as Filter,
  verdicts: {} as Verdicts,
  reviewer: '',
  views: new Map<string, CardView>(),
}

const elements = {
  tabs: document.createElement('div'),
  filters: document.createElement('div'),
  progress: document.createElement('p'),
  progressBar: document.createElement('div'),
  list: document.createElement('div'),
  submit: document.createElement('button'),
  dialog: document.createElement('dialog'),
}

// --- state helpers ----------------------------------------------------------

function visibleItems(): ReviewItem[] {
  const all = state.review.sections.flatMap((section) => section.items)
  if (state.filter === 'all') return all
  if (state.filter === 'priority') return all.filter((item) => item.priority)
  if (state.filter === 'flagged')
    return all.filter((item) => state.verdicts[item.id]?.status === 'wrong')
  return all.filter((item) => !state.verdicts[item.id])
}

function persist(): void {
  saveVerdicts(state.review.code, state.verdicts)
  refreshProgress()
}

function setVerdict(item: ReviewItem, status: 'ok' | 'wrong'): void {
  const existing = state.verdicts[item.id]
  if (existing?.status === status) {
    delete state.verdicts[item.id]
  } else {
    state.verdicts[item.id] = { ...existing, status }
  }
  state.views.get(item.id)?.update(state.verdicts[item.id])
  persist()
}

function editVerdict(item: ReviewItem, suggestion: string, note: string): void {
  const existing = state.verdicts[item.id] ?? { status: 'wrong' as const }
  state.verdicts[item.id] = { ...existing, status: 'wrong', suggestion, note }
  state.views.get(item.id)?.update(state.verdicts[item.id])
  persist()
}

// --- chrome -----------------------------------------------------------------

function buildHeader(): HTMLElement {
  const header = document.createElement('header')
  header.className = 'rv-header'

  const brand = document.createElement('a')
  brand.className = 'rv-brand'
  brand.href = './index.html'
  const mark = document.createElement('img')
  mark.src = `${import.meta.env.BASE_URL}logo.png`
  mark.alt = ''
  mark.width = 26
  mark.height = 26
  brand.append(mark, document.createTextNode('num-fns'))
  header.appendChild(brand)

  const nav = document.createElement('nav')
  nav.className = 'rv-nav'
  for (const [label, href] of [
    [ui.navDocs, './index.html'],
    ['GitHub', REPO_URL],
  ] as [string, string][]) {
    const link = document.createElement('a')
    link.href = href
    link.textContent = label
    if (href.startsWith('http')) {
      link.target = '_blank'
      link.rel = 'noreferrer'
    }
    nav.appendChild(link)
  }
  header.appendChild(nav)

  return header
}

function buildIntro(): HTMLElement {
  const section = document.createElement('section')
  section.className = 'rv-intro'

  const heading = document.createElement('h1')
  heading.textContent = ui.heading
  section.appendChild(heading)

  const lead = document.createElement('p')
  lead.className = 'rv-lead'
  lead.textContent = ui.lead
  section.appendChild(lead)

  const steps = document.createElement('ol')
  steps.className = 'rv-steps'
  for (const [title, body] of ui.steps) {
    const li = document.createElement('li')
    const strong = document.createElement('strong')
    strong.textContent = title
    li.append(strong, document.createTextNode(` — ${body}`))
    steps.appendChild(li)
  }
  section.appendChild(steps)

  const privacy = document.createElement('p')
  privacy.className = 'rv-privacy'
  privacy.textContent = ui.privacy
  section.appendChild(privacy)

  section.appendChild(buildReviewerField())
  return section
}

function buildReviewerField(): HTMLElement {
  const label = document.createElement('label')
  label.className = 'rv-reviewer'

  const caption = document.createElement('span')
  caption.textContent = ui.reviewerCaption
  label.appendChild(caption)

  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = ui.reviewerPlaceholder
  input.value = state.reviewer
  input.addEventListener('input', () => {
    state.reviewer = input.value
    saveReviewer(input.value)
  })
  label.appendChild(input)

  return label
}

function buildTabs(): HTMLElement {
  elements.tabs.className = 'rv-tabs'
  elements.tabs.setAttribute('role', 'tablist')
  for (const review of reviews) {
    const tab = document.createElement('button')
    tab.type = 'button'
    tab.className = 'rv-tab'
    tab.setAttribute('role', 'tab')
    tab.dataset.locale = review.code

    const name = document.createElement('strong')
    name.textContent = review.name
    const meta = document.createElement('span')
    meta.textContent = `${review.code} · ${review.itemCount} entries`
    tab.append(name, meta)

    tab.addEventListener('click', () => selectLocale(review))
    elements.tabs.appendChild(tab)
  }
  return elements.tabs
}

function buildToolbar(): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'rv-toolbar'

  elements.filters.className = 'rv-filters'
  for (const filter of FILTERS) {
    const chip = document.createElement('button')
    chip.type = 'button'
    chip.className = 'rv-chip'
    chip.dataset.filter = filter
    chip.title = ui.filters[filter].hint
    chip.textContent = ui.filters[filter].label
    chip.addEventListener('click', () => {
      state.filter = filter
      renderList()
    })
    elements.filters.appendChild(chip)
  }
  bar.appendChild(elements.filters)

  const progressWrap = document.createElement('div')
  progressWrap.className = 'rv-progress'
  elements.progressBar.className = 'rv-progress-fill'
  const track = document.createElement('div')
  track.className = 'rv-progress-track'
  track.appendChild(elements.progressBar)
  elements.progress.className = 'rv-progress-text'
  progressWrap.append(track, elements.progress)
  bar.appendChild(progressWrap)

  elements.submit.type = 'button'
  elements.submit.className = 'rv-submit'
  elements.submit.textContent = ui.submit
  elements.submit.addEventListener('click', openSubmitDialog)
  bar.appendChild(elements.submit)

  return bar
}

// --- list rendering ---------------------------------------------------------

function buildSectionHeading(title: string, blurb: string, count: number): HTMLElement {
  const head = document.createElement('div')
  head.className = 'rv-section-head'

  const heading = document.createElement('h2')
  heading.textContent = title
  const badge = document.createElement('span')
  badge.className = 'rv-section-count'
  badge.textContent = `${count}`
  heading.appendChild(badge)
  head.appendChild(heading)

  const text = document.createElement('p')
  text.textContent = blurb
  head.appendChild(text)

  return head
}

function renderList(): void {
  syncChips()
  state.views.clear()
  elements.list.replaceChildren()

  const visible = new Set(visibleItems().map((item) => item.id))
  if (visible.size === 0) {
    elements.list.appendChild(buildEmptyState())
    return
  }

  for (const section of state.review.sections) {
    const items = section.items.filter((item) => visible.has(item.id))
    if (items.length === 0) continue

    const wrapper = document.createElement('section')
    wrapper.className = 'rv-section'
    const text = sectionText(ui, section) ?? section
    wrapper.appendChild(buildSectionHeading(text.title, text.blurb, items.length))

    const grid = document.createElement('div')
    grid.className = 'rv-grid'
    for (const item of items) grid.appendChild(mountCard(item))
    wrapper.appendChild(grid)

    elements.list.appendChild(wrapper)
  }
}

function mountCard(item: ReviewItem): HTMLElement {
  const view = renderCard(
    item,
    state.review.tag,
    state.verdicts[item.id],
    {
      onApprove: () => setVerdict(item, 'ok'),
      onFlag: () => {
        setVerdict(item, 'wrong')
        if (state.verdicts[item.id]?.status === 'wrong') view.suggestionInput.focus()
      },
      onEdit: (suggestion, note) => editVerdict(item, suggestion, note),
    },
    ui.card,
    itemQuestion(ui, item.id) ?? item.question,
  )
  state.views.set(item.id, view)
  return view.element
}

function buildEmptyState(): HTMLElement {
  const empty = document.createElement('p')
  empty.className = 'rv-empty'
  empty.textContent = state.filter === 'flagged' ? ui.emptyFlagged : ui.emptyFilter
  return empty
}

function syncChips(): void {
  for (const chip of Array.from(elements.filters.children)) {
    chip.classList.toggle('is-active', (chip as HTMLElement).dataset.filter === state.filter)
  }
  for (const tab of Array.from(elements.tabs.children)) {
    tab.classList.toggle('is-active', (tab as HTMLElement).dataset.locale === state.review.code)
  }
}

function refreshProgress(): void {
  const total = state.review.itemCount
  const reviewed = state.review.sections
    .flatMap((section) => section.items)
    .filter((item) => state.verdicts[item.id]).length
  const flagged = collectCorrections(state.review, state.verdicts).length
  const percent = total === 0 ? 0 : Math.round((reviewed / total) * 100)

  elements.progressBar.style.width = `${percent}%`
  elements.progress.textContent = ui.progress(reviewed, total, flagged)
  elements.submit.disabled = reviewed === 0
}

function selectLocale(review: LocaleReview): void {
  state.review = review
  state.verdicts = loadVerdicts(review.code)
  renderList()
  refreshProgress()
}

// --- submission -------------------------------------------------------------

function dialogButton(label: string, primary: boolean, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = primary ? 'rv-btn rv-btn-primary' : 'rv-btn'
  button.textContent = label
  button.addEventListener('click', onClick)
  return button
}

function downloadPatch(json: string, fileName: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function buildDialogBody(): HTMLElement {
  const patch = buildPatch(state.review, state.verdicts, state.reviewer)
  const title = buildIssueTitle(state.review, patch.counts.corrections)
  const body = buildIssueBody(patch, state.review)
  const link = buildIssueLink(title, body)
  const fileName = reviewFileName(state.review.code, state.reviewer, new Date())

  const wrapper = document.createElement('div')

  const heading = document.createElement('h2')
  heading.textContent = ui.dialog.heading(patch.counts.corrections, state.review.name)
  wrapper.appendChild(heading)

  const summary = document.createElement('p')
  summary.textContent = ui.dialog.summary(
    patch.counts.reviewed,
    patch.counts.total,
    patch.counts.approved,
  )
  wrapper.appendChild(summary)

  const howTo = document.createElement('p')
  howTo.className = 'rv-send-how'
  howTo.textContent = ui.dialog.howToSend
  wrapper.appendChild(howTo)

  const file = document.createElement('p')
  file.className = 'rv-send-file'
  const code = document.createElement('code')
  code.textContent = fileName
  file.appendChild(code)
  wrapper.appendChild(file)

  const actions = document.createElement('div')
  actions.className = 'rv-dialog-actions'
  const copy = dialogButton(ui.dialog.copy, false, () => {
    void navigator.clipboard?.writeText(body).then(() => {
      copy.textContent = ui.dialog.copied
    })
  })
  actions.append(
    dialogButton(ui.dialog.download, true, () =>
      downloadPatch(JSON.stringify(patch, null, 2), fileName),
    ),
    copy,
    dialogButton(ui.dialog.close, false, () => elements.dialog.close()),
  )
  wrapper.appendChild(actions)

  const preview = document.createElement('pre')
  preview.className = 'rv-preview'
  preview.textContent = body
  wrapper.appendChild(preview)

  const github = document.createElement('p')
  github.className = 'rv-send-github'
  const issue = document.createElement('a')
  issue.href = link.url
  issue.target = '_blank'
  issue.rel = 'noopener'
  issue.textContent = ui.dialog.github
  issue.addEventListener('click', () => {
    if (link.needsPaste) void navigator.clipboard?.writeText(body)
  })
  github.append(issue, document.createTextNode(` — ${ui.dialog.githubHint}`))
  if (link.needsPaste) github.append(document.createTextNode(` ${ui.dialog.tooLong}`))
  wrapper.appendChild(github)

  const reset = document.createElement('button')
  reset.type = 'button'
  reset.className = 'rv-reset'
  reset.textContent = ui.dialog.clear(state.review.name)
  reset.addEventListener('click', () => {
    clearVerdicts(state.review.code)
    state.verdicts = {}
    elements.dialog.close()
    renderList()
    refreshProgress()
  })
  wrapper.appendChild(reset)

  return wrapper
}

function openSubmitDialog(): void {
  elements.dialog.replaceChildren(buildDialogBody())
  elements.dialog.showModal()
}

// --- keyboard ---------------------------------------------------------------

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
}

function focusedCard(): HTMLElement | null {
  const active = document.activeElement
  return active instanceof HTMLElement ? active.closest('.rv-card') : null
}

function moveFocus(delta: number): void {
  const cards = Array.from(elements.list.querySelectorAll<HTMLElement>('.rv-card'))
  if (cards.length === 0) return
  const current = focusedCard()
  const index = current ? cards.indexOf(current) : -1
  const next = cards[Math.min(cards.length - 1, Math.max(0, index + delta))]
  next?.focus()
  next?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

function cardItemId(card: HTMLElement | null): string | undefined {
  return card?.dataset.itemId
}

function handleKey(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isTyping(event.target)) {
    ;(event.target as HTMLElement).blur()
    return
  }
  if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return

  if (event.key === 'j' || event.key === 'k') {
    moveFocus(event.key === 'j' ? 1 : -1)
    return
  }

  const id = cardItemId(focusedCard())
  if (!id) return
  const view = state.views.get(id)
  if (!view) return
  if (event.key === 'a') view.element.querySelector<HTMLElement>('.rv-btn-ok')?.click()
  if (event.key === 'f') view.element.querySelector<HTMLElement>('.rv-btn-flag')?.click()
}

// --- mount ------------------------------------------------------------------

function mount(): void {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) throw new Error('review: #app root element not found')

  state.reviewer = loadReviewer()
  state.verdicts = loadVerdicts(state.review.code)

  elements.list.className = 'rv-list'
  elements.dialog.className = 'rv-dialog'

  document.documentElement.lang = ui.htmlLang
  document.title = ui.docTitle
  if (mode.locked) document.body.classList.add('rv-locked')

  app.append(
    buildHeader(),
    buildIntro(),
    ...(mode.locked ? [] : [buildTabs()]),
    buildToolbar(),
    elements.list,
    buildFooter(),
    elements.dialog,
  )

  renderList()
  refreshProgress()
  document.addEventListener('keydown', handleKey)
}

function buildFooter(): HTMLElement {
  const footer = document.createElement('footer')
  footer.className = 'rv-footer'

  const keys = document.createElement('p')
  keys.textContent = ui.footerKeys
  footer.appendChild(keys)

  const thanks = document.createElement('p')
  thanks.textContent = ui.footerThanks
  footer.appendChild(thanks)

  return footer
}

mount()
