import {
  amortizationSchedule,
  cardinalToOrdinalWords,
  clamp,
  compoundInterest,
  formatMoney,
  formatNumber,
  formatPercentage,
  fractionToWords,
  fromBase,
  fromRoman,
  futureValue,
  getOrdinalSuffix,
  inRange,
  isEven,
  isOdd,
  loanPayment,
  max,
  mean,
  median,
  min,
  mode,
  moneyToWords,
  numberToDigitWords,
  numberToWords,
  ordinalToWords,
  parseByteSize,
  parseLongNotation,
  parseMoney,
  parseNumber,
  parsePercentage,
  parseShortNotation,
  percentile,
  presentValue,
  quantile,
  simpleInterest,
  standardDeviation,
  sum,
  toBase,
  toByteSize,
  toLongNotation,
  toOrdinal,
  toRoman,
  toShortNotation,
  variance,
  withSuffix,
} from '../../src/index'
import type { Category, FunctionExample, PlaygroundFn } from './types'

/** Real num-fns exports are precisely typed; the playground engine drives all of them generically, so cast once per entry instead of loosening the library's own types. */
function fn(value: (...args: never[]) => unknown): PlaygroundFn {
  return value as unknown as PlaygroundFn
}

const ROUNDING_MODES = [
  { value: 'halfUp', label: 'halfUp (default)' },
  { value: 'halfDown', label: 'halfDown' },
  { value: 'halfEven', label: 'halfEven' },
  { value: 'ceil', label: 'ceil' },
  { value: 'floor', label: 'floor' },
]

const numberCategory: Category = {
  id: 'number-format',
  title: 'Number formatting & parsing',
  description:
    'The base formatter every other formatter (money, percentage) delegates to for grouping digits and joining the fractional part. Azerbaijani defaults: space as thousands separator, comma as decimal separator.',
  examples: [
    {
      id: 'formatNumber',
      name: 'formatNumber',
      signature: '(value: number, options?: NumberFormatOptions): string',
      description:
        'Formats a number using Azerbaijani conventions by default. Throws RangeError if value is not finite.',
      sourceFile: 'src/number/format.ts',
      fn: fn(formatNumber),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 1234567.891,
          step: 'any',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'decimals',
          label: 'decimals',
          kind: 'number',
          valueType: 'number',
          default: 2,
          step: '1',
          arg: { kind: 'option', key: 'decimals' },
        },
        {
          id: 'thousandsSeparator',
          label: 'thousandsSeparator',
          kind: 'text',
          valueType: 'string',
          default: ' ',
          arg: { kind: 'option', key: 'thousandsSeparator' },
        },
        {
          id: 'decimalSeparator',
          label: 'decimalSeparator',
          kind: 'text',
          valueType: 'string',
          default: ',',
          arg: { kind: 'option', key: 'decimalSeparator' },
        },
        {
          id: 'roundingMode',
          label: 'roundingMode',
          kind: 'select',
          valueType: 'string',
          default: 'halfUp',
          selectOptions: ROUNDING_MODES,
          arg: { kind: 'option', key: 'roundingMode' },
        },
      ],
    },
    {
      id: 'parseNumber',
      name: 'parseNumber',
      signature: '(value: string, options?: NumberParseOptions): number',
      description:
        'Parses a string produced by formatNumber (or an equivalent format) back into a JavaScript number. Throws SyntaxError on unparseable input.',
      sourceFile: 'src/number/format.ts',
      fn: fn(parseNumber),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'text',
          valueType: 'string',
          default: '1 234 567,89',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'thousandsSeparator',
          label: 'thousandsSeparator',
          kind: 'text',
          valueType: 'string',
          default: ' ',
          arg: { kind: 'option', key: 'thousandsSeparator' },
        },
        {
          id: 'decimalSeparator',
          label: 'decimalSeparator',
          kind: 'text',
          valueType: 'string',
          default: ',',
          arg: { kind: 'option', key: 'decimalSeparator' },
        },
      ],
    },
  ],
}

