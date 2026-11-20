import { numberToWords } from '../../../src/index'
import type { GrammaticalGender, Locale, PluralCategory } from '../../../src/locale/types'

/**
 * Grammar facts shown on a review card, so a reviewer judges a word in the
 * form it is meant to be in. A bare «копейки» is not a question anyone can
 * answer; «копейки — feminine, genitive singular, used after 2–4, 22–24…»
 * is.
 *
 * Every fact is derived from the live `Locale` object (its plural rule, its
 * declared genders, the unit genders) or from a live call; the only hand
 * table is {@link CATEGORY_FORMS}, which names the grammatical case and number
 * a plural category selects in each language. That mapping is a fact of the
 * language, not of this library.
 */

type GrammarCase = 'nominative' | 'genitive'
type GrammarNumber = 'singular' | 'plural'

interface GenderForm {
  gender: GrammaticalGender
  text: string
}

export interface Grammar {
  gender?: GrammaticalGender
  case?: GrammarCase
  number?: GrammarNumber
  /** Counts that select this form, compressed: `"2–4, 22–24, 32–34"`. */
  usedAfter?: string
  /** The same count word in each gender, when the forms differ (один / одна / одно). */
  forms?: GenderForm[]
  /** This is the dictionary (citation) form: nominative, singular, masculine where it applies. */
  citation?: boolean
  /** For a money reading: each counted noun and the form the count selects. */
  counted?: CountedNoun[]
}

export interface CountedNoun {
  count: number
  noun: string
  gender?: GrammaticalGender
  case?: GrammarCase
  number?: GrammarNumber
}

interface CaseNumber {
  case?: GrammarCase
  number: GrammarNumber
}

/**
 * Which case and number of the counted noun each plural category selects,
 * per locale tag. Russian: 1 → nominative singular (рубль), 2–4 → genitive
 * singular (рубля), 5+ → genitive plural (рублей); a fraction (1,5) →
 * genitive singular (рубля). Languages without noun case after numerals
 * only say singular or plural; Azerbaijani keeps the noun singular after
 * every number (iki manat).
 */
const CATEGORY_FORMS: Readonly<Record<string, Partial<Record<PluralCategory, CaseNumber>>>> = {
  ru: {
    one: { case: 'nominative', number: 'singular' },
    few: { case: 'genitive', number: 'singular' },
    many: { case: 'genitive', number: 'plural' },
    other: { case: 'genitive', number: 'singular' },
  },
  es: { one: { number: 'singular' }, other: { number: 'plural' } },
  en: { one: { number: 'singular' }, other: { number: 'plural' } },
  'en-GB': { one: { number: 'singular' }, other: { number: 'plural' } },
  az: { other: { number: 'singular' } },
}

const DASH = '–'

/** `[2, 3, 4, 22, 23, 24]` → `"2–4, 22–24"`. */
function compress(values: readonly number[]): string {
  const parts: string[] = []
  let start = values[0]
  let previous = start
  for (const value of [...values.slice(1), Number.NaN]) {
    if (start === undefined || previous === undefined) break
    if (value === previous + 1) {
      previous = value
      continue
    }
    parts.push(start === previous ? String(start) : `${start}${DASH}${previous}`)
    start = value
    previous = value
  }
  return parts.join(', ')
}

/** The whole numbers up to 40 that select `category`, e.g. `"1, 21, 31…"`. */
function usedAfter(locale: Locale, category: PluralCategory): string | undefined {
  const values: number[] = []
  for (let n = 0; n <= 40; n++) if (locale.plural(n) === category) values.push(n)
  if (values.length === 0) return undefined
  return values.length === 41 ? undefined : `${compress(values)}…`
}

/** Case and number for a plural category in this locale, plus the counts that pick it. */
function categoryGrammar(locale: Locale, category: PluralCategory): Grammar {
  const form = CATEGORY_FORMS[locale.code]?.[category]
  return {
    ...(form?.case ? { case: form.case } : {}),
    ...(form ? { number: form.number } : {}),
    usedAfter: usedAfter(locale, category),
  }
}

