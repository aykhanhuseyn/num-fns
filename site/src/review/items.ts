import {
  formatMoney,
  formatNumber,
  formatPercentage,
  fractionToWords,
  moneyToWords,
  numberToDigitWords,
  numberToWords,
  ordinalToWords,
  toLongNotation,
  toOrdinal,
  toShortNotation,
} from '../../../src/index'
import type { GrammaticalGender, Locale, PluralCategory } from '../../../src/locale/types'
import type { CurrencyCode } from '../../../src/money/currency'
import { localeInfo } from '../locales'
import { type CountedNoun, countGrammar, type Grammar, valueGrammar } from './grammar'
import { isPriorityPath, questionFor } from './questions'
import type { LocaleReview, ReviewExample, ReviewItem, ReviewSection } from './types'

/**
 * Builds the whole review corpus from the live `Locale` objects and the live
 * public functions — see `types.ts` for why nothing is hardcoded here.
 *
 * Every example is executed at page load rather than baked in, so an entry a
 * reviewer is looking at is by construction what the current source produces.
 * Calls that legitimately throw (`fractionToWords` for `ru`/`es`, a `gender`
 * a locale doesn't distinguish) are caught and shown as the error — that is
 * itself a reviewable fact, not a page crash.
 */

/** Runs a real call, surfacing a thrown error as the result instead of breaking the page. */
function run(call: () => string): string {
  try {
    return call()
  } catch (error) {
    return `⚠ ${error instanceof Error ? error.message : String(error)}`
  }
}

/** The smallest positive integer this locale assigns to `category`, for picking a demo value. */
function sampleFor(locale: Locale, category: PluralCategory): number {
  for (let n = 1; n <= 200; n++) {
    if (locale.plural(n) === category) return n
  }
  return 1
}

/** A builder bound to one locale, so every item shares its code, snippets and priority rules. */
class Builder {
  readonly code: string
  readonly locale: Locale
  private sectionId = ''

  constructor(code: string, locale: Locale) {
    this.code = code
    this.locale = locale
  }

  section(id: string): void {
    this.sectionId = id
  }

  /** The trailing options object as a reader would write it: `{ locale: ru, currency: 'USD' }`. */
  opts(extra?: string): string {
    return extra ? `{ locale: ${this.code}, ${extra} }` : `{ locale: ${this.code} }`
  }

  example(call: string, invoke: () => string): ReviewExample {
    return { call, result: run(invoke) }
  }

  /** `numberToWords(n, { locale })`, the example most items lean on. */
  words(value: number): ReviewExample {
    return this.example(`numberToWords(${value}, ${this.opts()})`, () =>
      numberToWords(value, { locale: this.locale }),
    )
  }

  /** An editable field of the locale object. */
  value(path: string, current: string, label: string, examples: ReviewExample[]): ReviewItem {
    return {
      id: `${this.code}/${this.sectionId}/${path}`,
      sectionId: this.sectionId,
      label,
      kind: 'value',
      path,
      current,
      priority: isPriorityPath(this.code, path),
      question: questionFor(this.code, path),
      examples,
      grammar: valueGrammar(this.locale, path),
    }
  }

  /** A composed phrase: correcting it reports a wrong rule, not a wrong field. */
  output(
    slug: string,
    label: string,
    produce: () => string,
    priority = false,
    question?: string,
    grammar?: Grammar,
  ): ReviewItem {
    return {
      id: `${this.code}/${this.sectionId}/${slug}`,
      sectionId: this.sectionId,
      label,
      kind: 'output',
      current: run(produce),
      priority,
      question,
      examples: [],
      grammar,
    }
  }
}

// --- Section 1: the counting words themselves -------------------------------

/** `ones`/`tens` share a shape: skip index 0 and any gap a locale leaves empty. */
function indexedWords(
  builder: Builder,
  list: readonly string[],
  field: string,
  numberAt: (index: number) => number,
  extra: (value: number) => number,
): ReviewItem[] {
  const items: ReviewItem[] = []
  list.forEach((word, index) => {
    if (index === 0 || !word) return
    const n = numberAt(index)
    items.push(
      builder.value(`words.${field}.${index}`, word, `${field}[${index}] — ${n}`, [
        builder.words(n),
        builder.words(extra(n)),
      ]),
    )
  })
  return items
}