const wordsCategory: Category = {
  id: 'words',
  title: 'Numbers as words',
  description:
    'The linguistic core of the package: spells out Azerbaijani cardinal numbers by grouping into base-1000 chunks and applying two irregular rules — "min" (not "bir min") for exactly 1000 at the thousands scale, but "bir milyon" for exactly 1,000,000 at every scale above thousands.',
  examples: [
    {
      id: 'numberToWords',
      name: 'numberToWords',
      signature: '(value: number): string',
      description:
        'Spells out a number as Azerbaijani cardinal words. Supports integers up to the trillion range, negative numbers, and up to two decimal digits (read as "tam" + a whole number).',
      sourceFile: 'src/number/words.ts',
      fn: fn(numberToWords),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 1234,
          step: 'any',
          arg: { kind: 'positional', index: 0 },
        },
      ],
    },
    {
      id: 'numberToDigitWords',
      name: 'numberToDigitWords',
      signature: '(value: number | string, options?: DigitWordsOptions): string',
      description:
        'Reads a number or numeric string digit by digit, the way phone numbers and codes are read aloud, e.g. "055" becomes "sıfır beş beş" — not "əlli beş". Punctuation like spaces, "-", "()", "." and a leading "+" is ignored.',
      sourceFile: 'src/number/digits.ts',
      fn: fn(numberToDigitWords),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'text',
          valueType: 'string',
          default: '+994 55 123 45 67',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'separator',
          label: 'separator',
          kind: 'text',
          valueType: 'string',
          default: ' ',
          arg: { kind: 'option', key: 'separator' },
        },
      ],
    },
    {
      id: 'fractionToWords',
      name: 'fractionToWords',
      signature: '(numerator: number, denominator: number): string',
      description:
        'Spells out a proper fraction as Azerbaijani words. The denominator takes the locative case ("üçdə" = "in three") and 1/2 is the idiomatic "yarım" rather than "ikidə bir". Throws RangeError for mixed numbers or improper fractions.',
      sourceFile: 'src/number/fraction.ts',
      fn: fn(fractionToWords),
      fields: [
        {
          id: 'numerator',
          label: 'numerator',
          kind: 'number',
          valueType: 'number',
          default: 1,
          step: '1',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'denominator',
          label: 'denominator',
          kind: 'number',
          valueType: 'number',
          default: 3,
          step: '1',
          arg: { kind: 'positional', index: 1 },
        },
      ],
    },
  ],
}

const ordinalCategory: Category = {
  id: 'ordinals',
  title: 'Ordinals & suffixes',
  description:
    'The Azerbaijani ordinal suffix ("cı"/"ci"/"cu"/"cü") is derived from vowel harmony on the last vowel of the last word of the cardinal reading, not a hardcoded lookup table — so it stays correct for every value numberToWords can spell.',
  examples: [
    {
      id: 'getOrdinalSuffix',
      name: 'getOrdinalSuffix',
      signature: '(value: number): string',
      description: 'Returns just the ordinal suffix for a non-negative integer, e.g. 9 -> "cu".',
      sourceFile: 'src/number/suffix.ts',
      fn: fn(getOrdinalSuffix),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 9,
          step: '1',
          arg: { kind: 'positional', index: 0 },
        },
      ],
    },
    {
      id: 'toOrdinal',
      name: 'toOrdinal',
      signature: '(value: number, separator?: string): string',
      description: 'Formats a non-negative integer as an Azerbaijani ordinal, e.g. 3 -> "3-cü".',
      sourceFile: 'src/number/suffix.ts',
      fn: fn(toOrdinal),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 3,
          step: '1',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'separator',
          label: 'separator',
          kind: 'text',
          valueType: 'string',
          default: '-',
          arg: { kind: 'positional', index: 1 },
        },
      ],
    },
    {
      id: 'ordinalToWords',
      name: 'ordinalToWords',
      signature: '(value: number): string',
      description:
        'Spells out a non-negative integer as a full Azerbaijani ordinal word by replacing the last word of the cardinal reading with its ordinal form, e.g. 21 -> "iyirmi birinci".',
      sourceFile: 'src/number/suffix.ts',
      fn: fn(ordinalToWords),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 21,
          step: '1',
          arg: { kind: 'positional', index: 0 },
        },
      ],
    },
    {
      id: 'cardinalToOrdinalWords',
      name: 'cardinalToOrdinalWords',
      signature: '(cardinalWords: string): string',
      description:
        'Transforms an already-computed cardinal reading into its full ordinal form. Split out from ordinalToWords so locale objects can reuse it without recomputing the cardinal words.',
      sourceFile: 'src/number/suffix.ts',
      fn: fn(cardinalToOrdinalWords),
      fields: [
        {
          id: 'cardinalWords',
          label: 'cardinalWords',
          kind: 'text',
          valueType: 'string',
          default: 'iyirmi bir',
          arg: { kind: 'positional', index: 0 },
        },
      ],
    },
    {
      id: 'withSuffix',
      name: 'withSuffix',
      signature: '(value: number | string, suffix: string, options?: SuffixOptions): string',
      description: 'Attaches an arbitrary suffix to a value, e.g. a unit or label.',
      sourceFile: 'src/number/suffix.ts',
      fn: fn(withSuffix),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'text',
          valueType: 'string',
          default: '120',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'suffix',
          label: 'suffix',
          kind: 'text',
          valueType: 'string',
          default: 'kg',
          arg: { kind: 'positional', index: 1 },
        },
        {
          id: 'separator',
          label: 'separator',
          kind: 'text',
          valueType: 'string',
          default: ' ',
          arg: { kind: 'option', key: 'separator' },
        },
      ],
    },
  ],
}

