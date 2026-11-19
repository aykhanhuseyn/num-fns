import type { ReviewExample, ReviewItem, Verdict } from './types'
import type { UiStrings } from './ui'

type CardText = UiStrings['card']

/**
 * One reviewable entry, rendered. The card is deliberately loud about a single
 * thing — the word or phrase under judgement — because a reviewer skims
 * hundreds of these and should be able to decide from the big text alone,
 * dropping to the examples only when the bare word is ambiguous.
 */

/** Renders values a browser would otherwise show as nothing at all. */
function displayValue(value: string, text: CardText): string {
  if (value === '') return text.empty
  if (value.trim() === '') return `␣ (${value.length} space${value.length === 1 ? '' : 's'})`
  return value
}

export interface CardHandlers {
  onApprove: () => void
  onFlag: () => void
  onEdit: (suggestion: string, note: string) => void
}

/** A rendered card plus the handles needed to update it without re-rendering the list. */
export interface CardView {
  element: HTMLElement
  /** Repaints the verdict state (button highlighting, card tint). */
  update: (verdict: Verdict | undefined) => void
  /** The correction input, so a keyboard shortcut can jump straight into it. */
  suggestionInput: HTMLInputElement
}

function buildExample(example: ReviewExample, lang: string): HTMLElement {
  const row = document.createElement('div')
  row.className = 'rv-example'

  const call = document.createElement('code')
  call.className = 'rv-example-call'
  call.textContent = example.call
  row.appendChild(call)

  const failed = example.result.startsWith('⚠')
  const result = document.createElement('span')
  result.className = failed ? 'rv-example-result is-error' : 'rv-example-result'
  if (!failed) result.lang = lang
  result.textContent = example.result
  row.appendChild(result)

  return row
}

function buildField(caption: string, placeholder: string, value: string): HTMLLabelElement {
  const label = document.createElement('label')
  label.className = 'rv-field'

  const text = document.createElement('span')
  text.textContent = caption
  label.appendChild(text)

  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = placeholder
  input.value = value
  label.appendChild(input)

  return label
}

function buildHeader(item: ReviewItem, text: CardText): HTMLElement {
  const header = document.createElement('div')
  header.className = 'rv-card-head'

  const label = document.createElement('span')
  label.className = 'rv-label'
  label.textContent = item.label
  header.appendChild(label)

  if (item.priority) {
    const badge = document.createElement('span')
    badge.className = 'rv-badge'
    badge.textContent = text.needsNativeEye
    header.appendChild(badge)
  }

  if (item.kind === 'output') {
    const badge = document.createElement('span')
    badge.className = 'rv-badge is-muted'
    badge.title = text.composedHint
    badge.textContent = text.composed
    header.appendChild(badge)
  }

  return header
}

function buildButton(className: string, text: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `rv-btn ${className}`
  button.textContent = text
  button.addEventListener('click', onClick)
  return button
}

export function renderCard(
  item: ReviewItem,
  lang: string,
  verdict: Verdict | undefined,
  handlers: CardHandlers,
  text: CardText,
  question: string | undefined = item.question,
): CardView {
  const card = document.createElement('article')
  card.className = 'rv-card'
  card.tabIndex = -1
  card.dataset.itemId = item.id

  card.appendChild(buildHeader(item, text))

  const current = document.createElement('p')
  current.className = 'rv-current'
  current.lang = lang
  current.textContent = displayValue(item.current, text)
  card.appendChild(current)

  if (question) {
    const asked = document.createElement('p')
    asked.className = 'rv-question'
    asked.textContent = question
    card.appendChild(asked)
  }

  if (item.examples.length > 0) {
    const examples = document.createElement('div')
    examples.className = 'rv-examples'
    for (const example of item.examples) examples.appendChild(buildExample(example, lang))
    card.appendChild(examples)
  }

  const actions = document.createElement('div')
  actions.className = 'rv-actions'
  const approve = buildButton('rv-btn-ok', text.correct, handlers.onApprove)
  const flag = buildButton('rv-btn-flag', text.needsFixing, handlers.onFlag)
  actions.append(approve, flag)
  card.appendChild(actions)

  const fix = document.createElement('div')
  fix.className = 'rv-fix'
  const suggestion = buildField(
    item.kind === 'value' ? text.correctWord : text.correctPhrase,
    text.suggestionPlaceholder,
    verdict?.suggestion ?? '',
  )
  const note = buildField(text.why, text.whyPlaceholder, verdict?.note ?? '')
  fix.append(suggestion, note)
  card.appendChild(fix)

  const suggestionInput = suggestion.querySelector('input') as HTMLInputElement
  const noteInput = note.querySelector('input') as HTMLInputElement
  suggestionInput.lang = lang
  const pushEdit = (): void => handlers.onEdit(suggestionInput.value, noteInput.value)
  suggestionInput.addEventListener('input', pushEdit)
  noteInput.addEventListener('input', pushEdit)

  const update = (next: Verdict | undefined): void => {
    card.classList.toggle('is-ok', next?.status === 'ok')
    card.classList.toggle('is-wrong', next?.status === 'wrong')
    approve.classList.toggle('is-active', next?.status === 'ok')
    flag.classList.toggle('is-active', next?.status === 'wrong')
  }
  update(verdict)

  return { element: card, update, suggestionInput }
}
