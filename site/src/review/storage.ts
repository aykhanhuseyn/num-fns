import type { Verdicts } from './types'

/**
 * Per-browser persistence for a review in progress. A vocabulary sweep is a
 * long sitting, so a reviewer must be able to close the tab and come back — but
 * nothing here leaves their machine until they submit, which is the whole point
 * of a review page with no backend.
 *
 * Every access is guarded: `localStorage` throws outright in a Safari private
 * window and can be disabled by policy, and losing saved progress is a worse
 * outcome than a page that simply doesn't remember.
 */

/** Bumped only if the stored shape changes; a mismatch drops old state rather than mis-reading it. */
const SCHEMA = 'v1'

function keyFor(localeCode: string): string {
  return `num-fns.review.${SCHEMA}.${localeCode}`
}

export function loadVerdicts(localeCode: string): Verdicts {
  try {
    const raw = localStorage.getItem(keyFor(localeCode))
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed as Verdicts
  } catch {
    return {}
  }
}

export function saveVerdicts(localeCode: string, verdicts: Verdicts): void {
  try {
    localStorage.setItem(keyFor(localeCode), JSON.stringify(verdicts))
  } catch {
    // Storage unavailable or full: the review still works for this sitting.
  }
}

export function clearVerdicts(localeCode: string): void {
  try {
    localStorage.removeItem(keyFor(localeCode))
  } catch {
    // Nothing to do — see above.
  }
}

/** The reviewer's name, remembered across locales so it is typed once. */
const NAME_KEY = `num-fns.review.${SCHEMA}.reviewer`

export function loadReviewer(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveReviewer(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name)
  } catch {
    // See above.
  }
}