function hundredsItems(builder: Builder): ReviewItem[] {
  const { hundreds } = builder.locale.words
  if (typeof hundreds === 'string') {
    return [
      builder.value('words.hundreds', hundreds, 'hundreds — the “hundred” word', [
        builder.words(100),
        builder.words(300),
        builder.words(945),
      ]),
    ]
  }
  return indexedWords(
    builder,
    hundreds,
    'hundreds',
    (index) => index * 100,
    (n) => n + 45,
  )
}

function connectorItems(builder: Builder): ReviewItem[] {
  const w = builder.locale.words
  const items: ReviewItem[] = [
    builder.value('words.negative', w.negative, 'negative — the “minus” word', [
      builder.words(-7),
      builder.words(-1250),
    ]),
    builder.value('words.infinity', w.infinity, 'infinity', [
      builder.example(`numberToWords(Infinity, ${builder.opts('noThrow: true')})`, () =>
        numberToWords(Number.POSITIVE_INFINITY, { locale: builder.locale, noThrow: true }),
      ),
    ]),
  ]
  if (w.decimalConnector !== undefined) {
    items.push(
      builder.value(
        'words.decimalConnector',
        w.decimalConnector,
        'decimalConnector — how the decimal mark is read aloud',
        [builder.words(12.34), builder.words(0.5)],
      ),
    )
  }
  if (w.and !== undefined) {
    items.push(
      builder.value('words.and', w.and, 'and — the tens/ones connector', [
        builder.words(35),
        builder.words(146),
      ]),
    )
  }
  return items
}

function buildNumerals(builder: Builder): ReviewSection {
  builder.section('numerals')
  const w = builder.locale.words
  const items: ReviewItem[] = [
    builder.value('words.zero', w.zero, 'zero — 0', [builder.words(0), builder.words(0.5)]),
    ...indexedWords(
      builder,
      w.ones,
      'ones',
      (index) => index,
      (n) => 200 + n,
    ),
  ]
  if (w.teens) {
    items.push(
      ...indexedWords(
        builder,
        w.teens,
        'teens',
        (index) => index + 11,
        (n) => 300 + n,
      ),
    )
  }
  items.push(
    ...indexedWords(
      builder,
      w.tens,
      'tens',
      (index) => index * 10,
      (n) => n + 3,
    ),
    ...hundredsItems(builder),
    ...connectorItems(builder),
  )
  return {
    id: 'numerals',
    title: 'Counting words',
    blurb:
      'The library makes every number in words from these basic words. An error here shows in many results. Read all entries. Also read the simple entries.',
    items,
  }
}

// --- Section 2: scale words -------------------------------------------------

function scaleCategoryItems(
  builder: Builder,
  index: number,
  forms: Partial<Record<PluralCategory, string>>,
): ReviewItem[] {
  const magnitude = 1000 ** index
  return Object.entries(forms).map(([category, word]) => {
    const demo = sampleFor(builder.locale, category as PluralCategory) * magnitude
    return builder.value(
      `words.scales.${index}.${category}`,
      word,
      `scales[${index}].${category} — after ${sampleFor(builder.locale, category as PluralCategory)}`,
      [builder.words(demo), builder.words(demo + magnitude * 20)],
    )
  })
}

function buildScales(builder: Builder): ReviewSection {
  builder.section('scales')
  const items: ReviewItem[] = []
  builder.locale.words.scales.forEach((entry, index) => {
    if (index === 0) return
    const magnitude = 1000 ** index
    if (typeof entry === 'string') {
      if (!entry) return
      items.push(
        builder.value(`words.scales.${index}`, entry, `scales[${index}] — 10^${index * 3}`, [
          builder.words(magnitude),
          builder.words(2 * magnitude),
          builder.words(5 * magnitude + 456),
        ]),
      )
      return
    }
    items.push(...scaleCategoryItems(builder, index, entry))
  })
  return {
    id: 'scales',
    title: 'Scale words',
    blurb:
      'The words for thousand, million and billion. This includes each form that the language uses after different counts.',
    items,
  }
}

// --- Section 3: whole readings ---------------------------------------------

const READING_VALUES: readonly number[] = [
  0, 7, 13, 15, 17, 21, 40, 70, 90, 99, 101, 110, 111, 115, 200, 300, 500, 700, 900, 999, 1000,
  1001, 1100, 1999, 2000, 2026, 10000, 11000, 21000, 100000, 101000, 123456, 1000000, 1000001,
  2000000, 2500000, 1000000000, 1500000000, 1000000000000, -1, -45, 0.5, 1.01, 12.34, 2.675,
]

