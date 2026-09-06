import { describe, expect, it } from 'bun:test'
import {
  absBigInt,
  assertSafeInteger,
  decimalToBigInt,
  maxSupportedBigInt,
  ONE,
  pluralOperand,
  pow10,
  resolveOutput,
  scaleBigInt,
  scaledBigInt,
  THOUSAND,
  toOutput,
  toSafeNumber,
  toThousandGroups,
  ZERO,
} from './bigint'

/**
 * `BigInt(...)` everywhere, never a `10n` literal: the build targets ES2018,
 * where the literal is a parse error, and `tsc` type-checks these files too
 * (see the module's doc comment).
 */
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)
const ABOVE_MAX_SAFE = MAX_SAFE + ONE

describe('constants', () => {
  it('are the plain bigint values their names say', () => {
    expect(ZERO).toBe(BigInt(0))
    expect(ONE).toBe(BigInt(1))
    expect(THOUSAND).toBe(BigInt(1000))
  })
})

describe('pow10', () => {
  it('returns 10^exponent exactly, past the range a number can hold', () => {
    expect(pow10(0)).toBe(BigInt(1))
    expect(pow10(1)).toBe(BigInt(10))
    expect(pow10(3)).toBe(BigInt(1000))
    expect(pow10(25)).toBe(BigInt('10000000000000000000000000'))
  })
})

describe('absBigInt', () => {
  it('drops the sign and leaves non-negative values alone', () => {
    expect(absBigInt(BigInt(-5))).toBe(BigInt(5))
    expect(absBigInt(BigInt(5))).toBe(BigInt(5))
    expect(absBigInt(ZERO)).toBe(ZERO)
    expect(absBigInt(-ABOVE_MAX_SAFE)).toBe(ABOVE_MAX_SAFE)
  })
})

describe('toThousandGroups', () => {
  it('returns no groups for zero on either path', () => {
    expect(toThousandGroups(0)).toEqual([])
    expect(toThousandGroups(BigInt(0))).toEqual([])
  })

  it('splits into base-1000 groups, least significant first', () => {
    expect(toThousandGroups(1234567)).toEqual([567, 234, 1])
    expect(toThousandGroups(BigInt(1234567))).toEqual([567, 234, 1])
    expect(toThousandGroups(1000)).toEqual([0, 1])
    expect(toThousandGroups(BigInt(1000))).toEqual([0, 1])
    expect(toThousandGroups(999)).toEqual([999])
    expect(toThousandGroups(BigInt(999))).toEqual([999])
  })

  it('agrees between the number and bigint paths for safe integers', () => {
    for (const value of [1, 12, 999, 1000, 1001, 100000, 999999, 123456789, 999999999999999]) {
      expect(toThousandGroups(BigInt(value))).toEqual(toThousandGroups(value))
    }
    expect(toThousandGroups(BigInt(Number.MAX_SAFE_INTEGER))).toEqual(
      toThousandGroups(Number.MAX_SAFE_INTEGER),
    )
  })

  it('keeps every digit of a bigint beyond Number.MAX_SAFE_INTEGER', () => {
    expect(toThousandGroups(BigInt('1234567890123456789'))).toEqual([
      789, 456, 123, 890, 567, 234, 1,
    ])
    expect(toThousandGroups(BigInt('9007199254740993'))).toEqual([993, 740, 254, 199, 7, 9])
  })

  it('returns plain numbers as group values', () => {
    for (const group of toThousandGroups(BigInt('1234567890123456789'))) {
      expect(typeof group).toBe('number')
    }
  })
})

describe('maxSupportedBigInt', () => {
  it('is 1000^scaleCount - 1', () => {
    expect(maxSupportedBigInt(1)).toBe(BigInt(999))
    expect(maxSupportedBigInt(2)).toBe(BigInt(999999))
    expect(maxSupportedBigInt(5)).toBe(BigInt('999999999999999'))
  })

  it('agrees with the number cap the launch locales use, and stays exact past it', () => {
    expect(maxSupportedBigInt(5)).toBe(BigInt(1000 ** 5 - 1))
    // 1000 ** 6 - 1 is not representable as a number (it rounds to 1e18).
    expect(maxSupportedBigInt(6)).toBe(BigInt('999999999999999999'))
    expect(maxSupportedBigInt(6).toString()).toBe('999999999999999999')
  })

  it('is zero for no scales at all', () => {
    expect(maxSupportedBigInt(0)).toBe(ZERO)
  })
})

