import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { reviews } from './items'
import { ReviewCard } from './ReviewCard'
import { collectCorrections } from './report'
import { SubmitDialog } from './SubmitDialog'
import { clearVerdicts, loadReviewer, loadVerdicts, saveReviewer, saveVerdicts } from './storage'
import type { LocaleReview, ReviewItem, Verdicts } from './types'
import { itemQuestion, type PageMode, sectionText } from './ui'

type Filter = 'priority' | 'todo' | 'flagged' | 'all'

const FILTERS: readonly Filter[] = ['priority', 'todo', 'flagged', 'all']

/**
 * Drops verdicts that no longer apply: the item text changed since it was
 * judged, or (for answers saved before `seen` existed) the suggested fix is
 * now the current text.
 */
function prune(review: LocaleReview, verdicts: Verdicts): Verdicts {
  const kept: Verdicts = { ...verdicts }
  for (const item of review.sections.flatMap((section) => section.items)) {
    const verdict = kept[item.id]
    if (!verdict) continue
    const changed = verdict.seen !== undefined && verdict.seen !== item.current
    const fixed =
      verdict.seen === undefined &&
      verdict.status === 'wrong' &&
      verdict.suggestion?.trim() === item.current
    if (changed || fixed) delete kept[item.id]
  }
  return kept
}

