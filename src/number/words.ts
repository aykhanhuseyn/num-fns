/** Words for digits 1-9. Index `0` is unused so digits can index directly. Reused by `locale/az.ts`. */
export const ONES = ['', 'bir', 'iki', 'üç', 'dörd', 'beş', 'altı', 'yeddi', 'səkkiz', 'doqquz']
/** Words for the tens digit: 10, 20, ..., 90. Index `0` is unused. Reused by `locale/az.ts`. */
export const TENS = [
  '',
  'on',
  'iyirmi',
  'otuz',
  'qırx',
  'əlli',
  'altmış',
  'yetmiş',
  'səksən',
  'doxsan',
]

/**
 * Scale words indexed by group-of-three-digits position, read from the
 * right: index 0 is the units group (no word), index 1 is thousands, etc.
 */
export const SCALE_WORDS = ['', 'min', 'milyon', 'milyard', 'trilyon']

/** Word for `0`. Reused by `locale/az.ts`. */
export const ZERO_WORD = 'sıfır'

/** Word prefixed to the spelled-out form of a negative number. */
export const NEGATIVE_WORD = 'mənfi'

/** Connector joining the integer and fractional part when spelling decimals. Reused by `locale/az.ts`. */
export const DECIMAL_WORD = 'tam'

/** Hundreds-digit multiplier noun, reused for every digit 1-9. Reused by `locale/az.ts`. */
export const HUNDRED_WORD = 'yüz'

const MAX_SUPPORTED_INTEGER = 1000 ** SCALE_WORDS.length - 1

/**
 * Spells out a number as Azerbaijani cardinal words.
 *
 * Supports integers from 0 up to {@link MAX_SUPPORTED_INTEGER} (999 trillion
 * range), negative numbers (prefixed with "mənfi"), and up to two decimal
 * digits, which are read as a whole number connected by "tam" — e.g. `12.34`
 * becomes `"on iki tam otuz dörd"`.
 *
 * @example
 * numberToWords(1234); // "min iki yüz otuz dörd"
 * numberToWords(1000000); // "bir milyon"
 * numberToWords(-5); // "mənfi beş"
 */
export function numberToWords(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`numberToWords: value must be finite, received ${value}`)
  }

  const isNegative = value < 0 && value !== 0
  const absolute = Math.abs(value)
  let integerPart = Math.floor(absolute)

  if (integerPart > MAX_SUPPORTED_INTEGER) {
    throw new RangeError(
      `numberToWords: value exceeds the maximum supported magnitude of ${MAX_SUPPORTED_INTEGER}`,
    )
  }

  let fractionDigits = Math.round((absolute - integerPart) * 100)
  if (fractionDigits === 100) {
    fractionDigits = 0
    integerPart += 1
  }

  let words = integerToWords(integerPart)
  if (fractionDigits > 0) {
    words = `${words} ${DECIMAL_WORD} ${twoDigitGroupToWords(fractionDigits)}`
  }

  return isNegative ? `${NEGATIVE_WORD} ${words}` : words
}

function integerToWords(value: number): string {
  if (value === 0) return ZERO_WORD

  const groups: number[] = []
  let remaining = value
  while (remaining > 0) {
    groups.push(remaining % 1000)
    remaining = Math.floor(remaining / 1000)
  }

  const parts: string[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupValue = groups[i]
    if (!groupValue) continue

    const scaleWord = SCALE_WORDS[i]
    if (!scaleWord) {
      parts.push(threeDigitGroupToWords(groupValue))
    } else if (i === 1 && groupValue === 1) {
      // Azerbaijani says "min" for 1000, not "bir min" — unlike "bir milyon".
      parts.push(scaleWord)
    } else {
      parts.push(`${threeDigitGroupToWords(groupValue)} ${scaleWord}`)
    }
  }

  return parts.join(' ')
}

function threeDigitGroupToWords(value: number): string {
  const hundreds = Math.floor(value / 100)
  const tens = Math.floor((value % 100) / 10)
  const ones = value % 10

  const parts: string[] = []
  if (hundreds > 0) {
    if (hundreds > 1) parts.push(ONES[hundreds] as string)
    parts.push(HUNDRED_WORD)
  }
  if (tens > 0) parts.push(TENS[tens] as string)
  if (ones > 0) parts.push(ONES[ones] as string)

  return parts.join(' ')
}

function twoDigitGroupToWords(value: number): string {
  return threeDigitGroupToWords(value)
}