describe('scaleBigInt', () => {
  it('divides and renders exactly `decimals` fractional digits', () => {
    expect(scaleBigInt(BigInt(1536), BigInt(1024), 2)).toBe('1.50')
    expect(scaleBigInt(BigInt(1500), BigInt(1000), 1)).toBe('1.5')
    expect(scaleBigInt(BigInt(1500), BigInt(1000), 3)).toBe('1.500')
    expect(scaleBigInt(BigInt(2500000), BigInt(1000000), 1)).toBe('2.5')
  })

  it('rounds half up on the exact remainder', () => {
    expect(scaleBigInt(BigInt(15), BigInt(10), 0)).toBe('2')
    expect(scaleBigInt(BigInt(25), BigInt(10), 0)).toBe('3')
    expect(scaleBigInt(BigInt(14), BigInt(10), 0)).toBe('1')
    expect(scaleBigInt(BigInt(1005), BigInt(1000), 2)).toBe('1.01')
    expect(scaleBigInt(BigInt(1004), BigInt(1000), 2)).toBe('1.00')
    expect(scaleBigInt(BigInt(1999), BigInt(1000), 0)).toBe('2')
  })

  it('renders an integer with no decimal point when decimals is 0', () => {
    expect(scaleBigInt(BigInt(1000), BigInt(1000), 0)).toBe('1')
    expect(scaleBigInt(BigInt(0), BigInt(1000), 0)).toBe('0')
    expect(scaleBigInt(BigInt(1000), BigInt(1000), 0)).not.toContain('.')
  })

  it('pads a quotient smaller than one so the fraction keeps its digits', () => {
    expect(scaleBigInt(BigInt(5), BigInt(1000), 2)).toBe('0.01')
    expect(scaleBigInt(BigInt(5), BigInt(1000), 3)).toBe('0.005')
    expect(scaleBigInt(BigInt(0), BigInt(1000), 2)).toBe('0.00')
    expect(scaleBigInt(BigInt(1), BigInt(1000), 1)).toBe('0.0')
  })

  it('handles a value far past the range of a number without loss', () => {
    expect(scaleBigInt(BigInt('1234567890123456789'), BigInt(1e12), 1)).toBe('1234567.9')
    expect(scaleBigInt(BigInt('1234567890123456789'), BigInt(1e12), 6)).toBe('1234567.890123')
  })
})

describe('decimalToBigInt', () => {
  it('reads a plain integer', () => {
    expect(decimalToBigInt('15', ONE, 'test')).toBe(BigInt(15))
    expect(decimalToBigInt('0', ONE, 'test')).toBe(ZERO)
  })

  it('honours an explicit sign', () => {
    expect(decimalToBigInt('+7', ONE, 'test')).toBe(BigInt(7))
    expect(decimalToBigInt('-7', ONE, 'test')).toBe(BigInt(-7))
    expect(decimalToBigInt('-0.25', BigInt(100), 'test')).toBe(BigInt(-25))
  })

  it('multiplies by the factor before checking wholeness', () => {
    expect(decimalToBigInt('2.5', BigInt(1000000), 'test')).toBe(BigInt(2500000))
    expect(decimalToBigInt('0.25', BigInt(100), 'test')).toBe(BigInt(25))
    expect(decimalToBigInt('.5', BigInt(2), 'test')).toBe(ONE)
  })

  it('reads exponent notation', () => {
    expect(decimalToBigInt('1e3', ONE, 'test')).toBe(BigInt(1000))
    expect(decimalToBigInt('1e+3', ONE, 'test')).toBe(BigInt(1000))
    expect(decimalToBigInt('1.5e3', ONE, 'test')).toBe(BigInt(1500))
    expect(decimalToBigInt('1.5E-1', BigInt(100), 'test')).toBe(BigInt(15))
    expect(decimalToBigInt('1e21', ONE, 'test')).toBe(BigInt('1000000000000000000000'))
  })

  it('accepts a dangling decimal point on either side', () => {
    expect(decimalToBigInt('5.', ONE, 'test')).toBe(BigInt(5))
    expect(decimalToBigInt('.5', BigInt(10), 'test')).toBe(BigInt(5))
  })

  it('accepts trailing fraction zeros as a whole number', () => {
    expect(decimalToBigInt('1234.00', ONE, 'test')).toBe(BigInt(1234))
    expect(decimalToBigInt('1.000', ONE, 'test')).toBe(ONE)
  })

  it('keeps every digit of a huge value', () => {
    expect(decimalToBigInt('1234567890123456789', ONE, 'test')).toBe(BigInt('1234567890123456789'))
    expect(decimalToBigInt('-9007199254740993', ONE, 'test')).toBe(BigInt('-9007199254740993'))
  })

  it('returns null for text that is not a decimal number at all', () => {
    expect(decimalToBigInt('', ONE, 'test')).toBeNull()
    expect(decimalToBigInt('abc', ONE, 'test')).toBeNull()
    expect(decimalToBigInt('.', ONE, 'test')).toBeNull()
    expect(decimalToBigInt('-', ONE, 'test')).toBeNull()
    expect(decimalToBigInt('Infinity', ONE, 'test')).toBeNull()
    expect(decimalToBigInt('0x1f', ONE, 'test')).toBeNull()
    expect(decimalToBigInt('1 000', ONE, 'test')).toBeNull()
    expect(decimalToBigInt('1e', ONE, 'test')).toBeNull()
  })

  it('throws RangeError when the product is not a whole number', () => {
    expect(() => decimalToBigInt('1.5', ONE, 'test')).toThrow(RangeError)
    expect(() => decimalToBigInt('0.001', BigInt(100), 'test')).toThrow(RangeError)
    expect(() => decimalToBigInt('1.5e-1', ONE, 'test')).toThrow(RangeError)
    expect(() => decimalToBigInt('1.5', ONE, 'myParser')).toThrow(
      'myParser: "1.5" is not a whole number and cannot be returned as a bigint',
    )
  })
})

