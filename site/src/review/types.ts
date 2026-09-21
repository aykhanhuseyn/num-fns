/**
 * Data model for the native-speaker locale review page (`site/review.html`,
 * `todo.md` §2's "native-speaker review" item).
 *
 * Nothing here holds vocabulary of its own. Every reviewable entry is derived
 * at runtime from the real `Locale` objects in `src/locale/` and from the
 * output of the real public functions (`items.ts`), so the page can never show
 * a word the library no longer ships — the failure mode a hand-written review
 * spreadsheet has after one release.
 */

/**
 * What a reviewer is correcting.
 *
 * - `'value'` — a single field of the locale object (a word, a separator, a
 *   plural form). A correction is a literal replacement and carries a
 *   {@link ReviewItem.path}, so it can be applied mechanically.
 * - `'output'` — a whole phrase the library composed from several fields
 *   (`"двадцать одна тысяча"`). There is no single field to replace: a
 *   correction here is evidence that a *rule* is wrong, and the maintainer
 *   decides which field or composer to change.
 */
export type ItemKind = 'value' | 'output'

/** A live call and what the current source actually returns for it. */
export interface ReviewExample {
  /** The call as a reader would write it, e.g. `numberToWords(21, { locale: ru })`. */
  call: string
  /** What that call returns right now, or the thrown error's message prefixed with a warning sign. */
  result: string
}

/** One thing a native speaker is asked to confirm or correct. */
export interface ReviewItem {
  /** Stable across releases so a reviewer's saved progress survives a rebuild: `<locale>/<section>/<slug>`. */
  id: string
  sectionId: string
  /** Short human label, e.g. `tens[2] (20)` or `moneyToWords(2.05)`. */
  label: string
  kind: ItemKind
  /**
   * Dotted path into the `Locale` object for a `'value'` item, e.g.
   * `currency.units.RUB.minor.plurals.many`. Absent for `'output'` items.
   * `scripts/review-check.ts` resolves this against the live source to verify
   * a submitted correction is still applicable.
   */
  path?: string
  /** The word or phrase as it stands today — what the reviewer is judging. */
  current: string
  /** Shown first under the default filter: entries most likely to be wrong. */
  priority: boolean
  /** The specific question, where a bare word is not self-explanatory. */
  question?: string
  /** Live calls that put `current` in context. */
  examples: ReviewExample[]
}

export interface ReviewSection {
  id: string
  title: string
  blurb: string
  items: ReviewItem[]
}

export interface LocaleReview {
  /** The JS export identifier (`enGB`, not `en-GB`) — what a reviewer sees in every snippet. */
  code: string
  /** `Locale.code`, the BCP 47 tag. */
  tag: string
  name: string
  sections: ReviewSection[]
  itemCount: number
  priorityCount: number
}

/** A reviewer's judgement on one item. Absent from storage until they act. */
export interface Verdict {
  status: 'ok' | 'wrong'
  /** The correct word or phrase, when they supplied one. */
  suggestion?: string
  /** Free-text explanation. */
  note?: string
}

export type Verdicts = Record<string, Verdict>