const notationCategory: Category = {
  id: 'notation',
  title: 'Short & long notation',
  description:
    'Distinct from numberToWords: these keep digits and only localize the scale word, rather than spelling every number out. toShortNotation abbreviates ("2,5 mln"); toLongNotation pairs digit groups with scale words ("1 milyon 234 min 567").',
  examples: [
    {
      id: 'toShortNotation',
      name: 'toShortNotation',
      signature: '(value: number, options?: ShortNotationOptions): string',
      description:
        'Abbreviates a large number to a short scaled form. "az" uses min/mln/mlrd/trln; "en" uses K/M/B/T.',
      sourceFile: 'src/number/notation.ts',
      fn: fn(toShortNotation),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 2500000,
          step: 'any',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'decimals',
          label: 'decimals',
          kind: 'number',
          valueType: 'number',
          default: 1,
          step: '1',
          arg: { kind: 'option', key: 'decimals' },
        },
        {
          id: 'locale',
          label: 'locale',
          kind: 'select',
          valueType: 'string',
          default: 'az',
          selectOptions: [
            { value: 'az', label: 'az' },
            { value: 'en', label: 'en' },
          ],
          arg: { kind: 'option', key: 'locale' },
        },
      ],
    },
    {
      id: 'parseShortNotation',
      name: 'parseShortNotation',
      signature: '(value: string, options?: ShortNotationParseOptions): number',
      description: 'Parses a string produced by toShortNotation back into a JavaScript number.',
      sourceFile: 'src/number/notation.ts',
      fn: fn(parseShortNotation),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'text',
          valueType: 'string',
          default: '2,5 mln',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'locale',
          label: 'locale',
          kind: 'select',
          valueType: 'string',
          default: 'az',
          selectOptions: [
            { value: 'az', label: 'az' },
            { value: 'en', label: 'en' },
          ],
          arg: { kind: 'option', key: 'locale' },
        },
      ],
    },
    {
      id: 'toLongNotation',
      name: 'toLongNotation',
      signature: '(value: number, options?: LongNotationOptions): string',
      description:
        'Expands an integer into digit groups paired with their Azerbaijani scale word, without spelling every number out. Throws TypeError if value is not an integer.',
      sourceFile: 'src/number/notation.ts',
      fn: fn(toLongNotation),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 1234567,
          step: '1',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'groupSeparator',
          label: 'groupSeparator',
          kind: 'text',
          valueType: 'string',
          default: ' ',
          arg: { kind: 'option', key: 'groupSeparator' },
        },
      ],
    },
    {
      id: 'parseLongNotation',
      name: 'parseLongNotation',
      signature: '(value: string, options?: LongNotationOptions): number',
      description: 'Parses a string produced by toLongNotation back into a JavaScript number.',
      sourceFile: 'src/number/notation.ts',
      fn: fn(parseLongNotation),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'text',
          valueType: 'string',
          default: '1 milyon 234 min 567',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'groupSeparator',
          label: 'groupSeparator',
          kind: 'text',
          valueType: 'string',
          default: ' ',
          arg: { kind: 'option', key: 'groupSeparator' },
        },
      ],
    },
  ],
}

const romanCategory: Category = {
  id: 'roman',
  title: 'Roman numerals',
  description:
    'Standard toRoman / fromRoman, integers 1-3999 only, self-contained. Roman numerals are locale-independent and take no locale option.',
  examples: [
    {
      id: 'toRoman',
      name: 'toRoman',
      signature: '(value: number): string',
      description: 'Converts an integer between 1 and 3999 into a roman numeral.',
      sourceFile: 'src/number/roman.ts',
      fn: fn(toRoman),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 1994,
          step: '1',
          arg: { kind: 'positional', index: 0 },
        },
      ],
    },
    {
      id: 'fromRoman',
      name: 'fromRoman',
      signature: '(roman: string): number',
      description: 'Converts a roman numeral string into its integer value.',
      sourceFile: 'src/number/roman.ts',
      fn: fn(fromRoman),
      fields: [
        {
          id: 'roman',
          label: 'roman',
          kind: 'text',
          valueType: 'string',
          default: 'MCMXCIV',
          arg: { kind: 'positional', index: 0 },
        },
      ],
    },
  ],
}

