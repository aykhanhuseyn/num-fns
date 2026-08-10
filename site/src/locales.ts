import { az, en, es, ru } from '../../src/locale/index'
import type { Locale } from '../../src/locale/types'

export interface LocaleStatusRow {
  code: string
  name: string
  status: 'Implemented' | 'Data ready — not wired in yet'
  locale: Locale
}

/**
 * `az` is the only locale actually threaded through the public functions
 * today (numberToWords, formatNumber, etc. still read module-level
 * Azerbaijani defaults). `en`/`ru`/`es` exist as real `Locale` objects under
 * `src/locale/` but nothing consumes them yet — see `todo.md` §1's "Thread a
 * locale option through every public function" item.
 */
export const localeStatus: LocaleStatusRow[] = [
  { code: 'az', name: 'Azerbaijani', status: 'Implemented', locale: az },
  { code: 'en', name: 'English', status: 'Data ready — not wired in yet', locale: en },
  { code: 'ru', name: 'Russian', status: 'Data ready — not wired in yet', locale: ru },
  { code: 'es', name: 'Spanish', status: 'Data ready — not wired in yet', locale: es },
]
