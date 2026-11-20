import { LOCALE_SELECT_OPTIONS } from './locales'
import type { FieldDef } from './types'

/**
 * Every option every public function takes, with its type, its real default
 * and what it does. One table feeds both pages: the docs page prints it, and
 * the playground turns each entry into a control (`optionField`), so a
 * function never has an option the playground cannot set.
 *
 * The text follows the JSDoc in `src/shared/types.ts` (and `src/config.ts`,
 * `src/stats/variance.ts`, `src/financial/compound-interest.ts`). When an
 * option is added there, add it here; `catalog.ts` throws at load time for a
 * function listed below whose playground entry is missing.
 */
export interface OptionDoc {
  key: string
  /** The TypeScript type, as written in the options interface. */
  type: string
  /** The value the function uses when the option is omitted. */
  defaultValue: string
  description: string
}

type OptionInfo = Omit<OptionDoc, 'key'>

const BASE: Readonly<Record<string, OptionInfo>> = {
  locale: {
    type: 'Locale',
    defaultValue: 'en',
    description:
      'Locale object from num-fns/locale (az, en, enGB, ru, es) that supplies words, separators and other conventions.',
  },
  noThrow: {
    type: 'boolean',
    defaultValue: 'getConfig().noThrow (false)',
    description:
      'Return an empty value ("" for text, NaN for numbers) instead of throwing on bad input. Overrides setConfig for this call.',
  },
  decimals: {
    type: 'number',
    defaultValue: 'natural precision',
    description: 'Number of fractional digits to keep. A non-negative integer.',
  },
  thousandsSeparator: {
    type: 'string',
    defaultValue: 'locale.formatDefaults.thousandsSeparator',
    description: 'Separator between groups of integer digits.',
  },
  decimalSeparator: {
    type: 'string',
    defaultValue: 'locale.formatDefaults.decimalSeparator',
    description: 'Separator between the integer and the fractional part.',
  },
  roundingMode: {
    type: "'halfUp' | 'halfDown' | 'halfEven' | 'ceil' | 'floor'",
    defaultValue: "'halfUp'",
    description:
      'How to round to `decimals` digits, decimal-safely. No effect when `decimals` is omitted.',
  },
  output: {
    type: "'number' | 'bigint'",
    defaultValue: "'number'",
    description:
      "Return type. 'bigint' is exact past Number.MAX_SAFE_INTEGER and throws RangeError for a value that is not whole.",
  },
  gender: {
    type: "'masculine' | 'feminine' | 'neuter'",
    defaultValue: 'locale.words.defaultGender',
    description:
      'Grammatical gender of the counted noun (ru один/одна/одно, es uno/una). Throws RangeError for a gender the locale does not have (az and en have none, es has no neuter).',
  },
  separator: {
    type: 'string',
    defaultValue: "' '",
    description: 'String put between the parts.',
  },
  groupSeparator: {
    type: 'string',
    defaultValue: "' '",
    description: 'Separator between scale groups. Must not be empty and must not contain a digit.',
  },
  currency: {
    type: "'AZN' | 'USD' | 'EUR' | 'RUB' | 'GBP'",
    defaultValue: 'locale.currency.code',
    description:
      'ISO 4217 code. Selects the symbol and the unit words. Throws RangeError for an unknown code.',
  },
  symbol: {
    type: 'string',
    defaultValue: 'getCurrency(currency).symbol',
    description: 'Currency symbol to use.',
  },
  symbolPosition: {
    type: "'before' | 'after'",
    defaultValue: 'locale.currency.symbolPosition',
    description: 'Puts the symbol before or after the amount.',
  },
  symbolSpacing: {
    type: 'boolean',
    defaultValue: 'locale.currency.symbolSpacing',
    description: 'Puts a space between the symbol and the amount.',
  },
  majorUnit: {
    type: 'string',
    defaultValue: "the locale's word for the currency",
    description: 'Word for the major unit (dollar, manat, рубль).',
  },
  minorUnit: {
    type: 'string',
    defaultValue: "the locale's word for the subunit",
    description: 'Word for the minor unit (cent, qəpik, копейка).',
  },
  includeZeroMinor: {
    type: 'boolean',
    defaultValue: 'false',
    description: 'Say the minor unit also when it is zero ("five dollars and zero cents").',
  },
  space: {
    type: 'boolean',
    defaultValue: 'false',
    description: 'Puts a space between the number and the unit sign.',
  },
  multiplyBy100: {
    type: 'boolean',
    defaultValue: 'false',
    description:
      "Multiply by the unit's scale (100 for %, 1000 for ‰, 10000 for ‱) first, so 0.5 shows as 50%.",
  },
  unit: {
    type: "'percent' | 'permille' | 'basisPoint'",
    defaultValue: "'percent'",
    description: 'Which sign to use: % (percent), ‰ (permille) or ‱ (basis point).',
  },
  asRatio: {
    type: 'boolean',
    defaultValue: 'false',
    description: 'Divide by the unit scale, so "50%" returns 0.5 instead of 50.',
  },
  base: {
    type: '1000 | 1024',
    defaultValue: '1024',
    description: '1024 for binary sizes (the usual KB/MB), 1000 for decimal SI sizes.',
  },
  compoundsPerPeriod: {
    type: 'number',
    defaultValue: '1',
    description: 'How many times interest compounds in one period of time (12 = monthly).',
  },
  sample: {
    type: 'boolean',
    defaultValue: 'false',
    description: 'Sample statistic (divide by n − 1) instead of population (divide by n).',
  },
}