const byteSizeCategory: Category = {
  id: 'byte-size',
  title: 'Byte size',
  description:
    '"base: 1024" (the default) is the conventional binary interpretation of "KB"/"MB" used by most operating systems and file managers; pass "base: 1000" for decimal SI units instead.',
  examples: [
    {
      id: 'toByteSize',
      name: 'toByteSize',
      signature: '(bytes: number, options?: ByteSizeOptions): string',
      description: 'Formats a byte count into a human-readable size string, e.g. 1536 -> "1.5 KB".',
      sourceFile: 'src/number/byte-size.ts',
      fn: fn(toByteSize),
      fields: [
        {
          id: 'bytes',
          label: 'bytes',
          kind: 'number',
          valueType: 'number',
          default: 1536,
          step: '1',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'decimals',
          label: 'decimals',
          kind: 'number',
          valueType: 'number',
          default: 2,
          step: '1',
          arg: { kind: 'option', key: 'decimals' },
        },
        {
          id: 'base',
          label: 'base',
          kind: 'select',
          valueType: 'number',
          default: 1024,
          selectOptions: [
            { value: '1024', label: '1024 (binary)' },
            { value: '1000', label: '1000 (decimal SI)' },
          ],
          arg: { kind: 'option', key: 'base' },
        },
      ],
    },
    {
      id: 'parseByteSize',
      name: 'parseByteSize',
      signature: '(value: string, options?: ByteSizeParseOptions): number',
      description:
        'Parses a string produced by toByteSize back into a byte count. options.base must match the base the string was formatted with.',
      sourceFile: 'src/number/byte-size.ts',
      fn: fn(parseByteSize),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'text',
          valueType: 'string',
          default: '1.5 KB',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'base',
          label: 'base',
          kind: 'select',
          valueType: 'number',
          default: 1024,
          selectOptions: [
            { value: '1024', label: '1024 (binary)' },
            { value: '1000', label: '1000 (decimal SI)' },
          ],
          arg: { kind: 'option', key: 'base' },
        },
      ],
    },
  ],
}

const moneyCategory: Category = {
  id: 'money',
  title: 'Money',
  description:
    'Thin wrappers around formatNumber/parseNumber that add a currency symbol. Defaults to the manat sign (₼), two decimals, symbol placed after the amount.',
  examples: [
    {
      id: 'formatMoney',
      name: 'formatMoney',
      signature: '(value: number, options?: MoneyFormatOptions): string',
      description: 'Formats a monetary amount.',
      sourceFile: 'src/money/format.ts',
      fn: fn(formatMoney),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 1234.5,
          step: 'any',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'decimals',
          label: 'decimals',
          kind: 'number',
          valueType: 'number',
          default: 2,
          step: '1',
          arg: { kind: 'option', key: 'decimals' },
        },
        {
          id: 'symbol',
          label: 'symbol',
          kind: 'text',
          valueType: 'string',
          default: '₼',
          arg: { kind: 'option', key: 'symbol' },
        },
        {
          id: 'symbolPosition',
          label: 'symbolPosition',
          kind: 'select',
          valueType: 'string',
          default: 'after',
          selectOptions: [
            { value: 'after', label: 'after' },
            { value: 'before', label: 'before' },
          ],
          arg: { kind: 'option', key: 'symbolPosition' },
        },
      ],
    },
    {
      id: 'parseMoney',
      name: 'parseMoney',
      signature: '(value: string, options?: MoneyParseOptions): number',
      description:
        'Parses a string produced by formatMoney back into a JavaScript number, stripping the currency symbol.',
      sourceFile: 'src/money/format.ts',
      fn: fn(parseMoney),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'text',
          valueType: 'string',
          default: '1 234,50 ₼',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'symbol',
          label: 'symbol',
          kind: 'text',
          valueType: 'string',
          default: '₼',
          arg: { kind: 'option', key: 'symbol' },
        },
      ],
    },
    {
      id: 'moneyToWords',
      name: 'moneyToWords',
      signature: '(value: number, options?: MoneyWordsOptions): string',
      description:
        'Spells out a monetary amount as Azerbaijani words, pairing the integer part with a major currency unit word and the rounded fractional part with a minor unit word.',
      sourceFile: 'src/money/words.ts',
      fn: fn(moneyToWords),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 1234.5,
          step: 'any',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'majorUnit',
          label: 'majorUnit',
          kind: 'text',
          valueType: 'string',
          default: 'manat',
          arg: { kind: 'option', key: 'majorUnit' },
        },
        {
          id: 'minorUnit',
          label: 'minorUnit',
          kind: 'text',
          valueType: 'string',
          default: 'qəpik',
          arg: { kind: 'option', key: 'minorUnit' },
        },
        {
          id: 'includeZeroMinor',
          label: 'includeZeroMinor',
          kind: 'boolean',
          valueType: 'boolean',
          default: false,
          arg: { kind: 'option', key: 'includeZeroMinor' },
        },
      ],
    },
  ],
}