/** Values whose reading depends on a composition rule rather than a single word. */
const PRIORITY_READINGS: ReadonlySet<number> = new Set([
  21, 101, 1000, 2000, 21000, 1000000, 1.01, 12.34,
])

function genderedReadings(builder: Builder): ReviewItem[] {
  const { genders, defaultGender } = builder.locale.words
  if (!genders) return []
  const items: ReviewItem[] = []
  for (const gender of genders) {
    if (gender === defaultGender) continue
    for (const value of [1, 2, 21, 200]) {
      items.push(
        builder.output(
          `gender-${gender}-${value}`,
          `numberToWords(${value}, { gender: '${gender}' })`,
          () => numberToWords(value, { locale: builder.locale, gender }),
          true,
          `The form to use when you count a ${gender} noun.`,
          { gender },
        ),
      )
    }
  }
  return items
}

function buildReadings(builder: Builder): ReviewSection {
  builder.section('readings')
  const items = READING_VALUES.map((value) =>
    builder.output(
      `reading-${value}`,
      `numberToWords(${value})`,
      () => numberToWords(value, { locale: builder.locale }),
      PRIORITY_READINGS.has(value),
    ),
  )
  return {
    id: 'readings',
    title: 'Full numbers in words',
    blurb:
      'Full numbers as the library makes them. Read each number aloud. If you do not say it like this, mark it as incorrect. Also examine word order, hyphens and spaces.',
    items: [...items, ...genderedReadings(builder)],
  }
}

// --- Section 3b: decimals --------------------------------------------------

/** Every decimal style path: tenths, hundredths, thousandths, leading zeros, a long tail, a sign. */
const DECIMAL_VALUES: readonly number[] = [
  1.5, 2.1, 0.05, 0.001, 3.125, 10.25, 99.99, 1.005, 0.000001, 123.456, -2.5, -0.75,
]

function buildDecimals(builder: Builder): ReviewSection {
  builder.section('decimals')
  return {
    id: 'decimals',
    title: 'Decimals',
    blurb:
      'Numbers with a decimal part, as a person says them. Examine the word after the whole part. Examine how a person reads the digits after the decimal mark.',
    items: DECIMAL_VALUES.map((value) =>
      builder.output(
        `decimal-${value}`,
        `numberToWords(${value})`,
        () => numberToWords(value, { locale: builder.locale }),
        true,
      ),
    ),
  }
}

// --- Section 4: ordinals ----------------------------------------------------

const ORDINAL_VALUES: readonly number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
  28, 29, 30, 31, 40, 50, 60, 70, 80, 90, 100, 101, 200, 500, 1000, 1001, 2000, 25000, 1000000,
]

const PRIORITY_ORDINALS: ReadonlySet<number> = new Set([1, 2, 3, 11, 21, 1000, 2000])

/**
 * Ordinals are adjectives and the library returns only their dictionary
 * form: masculine singular, and nominative where the language has case.
 * Saying so stops a reviewer flagging «первый» for not being «первая».
 */
function ordinalGrammar(locale: Locale): Grammar | undefined {
  if (!locale.words.genders) return undefined
  const nominative = countGrammar(locale, 1, undefined).case
  return {
    gender: locale.words.defaultGender,
    ...(nominative ? { case: nominative } : {}),
    number: 'singular',
    citation: true,
  }
}

function buildOrdinals(builder: Builder): ReviewSection {
  builder.section('ordinals')
  const items = ORDINAL_VALUES.map((value) => {
    const item = builder.output(
      `ordinal-${value}`,
      `ordinalToWords(${value})`,
      () => ordinalToWords(value, { locale: builder.locale }),
      PRIORITY_ORDINALS.has(value),
      undefined,
      ordinalGrammar(builder.locale),
    )
    item.examples = [
      builder.example(`toOrdinal(${value}, ${builder.opts()})`, () =>
        toOrdinal(value, { locale: builder.locale }),
      ),
    ]
    return item
  })
  return {
    id: 'ordinals',
    title: 'Ordinals',
    blurb:
      'First, second, twenty-first: in words and as a short numeral. Only the dictionary form is in this review. Version 1 does not include declension and gender.',
    items,
  }
}