/** A key, or a key with the parts that differ for this function. */
type Entry = string | readonly [string, Partial<OptionInfo>]

const FORMAT: readonly Entry[] = [
  'decimals',
  'thousandsSeparator',
  'decimalSeparator',
  'roundingMode',
  'locale',
]
const PARSE: readonly Entry[] = ['thousandsSeparator', 'decimalSeparator', 'locale', 'output']

const BY_FUNCTION: Readonly<Record<string, readonly Entry[]>> = {
  formatNumber: [...FORMAT, 'noThrow'],
  parseNumber: [...PARSE, 'noThrow'],
  numberToWords: ['locale', 'gender', 'noThrow'],
  numberToDigitWords: ['locale', 'separator', 'noThrow'],
  fractionToWords: [
    [
      'locale',
      {
        description: 'Locale for the fraction words. ru and es have none yet and throw RangeError.',
      },
    ],
    'noThrow',
  ],
  getOrdinalSuffix: ['locale', 'noThrow'],
  toOrdinal: [
    'locale',
    [
      'separator',
      {
        defaultValue: 'locale.ordinal.separator',
        description: "String between the digits and the suffix (en '' → 3rd, az '-' → 3-cü).",
      },
    ],
    'noThrow',
  ],
  ordinalToWords: ['locale', 'noThrow'],
  cardinalToOrdinalWords: ['locale', 'noThrow'],
  withSuffix: [
    ['separator', { description: 'String between the value and the suffix.' }],
    'noThrow',
  ],
  toShortNotation: [
    ['decimals', { defaultValue: '1' }],
    [
      'locale',
      { description: 'Locale for the scale abbreviations (en K/M/B/T, ru тыс/млн/млрд).' },
    ],
    'decimalSeparator',
    'noThrow',
  ],
  parseShortNotation: ['locale', 'decimalSeparator', 'output', 'noThrow'],
  toLongNotation: ['locale', 'groupSeparator', 'noThrow'],
  parseLongNotation: ['locale', 'groupSeparator', 'output', 'noThrow'],
  toByteSize: [
    ['decimals', { defaultValue: '2' }],
    'base',
    ['decimalSeparator', { defaultValue: "'.'" }],
    'noThrow',
  ],
  parseByteSize: ['base', ['decimalSeparator', { defaultValue: "'.'" }], 'output', 'noThrow'],
  formatMoney: [
    'locale',
    'currency',
    ['decimals', { defaultValue: "the currency's minor-unit digits (2)" }],
    'symbol',
    'symbolPosition',
    'symbolSpacing',
    'thousandsSeparator',
    'decimalSeparator',
    'roundingMode',
    'noThrow',
  ],
  parseMoney: [
    'locale',
    ['currency', { description: 'ISO 4217 code whose symbol to strip.' }],
    ['symbol', { description: 'Currency symbol to strip before parsing.' }],
    'thousandsSeparator',
    'decimalSeparator',
    'output',
    'noThrow',
  ],
  moneyToWords: ['locale', 'currency', 'majorUnit', 'minorUnit', 'includeZeroMinor', 'noThrow'],
  formatPercentage: [
    'locale',
    'decimals',
    'multiplyBy100',
    'space',
    'unit',
    'thousandsSeparator',
    'decimalSeparator',
    'roundingMode',
    'noThrow',
  ],
  parsePercentage: [
    'locale',
    'asRatio',
    'unit',
    'thousandsSeparator',
    'decimalSeparator',
    'output',
    'noThrow',
  ],
  compoundInterest: ['compoundsPerPeriod', 'noThrow'],
  variance: ['sample', 'noThrow'],
  standardDeviation: ['sample', 'noThrow'],
  fromBase: ['output', 'noThrow'],
}