const percentageCategory: Category = {
  id: 'percentage',
  title: 'Percentage',
  description:
    'By default the input is treated as already being expressed in the target unit (45.5 -> "45,5%"); pass multiplyBy100 to format a ratio instead (0.455 -> "45,5%"). Also supports permille (‰) and basis points (‱).',
  examples: [
    {
      id: 'formatPercentage',
      name: 'formatPercentage',
      signature: '(value: number, options?: PercentageFormatOptions): string',
      description: 'Formats a number as a percentage (or permille/basis-point) string.',
      sourceFile: 'src/percentage/format.ts',
      fn: fn(formatPercentage),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 45.5,
          step: 'any',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'decimals',
          label: 'decimals',
          kind: 'number',
          valueType: 'number',
          default: 1,
          step: '1',
          arg: { kind: 'option', key: 'decimals' },
        },
        {
          id: 'multiplyBy100',
          label: 'multiplyBy100',
          kind: 'boolean',
          valueType: 'boolean',
          default: false,
          arg: { kind: 'option', key: 'multiplyBy100' },
        },
        {
          id: 'space',
          label: 'space',
          kind: 'boolean',
          valueType: 'boolean',
          default: false,
          arg: { kind: 'option', key: 'space' },
        },
        {
          id: 'unit',
          label: 'unit',
          kind: 'select',
          valueType: 'string',
          default: 'percent',
          selectOptions: [
            { value: 'percent', label: 'percent (%)' },
            { value: 'permille', label: 'permille (‰)' },
            { value: 'basisPoint', label: 'basisPoint (‱)' },
          ],
          arg: { kind: 'option', key: 'unit' },
        },
      ],
    },
    {
      id: 'parsePercentage',
      name: 'parsePercentage',
      signature: '(value: string, options?: PercentageParseOptions): number',
      description:
        'Parses a percentage (or permille/basis-point) string back into a JavaScript number. Pass asRatio to divide the result by the unit’s scale factor.',
      sourceFile: 'src/percentage/format.ts',
      fn: fn(parsePercentage),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'text',
          valueType: 'string',
          default: '45,5%',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'asRatio',
          label: 'asRatio',
          kind: 'boolean',
          valueType: 'boolean',
          default: false,
          arg: { kind: 'option', key: 'asRatio' },
        },
        {
          id: 'unit',
          label: 'unit',
          kind: 'select',
          valueType: 'string',
          default: 'percent',
          selectOptions: [
            { value: 'percent', label: 'percent (%)' },
            { value: 'permille', label: 'permille (‰)' },
            { value: 'basisPoint', label: 'basisPoint (‱)' },
          ],
          arg: { kind: 'option', key: 'unit' },
        },
      ],
    },
  ],
}

const arithmeticCategory: Category = {
  id: 'arithmetic',
  title: 'Arithmetic',
  description:
    'Self-contained helpers with no locale dependency. Both inclusive on [min, max], both throw RangeError on non-finite input or min > max.',
  examples: [
    {
      id: 'clamp',
      name: 'clamp',
      signature: '(value: number, min: number, max: number): number',
      description: 'Clamps a number so it falls within the inclusive range [min, max].',
      sourceFile: 'src/arithmetic/clamp.ts',
      fn: fn(clamp),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 15,
          step: 'any',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'min',
          label: 'min',
          kind: 'number',
          valueType: 'number',
          default: 0,
          step: 'any',
          arg: { kind: 'positional', index: 1 },
        },
        {
          id: 'max',
          label: 'max',
          kind: 'number',
          valueType: 'number',
          default: 10,
          step: 'any',
          arg: { kind: 'positional', index: 2 },
        },
      ],
    },
    {
      id: 'inRange',
      name: 'inRange',
      signature: '(value: number, min: number, max: number): boolean',
      description: 'Checks whether a number falls within the inclusive range [min, max].',
      sourceFile: 'src/arithmetic/in-range.ts',
      fn: fn(inRange),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 5,
          step: 'any',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'min',
          label: 'min',
          kind: 'number',
          valueType: 'number',
          default: 0,
          step: 'any',
          arg: { kind: 'positional', index: 1 },
        },
        {
          id: 'max',
          label: 'max',
          kind: 'number',
          valueType: 'number',
          default: 10,
          step: 'any',
          arg: { kind: 'positional', index: 2 },
        },
      ],
    },
  ],
}