// --- Section 5: notation ----------------------------------------------------

function buildNotation(builder: Builder): ReviewSection {
  builder.section('notation')
  const items: ReviewItem[] = []
  builder.locale.notation.scales.forEach((scale, index) => {
    const demo = scale.threshold * 2.5
    items.push(
      builder.value(
        `notation.scales.${index}.short`,
        scale.short,
        `short — ${scale.threshold.toExponential(0)}`,
        [
          builder.example(`toShortNotation(${demo}, ${builder.opts()})`, () =>
            toShortNotation(demo, { locale: builder.locale }),
          ),
        ],
      ),
      builder.value(
        `notation.scales.${index}.long`,
        scale.long,
        `long — ${scale.threshold.toExponential(0)}`,
        [
          builder.example(`toLongNotation(${scale.threshold + 234}, ${builder.opts()})`, () =>
            toLongNotation(scale.threshold + 234, { locale: builder.locale }),
          ),
        ],
      ),
    )
  })
  for (const value of [999, 1500, 25000, 999999, 1250000000, 3000000000000]) {
    items.push(
      builder.output(`short-${value}`, `toShortNotation(${value})`, () =>
        toShortNotation(value, { locale: builder.locale }),
      ),
    )
  }
  for (const value of [1500, 2000000, 1234567, 3000000000]) {
    items.push(
      builder.output(`long-${value}`, `toLongNotation(${value})`, () =>
        toLongNotation(value, { locale: builder.locale }),
      ),
    )
  }
  items.push(
    builder.value(
      'notation.spaceBeforeShort',
      String(builder.locale.notation.spaceBeforeShort),
      'spaceBeforeShort — space between number and abbreviation',
      [
        builder.example(`toShortNotation(2500000, ${builder.opts()})`, () =>
          toShortNotation(2500000, { locale: builder.locale }),
        ),
      ],
    ),
  )
  return {
    id: 'notation',
    title: 'Short notation',
    blurb: 'The abbreviations in short notation (“2.5M”, «2,5 млн») and their full words.',
    items,
  }
}

// --- Section 6: currency vocabulary ----------------------------------------

interface UnitSpec {
  role: 'major' | 'minor'
  word: string
  plurals?: Partial<Record<PluralCategory, string>>
  gender?: GrammaticalGender
}

/** A money value that reads out `count` of the unit in `role`. */
function moneyDemo(role: 'major' | 'minor', count: number): number {
  return role === 'major' ? count : 1 + count / 100
}

function unitItems(builder: Builder, currency: CurrencyCode, spec: UnitSpec): ReviewItem[] {
  const base = `currency.units.${currency}.${spec.role}`
  const say = (value: number): ReviewExample =>
    builder.example(`moneyToWords(${value}, ${builder.opts(`currency: '${currency}'`)})`, () =>
      moneyToWords(value, { locale: builder.locale, currency, includeZeroMinor: true }),
    )

  const items: ReviewItem[] = [
    builder.value(`${base}.word`, spec.word, `${currency} ${spec.role} — dictionary form`, [
      say(moneyDemo(spec.role, 2)),
      say(moneyDemo(spec.role, 1)),
    ]),
  ]
  for (const [category, form] of Object.entries(spec.plurals ?? {})) {
    const count = sampleFor(builder.locale, category as PluralCategory)
    items.push(
      builder.value(
        `${base}.plurals.${category}`,
        form,
        `${currency} ${spec.role} — after ${count} (${category})`,
        [say(moneyDemo(spec.role, count))],
      ),
    )
  }
  if (spec.gender) {
    items.push(
      builder.value(
        `${base}.gender`,
        spec.gender,
        `${currency} ${spec.role} — grammatical gender`,
        [say(moneyDemo(spec.role, 1)), say(moneyDemo(spec.role, 2))],
      ),
    )
  }
  return items
}

function buildCurrency(builder: Builder): ReviewSection {
  builder.section('currency')
  const items: ReviewItem[] = []
  for (const [code, units] of Object.entries(builder.locale.currency.units)) {
    if (!units) continue
    const currency = code as CurrencyCode
    items.push(
      ...unitItems(builder, currency, { role: 'major', ...units.major }),
      ...unitItems(builder, currency, { role: 'minor', ...units.minor }),
    )
  }
  return {
    id: 'currency',
    title: 'Currency words',
    blurb:
      'The name of each currency and its subunit in this language. Borrowed names have the highest risk of errors. A transliteration can look correct, but people do not use it.',
    items,
  }
}

