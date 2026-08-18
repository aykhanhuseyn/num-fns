import { az, en, es, ru } from '../../src/locale/index'
import type { Locale } from '../../src/locale/types'

export interface LocaleInfo {
  code: string
  name: string
  locale: Locale
  /**
   * Whether `fractionToWords` has real vocabulary for this locale — the one
   * function that isn't uniformly implemented across all four launch
   * locales (see `src/number/fraction.ts`'s doc comment). Every other
   * locale-dependent function (numberToWords, ordinals, notation, money,
   * percentage) is implemented for all four.
   */
  fractionWordsSupported: boolean
}

/**
 * The four launch locales, in the order shown throughout the playground
 * (locale selects, the "Locales" reference section's table and preview).
 */
export const localeInfo: LocaleInfo[] = [
  { code: 'az', name: 'Azerbaijani', locale: az, fractionWordsSupported: true },
  { code: 'en', name: 'English', locale: en, fractionWordsSupported: true },
  { code: 'ru', name: 'Russian', locale: ru, fractionWordsSupported: false },
  { code: 'es', name: 'Spanish', locale: es, fractionWordsSupported: false },
]

/** Locale code -> real `Locale` object, for resolving a playground select's raw value into what the real function call needs. */
export const localeByCode: Record<string, Locale> = Object.fromEntries(
  localeInfo.map((entry) => [entry.code, entry.locale]),
)

/** Shared `<select>` options for a function example's `locale` field. */
export const LOCALE_SELECT_OPTIONS = localeInfo.map((entry) => ({
  value: entry.code,
  label: `${entry.name} (${entry.code})`,
}))
