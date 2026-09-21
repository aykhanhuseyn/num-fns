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

const REPO_URL = 'https://github.com/aykhanhuseyn/num-fns'

type Filter = 'priority' | 'todo' | 'flagged' | 'all'

const FILTERS: readonly { id: Filter; label: string; hint: string }[] = [
  { id: 'priority', label: 'Start here', hint: 'The entries we cannot check ourselves' },
  { id: 'todo', label: 'Not yet reviewed', hint: 'Everything you have not judged' },
  { id: 'flagged', label: 'Flagged', hint: 'What you marked as needing a fix' },
  { id: 'all', label: 'Everything', hint: 'The full vocabulary sweep' },
]

const state = {
  review: reviews[0] as LocaleReview,
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
    ['Docs', './index.html'],
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

const INTRO_STEPS: readonly [string, string][] = [
  [
    'Pick your language',
    'Only review a language you actually speak — guessing is worse than a gap.',
  ],
  [
    'Judge each entry',
    'Every word below is what the library outputs right now. Mark it correct, or say what it should be.',
  ],
  [
    'Send it back',
    'One button turns your corrections into a GitHub issue we can apply directly to the next release.',
  ],
]

function buildIntro(): HTMLElement {
  const section = document.createElement('section')
  section.className = 'rv-intro'

  const heading = document.createElement('h1')
  heading.textContent = 'Help us get the words right'
  section.appendChild(heading)

  const lead = document.createElement('p')
  lead.className = 'rv-lead'
  lead.textContent =
    'num-fns spells numbers, ordinals and money out in five languages. The engineering is tested; the vocabulary is not — it came from dictionaries, not from speakers. If one of these is your language, ten minutes here stops a wrong word shipping to everyone who installs the package.'
  section.appendChild(lead)

  const steps = document.createElement('ol')
  steps.className = 'rv-steps'
  for (const [title, body] of INTRO_STEPS) {
    const li = document.createElement('li')
    const strong = document.createElement('strong')
    strong.textContent = title
    li.append(strong, document.createTextNode(` — ${body}`))
    steps.appendChild(li)
  }
  section.appendChild(steps)

  const privacy = document.createElement('p')
  privacy.className = 'rv-privacy'
  privacy.textContent =
    'Nothing is sent anywhere as you work. Your answers stay in this browser until you press Submit, which opens a GitHub issue you can read and edit before posting.'
  section.appendChild(privacy)

  section.appendChild(buildReviewerField())
  return section
}

function buildReviewerField(): HTMLElement {
  const label = document.createElement('label')
  label.className = 'rv-reviewer'

  const caption = document.createElement('span')
  caption.textContent = 'Your name or GitHub handle (optional, for the credit line)'
  label.appendChild(caption)

  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = '@handle'
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
    chip.dataset.filter = filter.id
    chip.title = filter.hint
    chip.textContent = filter.label
    chip.addEventListener('click', () => {
      state.filter = filter.id
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
  elements.submit.textContent = 'Submit corrections'
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
    wrapper.appendChild(buildSectionHeading(section.title, section.blurb, items.length))

    const grid = document.createElement('div')
    grid.className = 'rv-grid'
    for (const item of items) grid.appendChild(mountCard(item))
    wrapper.appendChild(grid)

    elements.list.appendChild(wrapper)
  }
}

function mountCard(item: ReviewItem): HTMLElement {
  const view = renderCard(item, state.review.tag, state.verdicts[item.id], {
    onApprove: () => setVerdict(item, 'ok'),
    onFlag: () => {
      setVerdict(item, 'wrong')
      if (state.verdicts[item.id]?.status === 'wrong') view.suggestionInput.focus()
    },
    onEdit: (suggestion, note) => editVerdict(item, suggestion, note),
  })
  state.views.set(item.id, view)
  return view.element
}

function buildEmptyState(): HTMLElement {
  const empty = document.createElement('p')
  empty.className = 'rv-empty'
  empty.textContent =
    state.filter === 'flagged'
      ? 'Nothing flagged yet — mark an entry as “Needs fixing” and it will show up here.'
      : 'Nothing left under this filter. Try “Everything”.'
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
  elements.progress.textContent = `${reviewed} of ${total} reviewed · ${flagged} flagged`
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

function downloadPatch(json: string, localeCode: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `num-fns-review-${localeCode}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function buildDialogBody(): HTMLElement {
  const patch = buildPatch(state.review, state.verdicts, state.reviewer)
  const title = buildIssueTitle(state.review, patch.counts.corrections)
  const body = buildIssueBody(patch, state.review)
  const link = buildIssueLink(title, body)

  const wrapper = document.createElement('div')

  const heading = document.createElement('h2')
  heading.textContent = `${patch.counts.corrections} correction${patch.counts.corrections === 1 ? '' : 's'} to ${state.review.name}`
  wrapper.appendChild(heading)

  const summary = document.createElement('p')
  summary.textContent = `You reviewed ${patch.counts.reviewed} of ${patch.counts.total} entries and confirmed ${patch.counts.approved} as correct. The report below is what gets posted.`
  wrapper.appendChild(summary)

  if (link.needsPaste) {
    const warning = document.createElement('p')
    warning.className = 'rv-warning'
    warning.textContent =
      'This report is too long to fit in a link, so it has been copied to your clipboard — paste it into the issue body after GitHub opens.'
    wrapper.appendChild(warning)
  }

  const preview = document.createElement('pre')
  preview.className = 'rv-preview'
  preview.textContent = body
  wrapper.appendChild(preview)

  const actions = document.createElement('div')
  actions.className = 'rv-dialog-actions'
  actions.append(
    dialogButton('Open GitHub issue', true, () => {
      if (link.needsPaste) void navigator.clipboard?.writeText(body)
      window.open(link.url, '_blank', 'noopener')
    }),
    dialogButton('Copy report', false, () => void navigator.clipboard?.writeText(body)),
    dialogButton('Download JSON', false, () =>
      downloadPatch(JSON.stringify(patch, null, 2), state.review.code),
    ),
    dialogButton('Close', false, () => elements.dialog.close()),
  )
  wrapper.appendChild(actions)

  const reset = document.createElement('button')
  reset.type = 'button'
  reset.className = 'rv-reset'
  reset.textContent = `Clear my ${state.review.name} answers`
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

  app.append(
    buildHeader(),
    buildIntro(),
    buildTabs(),
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
  keys.textContent =
    'Keyboard: j / k move · a marks correct · f flags for fixing · Esc leaves a field'
  footer.appendChild(keys)

  const thanks = document.createElement('p')
  thanks.append(document.createTextNode('Thank you. Corrections land in '))
  const link = document.createElement('a')
  link.href = `${REPO_URL}/issues`
  link.target = '_blank'
  link.rel = 'noreferrer'
  link.textContent = 'the issue tracker'
  thanks.append(link, document.createTextNode(' and ship in the next release, with credit.'))
  footer.appendChild(thanks)

  return footer
}

mount()