const financialCategory: Category = {
  id: 'financial',
  title: 'Financial',
  description:
    'Rate is always a decimal per period (0.05 = 5%). The interest functions return interest earned only; futureValue and loanPayment return the balance/payment directly.',
  examples: [
    {
      id: 'simpleInterest',
      name: 'simpleInterest',
      signature: '(principal: number, rate: number, time: number): number',
      description:
        'Computes simple interest — interest that accrues linearly on the original principal only, with no compounding.',
      sourceFile: 'src/financial/simple-interest.ts',
      fn: fn(simpleInterest),
      fields: [
        {
          id: 'principal',
          label: 'principal',
          kind: 'number',
          valueType: 'number',
          default: 1000,
          step: 'any',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'rate',
          label: 'rate',
          kind: 'number',
          valueType: 'number',
          default: 0.05,
          step: 'any',
          arg: { kind: 'positional', index: 1 },
        },
        {
          id: 'time',
          label: 'time',
          kind: 'number',
          valueType: 'number',
          default: 3,
          step: 'any',
          arg: { kind: 'positional', index: 2 },
        },
      ],
    },
    {
      id: 'compoundInterest',
      name: 'compoundInterest',
      signature:
        '(principal: number, rate: number, time: number, options?: CompoundInterestOptions): number',
      description:
        'Computes compound interest — interest that accrues on both the original principal and previously-accumulated interest.',
      sourceFile: 'src/financial/compound-interest.ts',
      fn: fn(compoundInterest),
      fields: [
        {
          id: 'principal',
          label: 'principal',
          kind: 'number',
          valueType: 'number',
          default: 1000,
          step: 'any',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'rate',
          label: 'rate',
          kind: 'number',
          valueType: 'number',
          default: 0.05,
          step: 'any',
          arg: { kind: 'positional', index: 1 },
        },
        {
          id: 'time',
          label: 'time',
          kind: 'number',
          valueType: 'number',
          default: 3,
          step: 'any',
          arg: { kind: 'positional', index: 2 },
        },
        {
          id: 'compoundsPerPeriod',
          label: 'compoundsPerPeriod',
          kind: 'number',
          valueType: 'number',
          default: 1,
          step: '1',
          arg: { kind: 'option', key: 'compoundsPerPeriod' },
        },
      ],
    },
    {
      id: 'presentValue',
      name: 'presentValue',
      signature: '(futureAmount: number, rate: number, periods: number): number',
      description:
        'Computes the present value of a future amount, discounting it back at a fixed rate compounded once per period — the inverse of futureValue.',
      sourceFile: 'src/financial/present-value.ts',
      fn: fn(presentValue),
      fields: [
        {
          id: 'futureAmount',
          label: 'futureAmount',
          kind: 'number',
          valueType: 'number',
          default: 1157.625,
          step: 'any',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'rate',
          label: 'rate',
          kind: 'number',
          valueType: 'number',
          default: 0.05,
          step: 'any',
          arg: { kind: 'positional', index: 1 },
        },
        {
          id: 'periods',
          label: 'periods',
          kind: 'number',
          valueType: 'number',
          default: 3,
          step: 'any',
          arg: { kind: 'positional', index: 2 },
        },
      ],
    },
    {
      id: 'futureValue',
      name: 'futureValue',
      signature: '(presentAmount: number, rate: number, periods: number): number',
      description:
        'Computes the future value of a present amount, compounding once per period at a fixed rate — the balance after `periods` periods.',
      sourceFile: 'src/financial/future-value.ts',
      fn: fn(futureValue),
      fields: [
        {
          id: 'presentAmount',
          label: 'presentAmount',
          kind: 'number',
          valueType: 'number',
          default: 1000,
          step: 'any',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'rate',
          label: 'rate',
          kind: 'number',
          valueType: 'number',
          default: 0.05,
          step: 'any',
          arg: { kind: 'positional', index: 1 },
        },
        {
          id: 'periods',
          label: 'periods',
          kind: 'number',
          valueType: 'number',
          default: 3,
          step: 'any',
          arg: { kind: 'positional', index: 2 },
        },
      ],
    },
    {
      id: 'loanPayment',
      name: 'loanPayment',
      signature: '(principal: number, rate: number, periods: number): number',
      description:
        'Computes the fixed periodic payment (PMT) that fully repays `principal` over `periods` equal payments at a constant per-period `rate` — a fixed-rate mortgage or amortizing-loan payment.',
      sourceFile: 'src/financial/loan-payment.ts',
      fn: fn(loanPayment),
      fields: [
        {
          id: 'principal',
          label: 'principal',
          kind: 'number',
          valueType: 'number',
          default: 200000,
          step: 'any',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'rate',
          label: 'rate (per period)',
          kind: 'number',
          valueType: 'number',
          default: 0.005,
          step: 'any',
          arg: { kind: 'positional', index: 1 },
        },
        {
          id: 'periods',
          label: 'periods',
          kind: 'number',
          valueType: 'number',
          default: 360,
          step: '1',
          arg: { kind: 'positional', index: 2 },
        },
      ],
    },
    {
      id: 'amortizationSchedule',
      name: 'amortizationSchedule',
      signature: '(principal: number, rate: number, periods: number): AmortizationScheduleEntry[]',
      description:
        'Builds the full period-by-period amortization schedule for a fixed-rate loan — the interest/principal split of each loanPayment payment and the balance remaining afterward.',
      sourceFile: 'src/financial/loan-payment.ts',
      fn: fn(amortizationSchedule),
      fields: [
        {
          id: 'principal',
          label: 'principal',
          kind: 'number',
          valueType: 'number',
          default: 1000,
          step: 'any',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'rate',
          label: 'rate (per period)',
          kind: 'number',
          valueType: 'number',
          default: 0.01,
          step: 'any',
          arg: { kind: 'positional', index: 1 },
        },
        {
          id: 'periods',
          label: 'periods',
          kind: 'number',
          valueType: 'number',
          default: 3,
          step: '1',
          arg: { kind: 'positional', index: 2 },
        },
      ],
    },
  ],
}