// --- Section 7: money readings ---------------------------------------------

const MONEY_VALUES: readonly number[] = [
  1, 2, 5, 11, 21, 25, 100, 101, 1001, 0.01, 0.05, 0.99, 1.01, 2.5, 1000000,
]

/** Amounts read in every other currency: one, few, many, a minor unit alone, and both units. */
const FOREIGN_MONEY_VALUES: readonly number[] = [1, 2, 5, 21, 0.01, 1.5]

/**
 * The form each currency word must take in this reading: after 21 «рубль»
 * (nominative singular), after 2 «рубля» (genitive singular), after 5
 * «копеек» (genitive plural). The zero part is left out, as the reading
 * leaves it out unless it is the only part.
 */
function moneyGrammar(locale: Locale, currency: CurrencyCode, value: number): Grammar | undefined {
  const units = locale.currency.units[currency]
  if (!units) return undefined
  const cents = Math.round(Math.abs(value) * 100)
  const parts: [number, UnitSpec][] = [
    [Math.floor(cents / 100), { role: 'major', ...units.major }],
    [cents % 100, { role: 'minor', ...units.minor }],
  ]
  const counted: CountedNoun[] = parts
    .filter(([count]) => count > 0)
    .map(([count, unit]) => ({
      count,
      noun: unit.plurals?.[locale.plural(count)] ?? unit.word,
      ...countGrammar(locale, count, unit.gender),
    }))
  return counted.length > 0 ? { counted } : undefined
}

function buildMoney(builder: Builder): ReviewSection {
  builder.section('money')
  const own = builder.locale.currency.code
  const foreign: CurrencyCode = own === 'USD' ? 'EUR' : 'USD'
  const items = MONEY_VALUES.map((value) =>
    builder.output(
      `money-${own}-${value}`,
      `moneyToWords(${value}) — ${own}`,
      () => moneyToWords(value, { locale: builder.locale, currency: own }),
      value === 1.01 || value === 21 || value === 0.99,
      undefined,
      moneyGrammar(builder.locale, own, value),
    ),
  )
  // `foreign` keeps its first item ids (`money-USD-1`, …) so saved answers survive.
  const currencies = [
    foreign,
    ...(Object.keys(builder.locale.currency.units) as CurrencyCode[]).filter(
      (code) => code !== own && code !== foreign,
    ),
  ]
  for (const currency of currencies) {
    for (const value of FOREIGN_MONEY_VALUES) {
      items.push(
        builder.output(
          `money-${currency}-${value}`,
          `moneyToWords(${value}, { currency: '${currency}' })`,
          () => moneyToWords(value, { locale: builder.locale, currency }),
          false,
          undefined,
          moneyGrammar(builder.locale, currency, value),
        ),
      )
    }
  }
  return {
    id: 'money',
    title: 'Money in words',
    blurb: 'Full amounts as a person says them. This includes amounts near zero and one.',
    items,
  }
}

// --- Section 8: formatting conventions -------------------------------------