function loadReview(review: LocaleReview): Verdicts {
  const verdicts = prune(review, loadVerdicts(review.code))
  saveVerdicts(review.code, verdicts)
  return verdicts
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

function focusedCard(): HTMLElement | null {
  const active = document.activeElement
  return active instanceof HTMLElement ? active.closest<HTMLElement>('.rv-card') : null
}

function moveFocus(list: HTMLElement | null, delta: number): void {
  const cards = Array.from(list?.querySelectorAll<HTMLElement>('.rv-card') ?? [])
  if (cards.length === 0) return
  const current = focusedCard()
  const index = current ? cards.indexOf(current) : -1
  const next = cards[Math.min(cards.length - 1, Math.max(0, index + delta))]
  next?.focus()
  next?.scrollIntoView({ block: 'center' })
}

const CARD_KEYS: Readonly<Record<string, string>> = { a: '.rv-btn-ok', f: '.rv-btn-flag' }

function handleReviewKey(event: KeyboardEvent, list: HTMLElement | null): void {
  if (event.key === 'Escape' && isTyping(event.target)) {
    ;(event.target as HTMLElement).blur()
    return
  }
  if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
  if (event.key === 'j' || event.key === 'k') {
    moveFocus(list, event.key === 'j' ? 1 : -1)
    return
  }
  const selector = CARD_KEYS[event.key]
  if (selector) focusedCard()?.querySelector<HTMLElement>(selector)?.click()
}

export function ReviewApp({ mode }: { mode: PageMode }): ReactNode {
  const ui = mode.ui
  const [review, setReview] = useState<LocaleReview>(
    () => mode.locked ?? (reviews[0] as LocaleReview),
  )
  const [verdicts, setVerdicts] = useState<Verdicts>(() => loadReview(review))
  const [filter, setFilter] = useState<Filter>('priority')
  // The `todo` and `flagged` filters read this snapshot, taken when the filter
  // or the locale changes, not the live answers: re-filtering on every answer
  // would pull the card out from under the reviewer's pointer.
  const [snapshot, setSnapshot] = useState<Verdicts>(verdicts)
  const [reviewer, setReviewer] = useState(loadReviewer)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [flaggedId, setFlaggedId] = useState<string>()
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    saveVerdicts(review.code, verdicts)
  }, [review.code, verdicts])

  const selectLocale = (next: LocaleReview): void => {
    const loaded = loadReview(next)
    setReview(next)
    setVerdicts(loaded)
    setSnapshot(loaded)
  }

  const chooseFilter = (next: Filter): void => {
    setFilter(next)
    setSnapshot(verdicts)
  }

  const onVerdict = useCallback((item: ReviewItem, status: 'ok' | 'wrong') => {
    setVerdicts((all) => {
      const existing = all[item.id]
      if (existing?.status === status) {
        const { [item.id]: _removed, ...rest } = all
        return rest
      }
      return { ...all, [item.id]: { ...existing, status, seen: item.current } }
    })
    setFlaggedId(status === 'wrong' ? item.id : undefined)
  }, [])

  const onEdit = useCallback((item: ReviewItem, suggestion: string, note: string) => {
    setVerdicts((all) => ({
      ...all,
      [item.id]: { ...all[item.id], status: 'wrong', suggestion, note, seen: item.current },
    }))
  }, [])

  const allItems = useMemo(() => review.sections.flatMap((section) => section.items), [review])
  const visible = useMemo(() => {
    if (filter === 'all') return allItems
    if (filter === 'priority') return allItems.filter((item) => item.priority)
    if (filter === 'flagged') {
      return allItems.filter((item) => snapshot[item.id]?.status === 'wrong')
    }
    return allItems.filter((item) => !snapshot[item.id])
  }, [allItems, filter, snapshot])
  const visibleIds = useMemo(() => new Set(visible.map((item) => item.id)), [visible])

  const reviewed = allItems.filter((item) => verdicts[item.id]).length
  const flagged = collectCorrections(review, verdicts).length
  const total = review.itemCount

  // j / k move between cards, a marks correct, f flags. Not while typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (!dialogOpen) handleReviewKey(event, listRef.current)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [dialogOpen])

  return (
    <div className="container rv-page">
      <section className="rv-intro" aria-labelledby="rv-title">
        <h1 id="rv-title">{ui.heading}</h1>
        <p className="lead">{ui.lead}</p>
        <ol className="rv-steps">
          {ui.steps.map(([title, body]) => (
            <li key={title}>
              <strong>{title}</strong> — {body}
            </li>
          ))}
        </ol>
        <p className="rv-privacy">{ui.privacy}</p>
        <div className="field rv-reviewer">
          <label className="field-label" htmlFor="rv-reviewer">
            {ui.reviewerCaption}
          </label>
          <input
            id="rv-reviewer"
            type="text"
            autoComplete="name"
            placeholder={ui.reviewerPlaceholder}
            value={reviewer}
            onChange={(event) => {
              setReviewer(event.target.value)
              saveReviewer(event.target.value)
            }}
          />
        </div>
      </section>

      {!mode.locked && (
        <nav className="rv-tabs" aria-label={ui.frame.language}>
          {reviews.map((entry) => (
            <button
              key={entry.code}
              type="button"
              className="rv-tab"
              aria-pressed={entry.code === review.code}
              onClick={() => selectLocale(entry)}
            >
              <strong>{entry.name}</strong>
              <span>
                {entry.code} · {entry.itemCount}
              </span>
            </button>
          ))}
        </nav>
      )}

      <div className="rv-toolbar">
        <fieldset className="rv-filters">
          <legend className="visually-hidden">Filter</legend>
          {FILTERS.map((entry) => (
            <button
              key={entry}
              type="button"
              className="rv-chip"
              aria-pressed={entry === filter}
              title={ui.filters[entry].hint}
              onClick={() => chooseFilter(entry)}
            >
              {ui.filters[entry].label}
            </button>
          ))}
        </fieldset>
        <div className="rv-progress">
          <progress
            value={reviewed}
            max={total}
            aria-label={ui.progress(reviewed, total, flagged)}
          />
          <span className="rv-progress-text" aria-live="polite">
            {ui.progress(reviewed, total, flagged)}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={reviewed === 0}
          onClick={() => setDialogOpen(true)}
        >
          {ui.submit}
        </button>
      </div>

      <div ref={listRef} className="rv-list">
        {visible.length === 0 && (
          <p className="rv-empty">{filter === 'flagged' ? ui.emptyFlagged : ui.emptyFilter}</p>
        )}
        {review.sections.map((section) => {
          const items = section.items.filter((item) => visibleIds.has(item.id))
          if (items.length === 0) return null
          const text = sectionText(ui, section) ?? section
          return (
            <section key={section.id} className="rv-section" aria-labelledby={`rv-s-${section.id}`}>
              <div className="rv-section-head">
                <h2 id={`rv-s-${section.id}`}>
                  {text.title} <span className="rv-section-count">{items.length}</span>
                </h2>
                <p>{text.blurb}</p>
              </div>
              <div className="rv-grid">
                {items.map((item) => (
                  <ReviewCard
                    key={item.id}
                    item={item}
                    lang={review.tag}
                    verdict={verdicts[item.id]}
                    ui={ui}
                    question={itemQuestion(ui, item.id) ?? item.question}
                    focusFix={flaggedId === item.id}
                    onVerdict={onVerdict}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div className="rv-footer">
        <p>{ui.footerKeys}</p>
        <p>{ui.footerThanks}</p>
      </div>

      <SubmitDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        review={review}
        verdicts={verdicts}
        reviewer={reviewer}
        ui={ui}
        onClear={() => {
          clearVerdicts(review.code)
          setVerdicts({})
          setSnapshot({})
          setDialogOpen(false)
        }}
      />
    </div>
  )
}