const statsCategory: Category = {
  id: 'stats',
  title: 'Statistics',
  description:
    'Enter values as a comma- or space-separated list. Every function throws RangeError on an empty array or a non-finite value.',
  examples: [
    {
      id: 'sum',
      name: 'sum',
      signature: '(values: number[]): number',
      description: 'Sums an array of numbers.',
      sourceFile: 'src/stats/sum.ts',
      fn: fn(sum),
      fields: [
        {
          id: 'values',
          label: 'values',
          kind: 'text',
          valueType: 'numberArray',
          default: '1, 2, 3',
          arg: { kind: 'positional', index: 0 },
        },
      ],
    },
    {
      id: 'mean',
      name: 'mean',
      signature: '(values: number[]): number',
      description: 'Computes the arithmetic mean (average) of an array of numbers.',
      sourceFile: 'src/stats/mean.ts',
      fn: fn(mean),
      fields: [
        {
          id: 'values',
          label: 'values',
          kind: 'text',
          valueType: 'numberArray',
          default: '1, 2, 3, 4',
          arg: { kind: 'positional', index: 0 },
        },
      ],
    },
    {
      id: 'median',
      name: 'median',
      signature: '(values: number[]): number',
      description:
        'Computes the median of an array of numbers — the middle value once sorted, or the average of the two middle values for an even-length array.',
      sourceFile: 'src/stats/median.ts',
      fn: fn(median),
      fields: [
        {
          id: 'values',
          label: 'values',
          kind: 'text',
          valueType: 'numberArray',
          default: '1, 3, 2',
          arg: { kind: 'positional', index: 0 },
        },
      ],
    },
    {
      id: 'mode',
      name: 'mode',
      signature: '(values: number[]): number[]',
      description:
        'Returns the mode(s) of an array of numbers — every value tied for the highest frequency, sorted ascending.',
      sourceFile: 'src/stats/mode.ts',
      fn: fn(mode),
      fields: [
        {
          id: 'values',
          label: 'values',
          kind: 'text',
          valueType: 'numberArray',
          default: '1, 1, 2, 2, 3',
          arg: { kind: 'positional', index: 0 },
        },
      ],
    },
    {
      id: 'min',
      name: 'min',
      signature: '(values: number[]): number',
      description: 'Returns the smallest value in an array of numbers.',
      sourceFile: 'src/stats/min.ts',
      fn: fn(min),
      fields: [
        {
          id: 'values',
          label: 'values',
          kind: 'text',
          valueType: 'numberArray',
          default: '3, 1, 4, 1, 5',
          arg: { kind: 'positional', index: 0 },
        },
      ],
    },
    {
      id: 'max',
      name: 'max',
      signature: '(values: number[]): number',
      description: 'Returns the largest value in an array of numbers.',
      sourceFile: 'src/stats/max.ts',
      fn: fn(max),
      fields: [
        {
          id: 'values',
          label: 'values',
          kind: 'text',
          valueType: 'numberArray',
          default: '3, 1, 4, 1, 5',
          arg: { kind: 'positional', index: 0 },
        },
      ],
    },
    {
      id: 'variance',
      name: 'variance',
      signature: '(values: number[], options?: VarianceOptions): number',
      description:
        'Computes the variance of an array of numbers. Population variance by default; pass sample to compute sample variance (Bessel’s correction, requires at least 2 values).',
      sourceFile: 'src/stats/variance.ts',
      fn: fn(variance),
      fields: [
        {
          id: 'values',
          label: 'values',
          kind: 'text',
          valueType: 'numberArray',
          default: '2, 4, 4, 4, 5, 5, 7, 9',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'sample',
          label: 'sample',
          kind: 'boolean',
          valueType: 'boolean',
          default: false,
          arg: { kind: 'option', key: 'sample' },
        },
      ],
    },
    {
      id: 'standardDeviation',
      name: 'standardDeviation',
      signature: '(values: number[], options?: VarianceOptions): number',
      description:
        'Computes the standard deviation of an array of numbers — the square root of variance.',
      sourceFile: 'src/stats/standard-deviation.ts',
      fn: fn(standardDeviation),
      fields: [
        {
          id: 'values',
          label: 'values',
          kind: 'text',
          valueType: 'numberArray',
          default: '2, 4, 4, 4, 5, 5, 7, 9',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'sample',
          label: 'sample',
          kind: 'boolean',
          valueType: 'boolean',
          default: false,
          arg: { kind: 'option', key: 'sample' },
        },
      ],
    },
    {
      id: 'percentile',
      name: 'percentile',
      signature: '(values: number[], p: number): number',
      description:
        'Computes the p-th percentile (0-100) using linear interpolation between closest ranks — the same method as Excel’s PERCENTILE.INC and NumPy’s default "linear".',
      sourceFile: 'src/stats/percentile.ts',
      fn: fn(percentile),
      fields: [
        {
          id: 'values',
          label: 'values',
          kind: 'text',
          valueType: 'numberArray',
          default: '1, 2, 3, 4, 5',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'p',
          label: 'p (0-100)',
          kind: 'number',
          valueType: 'number',
          default: 50,
          step: 'any',
          arg: { kind: 'positional', index: 1 },
        },
      ],
    },
    {
      id: 'quantile',
      name: 'quantile',
      signature: '(values: number[], q: number): number',
      description:
        'Computes the q-th quantile (0-1) of an array of numbers. quantile(v, q) === percentile(v, q * 100).',
      sourceFile: 'src/stats/quantile.ts',
      fn: fn(quantile),
      fields: [
        {
          id: 'values',
          label: 'values',
          kind: 'text',
          valueType: 'numberArray',
          default: '1, 2, 3, 4, 5',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'q',
          label: 'q (0-1)',
          kind: 'number',
          valueType: 'number',
          default: 0.5,
          step: '0.01',
          arg: { kind: 'positional', index: 1 },
        },
      ],
    },
  ],
}

