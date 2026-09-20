import { resolveOutput, toOutput, ZERO } from '../shared/bigint'
import { guardNumber } from '../shared/no-throw'
import { guardText } from '../shared/no-throw-text'
import { isNegativeZero } from '../shared/sign'
import type { BaseParseOptions } from '../shared/types'

const BASE_DIGIT_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz'

/**
 * Converts an integer from base 10 into its string representation in an
 * arbitrary radix between 2 and 36 (binary, octal, hex, base36, etc.).
 *
 * Distinct from locale digit-system conversion (Latin ↔ Arabic-Indic
 * within base 10) — this converts base 10 to base N.
 *
 * A `number` must be a safe integer (`RangeError` otherwise), because past
 * `Number.MAX_SAFE_INTEGER` its digits are already lost and the output would
 * be wrong without looking wrong. A `bigint` has no such limit — it is exact
 * at any magnitude, so `toBase(BigInt('123456789012345678901'), 16)` is the
 * exact hex form and round-trips through {@link fromBase} with
 * `{ output: 'bigint' }`.
 *
 * A negative zero keeps its sign (`toBase(-0, 2)` is `"-0"`), and
 * {@link fromBase} reads it back as `-0` for a `number` output. A `bigint`
 * has no negative zero, so neither direction can produce one.
 *
 * @example
 * toBase(255, 16); // "ff"
 * toBase(10, 2); // "1010"
 * toBase(-8, 8); // "-10"
 * toBase(-0, 2); // "-0"
 * toBase(BigInt('123456789012345678901'), 16); // "6b14e9f812f366c35"
 */
export function toBase(value: number | bigint, radix: number): string {
  return guardText(() => {
    validateRadix(radix, 'toBase')
    if (typeof value === 'bigint') return value.toString(radix)

    if (!Number.isInteger(value)) {
      throw new TypeError(`toBase: value must be an integer, received ${value}`)
    }
    if (!Number.isSafeInteger(value)) {
      throw new RangeError(`toBase: value must be a safe integer, received ${value}`)
    }

    return isNegativeZero(value) ? '-0' : value.toString(radix)
  }, [value])
}

/**
 * Parses a string in an arbitrary radix between 2 and 36 back into a base-10
 * integer. Inverse of {@link toBase}. Case-insensitive; accepts a leading
 * `-` or `+` sign.
 *
 * The digits are accumulated exactly in `bigint` arithmetic whatever the
 * `output`, so a `number` result is either exact or a `RangeError`: a digit
 * string whose value exceeds `Number.MAX_SAFE_INTEGER` is refused with a
 * pointer to `{ output: 'bigint' }` rather than rounded — the mirror image of
 * {@link toBase}'s safe-integer guard. With `{ output: 'bigint' }` any
 * magnitude is returned exactly — including `"-0"`, which comes back as `0n`,
 * since there is no negative zero `bigint`; as a `number` it is `-0`.
 *
 * @example
 * fromBase("ff", 16); // 255
 * fromBase("1010", 2); // 10
 * fromBase("-10", 8); // -8
 * fromBase("6b14e9f812f366c35", 16, { output: 'bigint' }); // 123456789012345678901n
 */
export function fromBase(
  value: string,
  radix: number,
  options: BaseParseOptions & { output: 'bigint' },
): bigint
export function fromBase(
  value: string,
  radix: number,
  options?: BaseParseOptions & { output?: 'number' },
): number
export function fromBase(value: string, radix: number, options: BaseParseOptions): number | bigint
export function fromBase(
  value: string,
  radix: number,
  options: BaseParseOptions = {},
): number | bigint {
  return guardNumber(() => {
    validateRadix(radix, 'fromBase')
    const output = resolveOutput(options.output, 'fromBase')

    const trimmed = value.trim()
    if (trimmed === '') {
      throw new SyntaxError('fromBase: cannot parse an empty string')
    }

    const isNegative = trimmed.startsWith('-')
    const digits = isNegative || trimmed.startsWith('+') ? trimmed.slice(1) : trimmed
    const alphabet = BASE_DIGIT_CHARS.slice(0, radix)
    const lowerDigits = digits.toLowerCase()

    if (digits === '' || ![...lowerDigits].every((char) => alphabet.includes(char))) {
      throw new SyntaxError(`fromBase: "${value}" is not a valid base-${radix} number`)
    }

    const bigRadix = BigInt(radix)
    let magnitude = ZERO
    for (const char of lowerDigits) {
      magnitude = magnitude * bigRadix + BigInt(alphabet.indexOf(char))
    }

    if (isNegative && magnitude === ZERO && output === 'number') return -0
    return toOutput(isNegative ? -magnitude : magnitude, output, 'fromBase')
  }, options)
}

function validateRadix(radix: number, fnName: string): void {
  if (!Number.isInteger(radix) || radix < 2 || radix > 36) {
    throw new RangeError(`${fnName}: radix must be an integer between 2 and 36, received ${radix}`)
  }
}