function buildFormatting(builder: Builder): ReviewSection {
  builder.section('formatting')
  const { formatDefaults, currency } = builder.locale
  const numberDemo = builder.example(
    `formatNumber(1234567.891, ${builder.opts('decimals: 2')})`,
    () => formatNumber(1234567.891, { locale: builder.locale, decimals: 2 }),
  )
  const moneyDemoExample = builder.example(`formatMoney(1234.5, ${builder.opts()})`, () =>
    formatMoney(1234.5, { locale: builder.locale }),
  )
  const items: ReviewItem[] = [
    builder.value(
      'formatDefaults.thousandsSeparator',
      formatDefaults.thousandsSeparator,
      'thousands separator',
      [numberDemo],
    ),
    builder.value(
      'formatDefaults.decimalSeparator',
      formatDefaults.decimalSeparator,
      'decimal separator',
      [numberDemo],
    ),
    builder.value('currency.code', currency.code, 'default currency when none is given', [
      moneyDemoExample,
    ]),
    builder.value(
      'currency.symbolPosition',
      currency.symbolPosition,
      'symbol before or after the amount',
      [moneyDemoExample],
    ),
    builder.output(
      'percentage',
      'formatPercentage(0.4567, { multiplyBy100: true, decimals: 1 })',
      () => formatPercentage(0.4567, { locale: builder.locale, multiplyBy100: true, decimals: 1 }),
    ),
    builder.output('percentage-negative', 'formatPercentage(-12.5)', () =>
      formatPercentage(-12.5, { locale: builder.locale }),
    ),
    builder.output('number-negative', 'formatNumber(-1234567.5)', () =>
      formatNumber(-1234567.5, { locale: builder.locale }),
    ),
    builder.output('money-negative', 'formatMoney(-1234.5)', () =>
      formatMoney(-1234.5, { locale: builder.locale }),
    ),
    ...(Object.keys(currency.units) as CurrencyCode[]).map((code) =>
      builder.output(`money-format-${code}`, `formatMoney(1234.5, { currency: '${code}' })`, () =>
        formatMoney(1234.5, { locale: builder.locale, currency: code }),
      ),
    ),
  ]
  return {
    id: 'formatting',
    title: 'Number and money formatting',
    blurb:
      'Separators and the position of the currency symbol. A reader sees errors here immediately.',
    items,
  }
}

// --- Section 9: fractions ---------------------------------------------------

const FRACTIONS: readonly (readonly [number, number])[] = [
  [1, 2],
  [1, 3],
  [2, 3],
  [1, 4],
  [3, 4],
  [5, 8],
  [7, 10],
]

function buildFractions(builder: Builder, supported: boolean): ReviewSection {
  builder.section('fractions')
  if (!supported) {
    return {
      id: 'fractions',
      title: 'Fractions',
      blurb: 'This locale has no fraction words yet. We need help here most.',
      items: [
        builder.output(
          'fractions-missing',
          'fractionToWords — no vocabulary yet',
          () => fractionToWords(1, 2, { locale: builder.locale }),
          true,
          'The library does not guess fraction words. Write 1/2, 1/3, 2/3, 3/4 and 5/8 in words in the correction field. Then we can add fractions for this locale.',
        ),
      ],
    }
  }
  return {
    id: 'fractions',
    title: 'Fractions',
    blurb:
      'Proper fractions in words. This includes the special word for one half, if the language has one.',
    items: FRACTIONS.map(([numerator, denominator]) =>
      builder.output(
        `fraction-${numerator}-${denominator}`,
        `fractionToWords(${numerator}, ${denominator})`,
        () => fractionToWords(numerator, denominator, { locale: builder.locale }),
        numerator === 1 && denominator === 2,
      ),
    ),
  }
}

// --- Section 10: digit-by-digit --------------------------------------------

function buildDigits(builder: Builder): ReviewSection {
  builder.section('digits')
  return {
    id: 'digits',
    title: 'Digit by digit',
    blurb: 'How a person reads a code or a phone number, one digit at a time.',
    items: [
      builder.output('digits-2026', 'numberToDigitWords(2026)', () =>
        numberToDigitWords(2026, { locale: builder.locale }),
      ),
      builder.output('digits-phone', "numberToDigitWords('0501234567')", () =>
        numberToDigitWords('0501234567', { locale: builder.locale }),
      ),
    ],
  }
}

// --- Assembly ---------------------------------------------------------------

function buildLocale(code: string, locale: Locale, fractionsSupported: boolean): LocaleReview {
  const builder = new Builder(code, locale)
  const sections = [
    buildNumerals(builder),
    buildScales(builder),
    buildReadings(builder),
    buildDecimals(builder),
    buildOrdinals(builder),
    buildNotation(builder),
    buildCurrency(builder),
    buildMoney(builder),
    buildFormatting(builder),
    buildFractions(builder, fractionsSupported),
    buildDigits(builder),
  ].filter((section) => section.items.length > 0)

  const items = sections.flatMap((section) => section.items)
  return {
    code,
    tag: locale.code,
    name: locale.name ?? code,
    sections,
    itemCount: items.length,
    priorityCount: items.filter((item) => item.priority).length,
  }
}

/** Every locale's review corpus, in the same order the playground lists them. */
export const reviews: LocaleReview[] = localeInfo.map((entry) =>
  buildLocale(entry.code, entry.locale, entry.fractionWordsSupported),
)