/** The documented options of one function, in the order the docs and the playground show them. */
export function optionsFor(name: string): OptionDoc[] {
  return (BY_FUNCTION[name] ?? []).map((entry) => {
    const [key, override] = typeof entry === 'string' ? [entry, {}] : entry
    const base = BASE[key]
    if (!base) throw new Error(`options: no description for option "${key}" of ${name}`)
    return { key, ...base, ...override }
  })
}

/** Whether a function takes an options object at all (others follow only `setConfig`). */
export function hasOptions(name: string): boolean {
  return name in BY_FUNCTION
}

// --- playground controls ----------------------------------------------------

const ROUNDING_MODES = ['halfUp', 'halfDown', 'halfEven', 'ceil', 'floor']
const CURRENCIES = ['AZN', 'USD', 'EUR', 'RUB', 'GBP']

function select(
  key: string,
  values: readonly string[],
  valueType: FieldDef['valueType'] = 'string',
): FieldDef {
  return {
    id: key,
    label: key,
    kind: 'select',
    valueType,
    default: '',
    omitWhenDefault: true,
    selectOptions: [
      { value: '', label: '(default)' },
      ...values.map((value) => ({ value, label: value })),
    ],
    arg: { kind: 'option', key },
  }
}

function text(key: string, placeholder: string): FieldDef {
  return {
    id: key,
    label: key,
    kind: 'text',
    valueType: 'string',
    default: '',
    omitWhenDefault: true,
    placeholder,
    arg: { kind: 'option', key },
  }
}

/**
 * The playground control for an option the hand-written registry entry does
 * not declare. Every one is "unset" by default (blank, or "(default)"), and an
 * unset option is left out of the call, so adding it never changes a result.
 */
export function optionField(doc: OptionDoc): FieldDef {
  switch (doc.key) {
    case 'locale':
      return {
        id: 'locale',
        label: 'locale',
        kind: 'select',
        valueType: 'locale',
        default: 'en',
        omitWhenDefault: true,
        selectOptions: LOCALE_SELECT_OPTIONS,
        arg: { kind: 'option', key: 'locale' },
      }
    case 'gender':
      return select('gender', ['masculine', 'feminine', 'neuter'])
    case 'roundingMode':
      return select('roundingMode', ROUNDING_MODES)
    case 'output':
      return select('output', ['number', 'bigint'])
    case 'currency':
      return select('currency', CURRENCIES)
    case 'symbolPosition':
      return select('symbolPosition', ['before', 'after'])
    case 'unit':
      return select('unit', ['percent', 'permille', 'basisPoint'])
    case 'base':
      return select('base', ['1024', '1000'], 'number')
    case 'noThrow':
    case 'symbolSpacing':
    case 'includeZeroMinor':
    case 'space':
    case 'multiplyBy100':
    case 'asRatio':
    case 'sample':
      return select(doc.key, ['true', 'false'], 'boolean')
    case 'decimals':
    case 'compoundsPerPeriod':
      return {
        id: doc.key,
        label: doc.key,
        kind: 'number',
        valueType: 'number',
        default: '',
        omitWhenDefault: true,
        step: '1',
        placeholder: doc.defaultValue,
        arg: { kind: 'option', key: doc.key },
      }
    default:
      return text(doc.key, doc.defaultValue)
  }
}