/** The count word for `value` in every gender this locale has, when they differ. */
function genderForms(locale: Locale, value: number): GenderForm[] | undefined {
  const genders = locale.words.genders
  if (!genders || genders.length < 2) return undefined
  const forms = genders.map((gender) => ({
    gender,
    text: numberToWords(value, { locale, gender }),
  }))
  return new Set(forms.map((form) => form.text)).size > 1 ? forms : undefined
}

/**
 * The gender a scale noun forces on its count word, read from live output:
 * `numberToWords(1000, { locale: ru })` starts with «одна», the feminine «1»,
 * so «тысяча» is feminine. Undefined when the output does not say (a locale
 * without genders, or one that drops «1» before the scale word).
 */
function scaleGender(locale: Locale, magnitude: number): GrammaticalGender | undefined {
  const genders = locale.words.genders
  if (!genders) return undefined
  const first = numberToWords(magnitude, { locale }).split(' ')[0]
  const matches = genders.filter((gender) => numberToWords(1, { locale, gender }) === first)
  return matches.length === 1 ? matches[0] : undefined
}

const PLURALS_PATH = /\.plurals\.(zero|one|two|few|many|other)$/
const UNIT_PATH = /^currency\.units\.([A-Z]{3})\.(major|minor)\.(word|gender|plurals)/
const SCALE_PATH = /^words\.scales\.(\d+)(?:\.(zero|one|two|few|many|other))?$/
const COUNT_WORD_PATH = /^words\.(ones|tens|hundreds)\.(\d+)$/

function unitGrammar(locale: Locale, path: string): Grammar | undefined {
  const match = UNIT_PATH.exec(path)
  if (!match) return undefined
  const [, code, role, field] = match
  const units = locale.currency.units[code as keyof typeof locale.currency.units]
  const unit = units?.[role as 'major' | 'minor']
  const gender = unit?.gender
  const withGender = gender ? { gender } : {}
  if (field === 'word')
    return { ...withGender, case: caseOfCitation(locale), number: 'singular', citation: true }
  // The gender item itself: show what it changes, «один» against «одна».
  if (field === 'gender') return { ...withGender, forms: genderForms(locale, 1) }
  const category = PLURALS_PATH.exec(path)?.[1] as PluralCategory | undefined
  return category ? { ...withGender, ...categoryGrammar(locale, category) } : withGender
}

/** Only languages with noun case get a case on the citation form. */
function caseOfCitation(locale: Locale): GrammarCase | undefined {
  return CATEGORY_FORMS[locale.code]?.one?.case
}

function scaleGrammar(locale: Locale, path: string): Grammar | undefined {
  const match = SCALE_PATH.exec(path)
  if (!match) return undefined
  const index = Number(match[1])
  const category = match[2] as PluralCategory | undefined
  const gender = scaleGender(locale, 1000 ** index)
  return {
    ...(gender ? { gender } : {}),
    ...(category ? categoryGrammar(locale, category) : {}),
  }
}

function countWordGrammar(locale: Locale, path: string): Grammar | undefined {
  const match = COUNT_WORD_PATH.exec(path)
  if (!match) return undefined
  const scale = { ones: 1, tens: 10, hundreds: 100 }[match[1] as 'ones' | 'tens' | 'hundreds']
  const forms = genderForms(locale, Number(match[2]) * scale)
  if (!forms) return undefined
  return { gender: locale.words.defaultGender, forms, citation: true }
}

/** Grammar for a `'value'` item, from its path into the `Locale` object. */
export function valueGrammar(locale: Locale, path: string): Grammar | undefined {
  const grammar =
    unitGrammar(locale, path) ?? scaleGrammar(locale, path) ?? countWordGrammar(locale, path)
  if (!grammar) return undefined
  const cleaned = Object.fromEntries(
    Object.entries(grammar).filter(([, value]) => value !== undefined),
  ) as Grammar
  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}

/**
 * Case and number a count selects for the noun after it, with the noun's
 * gender: in ru, 21 → nominative singular, 2 → genitive singular.
 */
export function countGrammar(
  locale: Locale,
  count: number,
  gender: GrammaticalGender | undefined,
): Omit<CountedNoun, 'count' | 'noun'> {
  const form = CATEGORY_FORMS[locale.code]?.[locale.plural(count)]
  return {
    ...(gender ? { gender } : {}),
    ...(form?.case ? { case: form.case } : {}),
    ...(form ? { number: form.number } : {}),
  }
}