describe('scaledBigInt', () => {
  it('multiplies the mantissa by the factor exactly', () => {
    expect(scaledBigInt('2.5', 1e6, '.', 'test')).toBe(BigInt(2500000))
    expect(scaledBigInt('1', 1e3, '.', 'test')).toBe(BigInt(1000))
    expect(scaledBigInt('-1.5', 1e3, '.', 'test')).toBe(BigInt(-1500))
  })

  it('normalises the locale decimal separator and trims whitespace', () => {
    expect(scaledBigInt('2,5', 1e6, ',', 'test')).toBe(BigInt(2500000))
    expect(scaledBigInt('  1.5  ', 1e3, '.', 'test')).toBe(BigInt(1500))
    expect(scaledBigInt(' 1,5 ', 1e3, ',', 'test')).toBe(BigInt(1500))
  })

  it('throws RangeError when the scaled value is not whole', () => {
    expect(() => scaledBigInt('1.2345', 1e3, '.', 'test')).toThrow(RangeError)
  })

  it('throws SyntaxError, naming the context, for text that is not a number', () => {
    expect(() => scaledBigInt('abc', 1e3, '.', 'test')).toThrow(SyntaxError)
    expect(() => scaledBigInt('', 1e3, '.', 'test')).toThrow(SyntaxError)
    expect(() => scaledBigInt('abc', 1e3, '.', 'parseX')).toThrow(
      'parseX: unable to parse "abc" as a number',
    )
  })
})

describe('toOutput', () => {
  it('returns the bigint untouched for output "bigint"', () => {
    expect(toOutput(BigInt(42), 'bigint', 'test')).toBe(BigInt(42))
    expect(toOutput(ABOVE_MAX_SAFE, 'bigint', 'test')).toBe(ABOVE_MAX_SAFE)
    expect(toOutput(-ABOVE_MAX_SAFE, 'bigint', 'test')).toBe(-ABOVE_MAX_SAFE)
  })

  it('converts a safe integer to a number for output "number"', () => {
    expect(toOutput(BigInt(42), 'number', 'test')).toBe(42)
    expect(toOutput(BigInt(-42), 'number', 'test')).toBe(-42)
    expect(toOutput(ZERO, 'number', 'test')).toBe(0)
    expect(toOutput(MAX_SAFE, 'number', 'test')).toBe(Number.MAX_SAFE_INTEGER)
    expect(toOutput(-MAX_SAFE, 'number', 'test')).toBe(-Number.MAX_SAFE_INTEGER)
  })

  it('throws RangeError pointing at output: "bigint" for an unsafe number result', () => {
    expect(() => toOutput(ABOVE_MAX_SAFE, 'number', 'test')).toThrow(RangeError)
    expect(() => toOutput(-ABOVE_MAX_SAFE, 'number', 'test')).toThrow(RangeError)
    expect(() => toOutput(ABOVE_MAX_SAFE, 'number', 'parseX')).toThrow(
      `parseX: ${ABOVE_MAX_SAFE} exceeds Number.MAX_SAFE_INTEGER and cannot be returned exactly as a number; pass { output: 'bigint' }`,
    )
  })
})

describe('assertSafeInteger', () => {
  it('accepts everything within ±Number.MAX_SAFE_INTEGER', () => {
    expect(() => assertSafeInteger(ZERO, 'test')).not.toThrow()
    expect(() => assertSafeInteger(MAX_SAFE, 'test')).not.toThrow()
    expect(() => assertSafeInteger(-MAX_SAFE, 'test')).not.toThrow()
  })

  it('throws RangeError one past the boundary in either direction', () => {
    expect(() => assertSafeInteger(ABOVE_MAX_SAFE, 'test')).toThrow(RangeError)
    expect(() => assertSafeInteger(-ABOVE_MAX_SAFE, 'test')).toThrow(RangeError)
    expect(() => assertSafeInteger(-ABOVE_MAX_SAFE, 'test')).toThrow("output: 'bigint'")
  })
})

