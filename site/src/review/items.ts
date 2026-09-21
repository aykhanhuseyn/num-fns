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
    }
  }

  /** A composed phrase: correcting it reports a wrong rule, not a wrong field. */
  output(
    slug: string,
    label: string,
    produce: () => string,
    priority = false,
    question?: string,
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
      'The raw vocabulary every spelled-out number is built from. A wrong entry here is wrong in thousands of outputs, so it is worth reading even though it looks obvious.',
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
      'The thousand / million / billion words, including every inflected form this language needs after different counts.',
    items,
  }
}

// --- Section 3: whole readings ---------------------------------------------

const READING_VALUES: readonly number[] = [
  21, 101, 115, 200, 999, 1000, 1001, 2000, 21000, 100000, 1000000, 2500000, 1000000000, -45, 0.5,
  1.01, 12.34, 2.675,
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
          `Agreement form used when counting a ${gender} noun.`,
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
    title: 'Whole readings',
    blurb:
      'Complete numbers as the library composes them — word order, elision, hyphens and spacing. Read each one aloud: if it is not what you would say, flag it.',
    items: [...items, ...genderedReadings(builder)],
  }
}

// --- Section 4: ordinals ----------------------------------------------------

const ORDINAL_VALUES: readonly number[] = [
  1, 2, 3, 4, 5, 8, 11, 12, 13, 20, 21, 30, 40, 100, 101, 1000, 2000, 25000, 1000000,
]

const PRIORITY_ORDINALS: ReadonlySet<number> = new Set([1, 2, 3, 11, 21, 1000, 2000])

function buildOrdinals(builder: Builder): ReviewSection {
  builder.section('ordinals')
  const items = ORDINAL_VALUES.map((value) => {
    const item = builder.output(
      `ordinal-${value}`,
      `ordinalToWords(${value})`,
      () => ordinalToWords(value, { locale: builder.locale }),
      PRIORITY_ORDINALS.has(value),
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
      'First / second / twenty-first, spelled out and as an abbreviated numeral. Declension and gender are out of scope for v1 — only the citation form is under review.',
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
    title: 'Abbreviated notation',
    blurb: 'The abbreviations used in compact output (“2.5M”, «2,5 млн») and their full words.',
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
      'What this language calls each currency and its subunit. Borrowed names are the likeliest mistakes in the whole package — a plausible-looking transliteration nobody actually writes.',
    items,
  }
}

// --- Section 7: money readings ---------------------------------------------

const MONEY_VALUES: readonly number[] = [1, 2, 5, 11, 21, 100, 0.99, 1.01, 2.5, 1000000]

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
    ),
  )
  for (const value of [1, 2, 21]) {
    items.push(
      builder.output(
        `money-${foreign}-${value}`,
        `moneyToWords(${value}, { currency: '${foreign}' })`,
        () => moneyToWords(value, { locale: builder.locale, currency: foreign }),
      ),
    )
  }
  return {
    id: 'money',
    title: 'Money read aloud',
    blurb: 'Full amounts as a person would say them, including the awkward ones near zero and one.',
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
  ]
  return {
    id: 'formatting',
    title: 'Number and money formatting',
    blurb: 'Separators and symbol placement — the conventions a reader notices immediately.',
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
      blurb: 'Not implemented for this locale yet — this is the gap we most need filled.',
      items: [
        builder.output(
          'fractions-missing',
          'fractionToWords — no vocabulary yet',
          () => fractionToWords(1, 2, { locale: builder.locale }),
          true,
          'The library refuses to guess here rather than invent fraction nouns. If you can write out 1/2, 1/3, 2/3, 3/4 and 5/8 in the suggestion box, we can implement this locale.',
        ),
      ],
    }
  }
  return {
    id: 'fractions',
    title: 'Fractions',
    blurb: 'Proper fractions spelled out, including any idiomatic word for one half.',
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
    title: 'Digit-by-digit reading',
    blurb: 'How a code or phone number is read out, one digit at a time.',
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