const utilsCategory: Category = {
  id: 'utils',
  title: 'Utils',
  description:
    'Self-contained helpers with no locale dependency: arbitrary-radix base conversion and integer parity checks.',
  examples: [
    {
      id: 'toBase',
      name: 'toBase',
      signature: '(value: number, radix: number): string',
      description:
        'Converts an integer from base 10 into its string representation in an arbitrary radix between 2 and 36 (binary, octal, hex, base36, etc.).',
      sourceFile: 'src/utils/base.ts',
      fn: fn(toBase),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 255,
          step: '1',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'radix',
          label: 'radix',
          kind: 'number',
          valueType: 'number',
          default: 16,
          step: '1',
          arg: { kind: 'positional', index: 1 },
        },
      ],
    },
    {
      id: 'fromBase',
      name: 'fromBase',
      signature: '(value: string, radix: number): number',
      description:
        'Parses a string in an arbitrary radix between 2 and 36 back into a base-10 integer. Inverse of toBase.',
      sourceFile: 'src/utils/base.ts',
      fn: fn(fromBase),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'text',
          valueType: 'string',
          default: 'ff',
          arg: { kind: 'positional', index: 0 },
        },
        {
          id: 'radix',
          label: 'radix',
          kind: 'number',
          valueType: 'number',
          default: 16,
          step: '1',
          arg: { kind: 'positional', index: 1 },
        },
      ],
    },
    {
      id: 'isEven',
      name: 'isEven',
      signature: '(value: number): boolean',
      description: 'Checks whether an integer is even. Throws for non-integers.',
      sourceFile: 'src/utils/predicates.ts',
      fn: fn(isEven),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 4,
          step: '1',
          arg: { kind: 'positional', index: 0 },
        },
      ],
    },
    {
      id: 'isOdd',
      name: 'isOdd',
      signature: '(value: number): boolean',
      description: 'Checks whether an integer is odd. Throws for non-integers.',
      sourceFile: 'src/utils/predicates.ts',
      fn: fn(isOdd),
      fields: [
        {
          id: 'value',
          label: 'value',
          kind: 'number',
          valueType: 'number',
          default: 3,
          step: '1',
          arg: { kind: 'positional', index: 0 },
        },
      ],
    },
  ],
}

export const categories: Category[] = [
  numberCategory,
  wordsCategory,
  ordinalCategory,
  notationCategory,
  romanCategory,
  byteSizeCategory,
  moneyCategory,
  percentageCategory,
  arithmeticCategory,
  financialCategory,
  statsCategory,
  utilsCategory,
]

export const exampleCount = categories.reduce(
  (total, category) => total + category.examples.length,
  0,
)

function countExamplesById(): void {
  const seen = new Set<string>()
  for (const category of categories) {
    for (const example of category.examples) {
      if (seen.has(example.id)) {
        throw new Error(`registry: duplicate example id "${example.id}"`)
      }
      seen.add(example.id)
    }
  }
}

countExamplesById()

export type { FunctionExample }