describe('resolveOutput', () => {
  it('defaults to "number" when the option is omitted', () => {
    expect(resolveOutput(undefined, 'test')).toBe('number')
  })

  it('passes the two valid values through', () => {
    expect(resolveOutput('number', 'test')).toBe('number')
    expect(resolveOutput('bigint', 'test')).toBe('bigint')
  })

  it('throws RangeError, naming both valid values, for anything else', () => {
    // @ts-expect-error — deliberately invalid output to exercise the runtime guard
    expect(() => resolveOutput('string', 'test')).toThrow(RangeError)
    // @ts-expect-error — deliberately invalid output to exercise the runtime guard
    expect(() => resolveOutput(null, 'test')).toThrow(RangeError)
    // @ts-expect-error — deliberately invalid output to exercise the runtime guard
    expect(() => resolveOutput('BigInt', 'parseX')).toThrow(
      'parseX: output must be "number" or "bigint", received BigInt',
    )
  })
})

describe('pluralOperand', () => {
  it('is the identity for safe integers, sign included', () => {
    expect(pluralOperand(ZERO)).toBe(0)
    expect(pluralOperand(ONE)).toBe(1)
    expect(pluralOperand(BigInt(21))).toBe(21)
    expect(pluralOperand(BigInt(-21))).toBe(-21)
    expect(pluralOperand(BigInt(1234567))).toBe(1234567)
    expect(pluralOperand(MAX_SAFE)).toBe(Number.MAX_SAFE_INTEGER)
    expect(pluralOperand(-MAX_SAFE)).toBe(-Number.MAX_SAFE_INTEGER)
  })

  it('folds a value beyond the safe range to its last six digits plus a million', () => {
    // Computed from the definition: Number(|value| % 10^6) + 1e6, sign preserved.
    const huge = BigInt('9007199254740993')
    const expected = Number(huge % BigInt(1000000)) + 1e6
    expect(expected).toBe(1740993)
    expect(pluralOperand(huge)).toBe(expected)
    expect(pluralOperand(-huge)).toBe(-expected)
    expect(pluralOperand(ABOVE_MAX_SAFE)).toBe(Number(ABOVE_MAX_SAFE % BigInt(1000000)) + 1e6)
  })

  it('preserves the operands every CLDR integer plural rule reads', () => {
    const million = BigInt(1000000)
    for (const text of ['9007199254740993', '1234567890123456789', '1000000000000000000000']) {
      const value = BigInt(text)
      const folded = pluralOperand(value)
      expect(Number.isSafeInteger(folded)).toBe(true)
      expect(folded).toBeGreaterThanOrEqual(1e6)
      for (const modulus of [10, 100, 1000, 1000000]) {
        expect(BigInt(folded % modulus)).toBe(value % BigInt(modulus))
      }
      expect(BigInt(folded % 1000000)).toBe(value % million)
    }
  })
})

describe('toSafeNumber', () => {
  it('passes a number through untouched, even a non-integer or non-finite one', () => {
    expect(toSafeNumber(42, 'test')).toBe(42)
    expect(toSafeNumber(-1.5, 'test')).toBe(-1.5)
    expect(toSafeNumber(1e300, 'test')).toBe(1e300)
    expect(toSafeNumber(Number.POSITIVE_INFINITY, 'test')).toBe(Number.POSITIVE_INFINITY)
  })

  it('converts a safe bigint to a number', () => {
    expect(toSafeNumber(BigInt(42), 'test')).toBe(42)
    expect(toSafeNumber(BigInt(-42), 'test')).toBe(-42)
    expect(toSafeNumber(ZERO, 'test')).toBe(0)
    expect(toSafeNumber(MAX_SAFE, 'test')).toBe(Number.MAX_SAFE_INTEGER)
    expect(toSafeNumber(-MAX_SAFE, 'test')).toBe(-Number.MAX_SAFE_INTEGER)
  })

  it('throws RangeError for a bigint outside the safe range', () => {
    expect(() => toSafeNumber(ABOVE_MAX_SAFE, 'test')).toThrow(RangeError)
    expect(() => toSafeNumber(-ABOVE_MAX_SAFE, 'test')).toThrow(RangeError)
    expect(() => toSafeNumber(ABOVE_MAX_SAFE, 'getOrdinalSuffix')).toThrow(
      `getOrdinalSuffix: ${ABOVE_MAX_SAFE} exceeds Number.MAX_SAFE_INTEGER; a locale's ordinal hooks take a number, so a bigint must be a safe integer`,
    )
  })
})
