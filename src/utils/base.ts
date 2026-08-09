const BASE_DIGIT_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz'

/**
 * Converts an integer from base 10 into its string representation in an
 * arbitrary radix between 2 and 36 (binary, octal, hex, base36, etc.).
 *
 * Distinct from locale digit-system conversion (Latin ↔ Arabic-Indic
 * within base 10) — this converts base 10 to base N.
 *
 * @example
 * toBase(255, 16); // "ff"
 * toBase(10, 2); // "1010"
 * toBase(-8, 8); // "-10"
 */
export function toBase(value: number, radix: number): string {
  validateRadix(radix, 'toBase')
  if (!Number.isInteger(value)) {
    throw new TypeError(`toBase: value must be an integer, received ${value}`)
  }
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`toBase: value must be a safe integer, received ${value}`)
  }

  return value.toString(radix)
}

/**
 * Parses a string in an arbitrary radix between 2 and 36 back into a base-10
 * integer. Inverse of {@link toBase}. Case-insensitive; accepts a leading
 * `-` or `+` sign.
 *
 * @example
 * fromBase("ff", 16); // 255
 * fromBase("1010", 2); // 10
 * fromBase("-10", 8); // -8
 */
export function fromBase(value: string, radix: number): number {
  validateRadix(radix, 'fromBase')

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

  const magnitude = Number.parseInt(lowerDigits, radix)
  return isNegative ? -magnitude : magnitude
}

function validateRadix(radix: number, fnName: string): void {
  if (!Number.isInteger(radix) || radix < 2 || radix > 36) {
    throw new RangeError(`${fnName}: radix must be an integer between 2 and 36, received ${radix}`)
  }
}
