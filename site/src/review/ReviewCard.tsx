import { memo, type ReactNode, useEffect, useId, useRef } from 'react'
import type { Grammar } from './grammar'
import type { ReviewItem, Verdict } from './types'
import type { GrammarText, UiStrings } from './ui'

type CardText = UiStrings['card']

/** A blank or whitespace-only value would render as nothing; say what it is instead. */
function displayValue(value: string, text: CardText): string {
  if (value === '') return text.empty
  if (value.trim() === '') return `␣ (${value.length} space${value.length === 1 ? '' : 's'})`
  return value
}

/**
 * Gender, case, number and the counts that pick a form, as a short list.
 * This is what lets a reviewer judge «копейки» (feminine, genitive singular,
 * after 2–4) instead of guessing which form the slot is for.
 */
function GrammarFacts({
  grammar,
  text,
  lang,
}: {
  grammar: Grammar
  text: GrammarText
  lang: string
}): ReactNode {
  const rows: [string, ReactNode][] = []
  if (grammar.gender) rows.push([text.gender, text.genders[grammar.gender]])
  if (grammar.case) rows.push([text.case, text.cases[grammar.case]])
  if (grammar.number) rows.push([text.number, text.numbers[grammar.number]])
  if (grammar.usedAfter) rows.push([text.usedAfter, grammar.usedAfter])
  if (grammar.forms) {
    rows.push([
      text.forms,
      <ul key="forms" className="rv-forms">
        {grammar.forms.map((form) => (
          <li
            key={form.gender}
            className={form.gender === grammar.gender ? 'is-current' : undefined}
          >
            <span className="rv-forms-gender">{text.genders[form.gender]}</span>{' '}
            <span lang={lang}>{form.text}</span>
          </li>
        ))}
      </ul>,
    ])
  }
  if (grammar.counted) {
    rows.push([
      text.counted,
      <ul key="counted" className="rv-counted">
        {grammar.counted.map((noun) => {
          const facts = [
            noun.gender && text.genders[noun.gender],
            noun.case && text.cases[noun.case],
            noun.number && text.numbers[noun.number],
          ].filter(Boolean)
          return (
            <li key={`${noun.count}-${noun.noun}`}>
              {noun.count} →{' '}
              <span lang={lang} className="rv-noun">
                {noun.noun}
              </span>
              {facts.length > 0 && <span className="rv-noun-facts"> — {facts.join(', ')}</span>}
            </li>
          )
        })}
      </ul>,
    ])
  }
  if (rows.length === 0 && !grammar.citation) return null
  return (
    <div className="rv-grammar">
      <p className="rv-grammar-title">
        {text.heading}
        {grammar.citation && <span className="rv-citation">{text.citation}</span>}
      </p>
      {rows.length > 0 && (
        <dl>
          {rows.map(([term, value]) => (
            <div key={term} className="rv-grammar-row">
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

export interface CardProps {
  item: ReviewItem
  lang: string
  verdict: Verdict | undefined
  ui: UiStrings
  question: string | undefined
  /** Focus the suggestion box after this card is flagged. */
  focusFix: boolean
  onVerdict: (item: ReviewItem, status: 'ok' | 'wrong') => void
  onEdit: (item: ReviewItem, suggestion: string, note: string) => void
}

function Card({
  item,
  lang,
  verdict,
  ui,
  question,
  focusFix,
  onVerdict,
  onEdit,
}: CardProps): ReactNode {
  const text = ui.card
  const id = useId()
  const suggestionRef = useRef<HTMLInputElement>(null)
  const status = verdict?.status

  useEffect(() => {
    if (focusFix && status === 'wrong') suggestionRef.current?.focus()
  }, [focusFix, status])

  const className = ['rv-card', status === 'ok' && 'is-ok', status === 'wrong' && 'is-wrong']
    .filter(Boolean)
    .join(' ')

  return (
    <article className={className} tabIndex={-1} data-item-id={item.id} aria-labelledby={`${id}-v`}>
      <div className="rv-card-head">
        <span className="rv-label">{item.label}</span>
        {item.priority && <span className="rv-badge">{text.needsNativeEye}</span>}
        {item.kind === 'output' && (
          <span className="rv-badge is-muted" title={text.composedHint}>
            {text.composed}
          </span>
        )}
      </div>

      <p id={`${id}-v`} className="rv-current" lang={lang}>
        {displayValue(item.current, text)}
      </p>

      {item.grammar && <GrammarFacts grammar={item.grammar} text={ui.grammar} lang={lang} />}

      {question && <p className="rv-question">{question}</p>}

      {item.examples.length > 0 && (
        <ul className="rv-examples">
          {item.examples.map((example) => {
            const failed = example.result.startsWith('⚠')
            return (
              <li key={example.call} className="rv-example">
                <code className="rv-example-call">{example.call}</code>
                <span
                  className={failed ? 'rv-example-result is-error' : 'rv-example-result'}
                  lang={failed ? undefined : lang}
                >
                  {example.result}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <div className="rv-actions">
        <button
          type="button"
          className="rv-btn rv-btn-ok"
          aria-pressed={status === 'ok'}
          onClick={() => onVerdict(item, 'ok')}
        >
          <span aria-hidden="true">✓</span> {text.correct}
        </button>
        <button
          type="button"
          className="rv-btn rv-btn-flag"
          aria-pressed={status === 'wrong'}
          onClick={() => onVerdict(item, 'wrong')}
        >
          <span aria-hidden="true">✎</span> {text.needsFixing}
        </button>
      </div>

      {status === 'wrong' && (
        <div className="rv-fix">
          <div className="field">
            <label className="field-label" htmlFor={`${id}-s`}>
              {item.kind === 'value' ? text.correctWord : text.correctPhrase}
            </label>
            <input
              ref={suggestionRef}
              id={`${id}-s`}
              type="text"
              lang={lang}
              placeholder={text.suggestionPlaceholder}
              value={verdict?.suggestion ?? ''}
              onChange={(event) => onEdit(item, event.target.value, verdict?.note ?? '')}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor={`${id}-n`}>
              {text.why}
            </label>
            <input
              id={`${id}-n`}
              type="text"
              placeholder={text.whyPlaceholder}
              value={verdict?.note ?? ''}
              onChange={(event) => onEdit(item, verdict?.suggestion ?? '', event.target.value)}
            />
          </div>
        </div>
      )}
    </article>
  )
}

/** Memoised: a review page holds a few hundred cards and one answer changes one of them. */
export const ReviewCard = memo(Card)
