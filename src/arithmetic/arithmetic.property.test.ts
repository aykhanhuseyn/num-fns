import { describe, expect, it } from 'bun:test'
import fc from 'fast-check'
import { decimalNumber } from '../shared/arbitraries.test'
import type { RoundingMode } from '../shared/types'
import { add } from './add'
import { toDecimal } from './decimal'
import { divide } from './divide'
import { multiply } from './multiply'
import { round } from './round'
import { subtract } from './subtract'

/**
 * Property tests for the decimal-safe arithmetic (`todo.md` §4). The
 * example-based files pin specific values; these check the algebra a caller
 * relies on — inverses, identities, commutativity, agreement with an exact
 * `BigInt` oracle — across randomly generated decimals. Comparisons between
 * two results always go through `toBe` (i.e. `Object.is`), never through
 * float `-`, so a `-0` or a one-ulp drift would fail rather than be absorbed.
 */

/** Every mode `round` accepts. */
const ROUNDING_MODES: readonly RoundingMode[] = ['halfUp', 'halfDown', 'halfEven', 'ceil', 'floor']

/** The tie-breaking modes, which all round to the *nearest* kept digit. */
const HALF_ROUNDING_MODES: readonly RoundingMode[] = ['halfUp', 'halfDown', 'halfEven']

/**
 * A decimal together with the exact `BigInt` it was built from, so a test
 * can compute the oracle result without ever touching float arithmetic. The
 * `String(value)` round trip is guaranteed by the same construction
 * `decimalNumber` uses (few enough significant digits, no exponent form).
 */
interface ExactDecimal {
  value: number
  digits: bigint
  scale: number
}

function exactDecimal(maxFractionDigits: number): fc.Arbitrary<ExactDecimal> {
  return fc
    .tuple(
      fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }),
      fc.integer({ min: 0, max: 10 ** maxFractionDigits - 1 }),
    )
    .map(([whole, fraction]) => {
      const fractionDigits = String(fraction).padStart(maxFractionDigits, '0')
      const literal = `${whole}.${fractionDigits}`
      const negative = whole < 0
      const digits = BigInt(`${negative ? '-' : ''}${Math.abs(whole)}${fractionDigits}`)
      return { value: Number(literal), digits, scale: maxFractionDigits }
    })
}

/**
 * Decimals with at most 5 integer digits and `maxFractionDigits` fractional
 * ones — small enough that the product of two of them has at most 14
 * significant digits, so it is exactly representable and division can undo
 * multiplication without any rounding.
 */
function smallDecimal(maxFractionDigits: number): fc.Arbitrary<number> {
  return fc
    .tuple(
      fc.integer({ min: -99_999, max: 99_999 }),
      fc.integer({ min: 0, max: 10 ** maxFractionDigits - 1 }),
    )
    .map(([whole, fraction]) =>
      Number(`${whole}.${String(fraction).padStart(maxFractionDigits, '0')}`),
    )
}

/** Trailing zeros of a fractional part, which `String(number)` never prints. */
const TRAILING_ZEROS = /0+$/

/** Writes `digits × 10^-scale` as a plain decimal string, the way `String()` would for a number in range. */
function decimalString(digits: bigint, scale: number): string {
  const negative = digits < BigInt(0)
  const magnitude = (negative ? -digits : digits).toString().padStart(scale + 1, '0')
  const integer = magnitude.slice(0, magnitude.length - scale)
  const fraction = magnitude.slice(magnitude.length - scale).replace(TRAILING_ZEROS, '')
  return `${negative ? '-' : ''}${integer}${fraction ? `.${fraction}` : ''}`
}

/** Number of fractional digits in the shortest decimal reading of `value`, as `round` sees it. */
function fractionDigits(value: number): number {
  return Math.max(0, toDecimal(value).scale)
}

/** Whether rounding `value` to `precision` places lands exactly on a tie. */
function isTie(value: number, precision: number): boolean {
  const { digits, scale } = toDecimal(value)
  const dropped = scale - precision
  if (dropped <= 0) return false
  const magnitude = digits < BigInt(0) ? -digits : digits
  const factor = BigInt(10) ** BigInt(dropped)
  return magnitude % factor === (factor * BigInt(5)) / BigInt(10)
}

describe('add/subtract', () => {
  it('subtract undoes add exactly', () => {
    fc.assert(
      fc.property(decimalNumber(4), decimalNumber(4), (a, b) => {
        expect(subtract(add(a, b), b)).toBe(a)
        expect(subtract(add(a, b), a)).toBe(b)
      }),
    )
  })

  it('add undoes subtract exactly', () => {
    fc.assert(
      fc.property(decimalNumber(4), decimalNumber(4), (a, b) => {
        expect(add(subtract(a, b), b)).toBe(a)
      }),
    )
  })

  it('has 0 as the additive identity', () => {
    fc.assert(
      fc.property(decimalNumber(6), (a) => {
        expect(add(a, 0)).toBe(a)
        expect(add(0, a)).toBe(a)
        expect(subtract(a, 0)).toBe(a)
      }),
    )
  })

  it('is commutative', () => {
    fc.assert(
      fc.property(decimalNumber(5), decimalNumber(3), (a, b) => {
        expect(add(a, b)).toBe(add(b, a))
      }),
    )
  })

  it('subtracting a value from itself gives exactly 0', () => {
    fc.assert(
      fc.property(decimalNumber(6), (a) => {
        expect(subtract(a, a)).toBe(0)
        expect(add(a, -a)).toBe(0)
      }),
    )
  })

  it('agrees with an exact BigInt oracle on the decimal string', () => {
    fc.assert(
      fc.property(exactDecimal(4), exactDecimal(4), (a, b) => {
        const sum = decimalString(a.digits + b.digits, a.scale)
        const difference = decimalString(a.digits - b.digits, a.scale)
        expect(add(a.value, b.value)).toBe(Number(sum))
        expect(subtract(a.value, b.value)).toBe(Number(difference))
      }),
    )
  })

  it('agrees with the oracle when the operands have different scales', () => {
    fc.assert(
      fc.property(exactDecimal(2), exactDecimal(5), (a, b) => {
        const aDigits = a.digits * BigInt(10) ** BigInt(b.scale - a.scale)
        expect(add(a.value, b.value)).toBe(Number(decimalString(aDigits + b.digits, b.scale)))
        expect(subtract(a.value, b.value)).toBe(Number(decimalString(aDigits - b.digits, b.scale)))
      }),
    )
  })
})

describe('multiply/divide', () => {
  it('has 1 as the multiplicative identity', () => {
    fc.assert(
      fc.property(decimalNumber(6), (a) => {
        expect(multiply(a, 1)).toBe(a)
        expect(multiply(1, a)).toBe(a)
        expect(divide(a, 1)).toBe(a)
      }),
    )
  })

  it('multiplying by 0 gives exactly 0', () => {
    fc.assert(
      fc.property(decimalNumber(6), (a) => {
        expect(Object.is(multiply(a, 0), signedZero(a))).toBe(true)
        expect(Object.is(multiply(0, a), signedZero(a))).toBe(true)
      }),
    )
  })

  it('is commutative', () => {
    fc.assert(
      fc.property(decimalNumber(4), decimalNumber(4), (a, b) => {
        expect(multiply(a, b)).toBe(multiply(b, a))
      }),
    )
  })

  it('divide undoes multiply when the product terminates', () => {
    // Few enough digits (at most 7 each) that the product fits well within a
    // number's 17 significant digits, so the quotient is exact, not rounded.
    fc.assert(
      fc.property(smallDecimal(2), smallDecimal(2), (a, b) => {
        fc.pre(b !== 0)
        expect(divide(multiply(a, b), b)).toBe(a)
      }),
    )
  })

  it('dividing a non-zero value by itself gives exactly 1', () => {
    fc.assert(
      fc.property(decimalNumber(6), (a) => {
        fc.pre(a !== 0)
        expect(divide(a, a)).toBe(1)
      }),
    )
  })

  it('agrees with an exact BigInt oracle for the product', () => {
    fc.assert(
      fc.property(exactDecimal(3), exactDecimal(3), (a, b) => {
        const product = decimalString(a.digits * b.digits, a.scale + b.scale)
        expect(multiply(a.value, b.value)).toBe(Number(product))
      }),
    )
  })

  it('dividing by a power of ten just shifts the decimal point', () => {
    fc.assert(
      fc.property(exactDecimal(3), fc.integer({ min: 0, max: 6 }), (a, shift) => {
        const expected = Number(decimalString(a.digits, a.scale + shift))
        expect(divide(a.value, 10 ** shift)).toBe(expected)
        expect(multiply(a.value, Number(`1e-${shift}`))).toBe(expected)
      }),
    )
  })
})

describe('round', () => {
  it('keeps at most `precision` fractional digits', () => {
    fc.assert(
      fc.property(
        decimalNumber(6),
        fc.integer({ min: 0, max: 6 }),
        fc.constantFrom(...ROUNDING_MODES),
        (value, precision, mode) => {
          const rounded = round(value, precision, mode)
          expect(fractionDigits(rounded)).toBeLessThanOrEqual(precision)
          expect(String(rounded)).not.toContain('e')
        },
      ),
    )
  })

  it('moves a value by at most half a unit of the last kept digit in the half modes', () => {
    fc.assert(
      fc.property(
        decimalNumber(6),
        fc.integer({ min: 0, max: 6 }),
        fc.constantFrom(...HALF_ROUNDING_MODES),
        (value, precision, mode) => {
          const bound = Number(`5e-${precision + 1}`)
          const distance = Math.abs(subtract(round(value, precision, mode), value))
          expect(distance).toBeLessThanOrEqual(bound)
        },
      ),
    )
  })

  it('is idempotent', () => {
    fc.assert(
      fc.property(
        decimalNumber(6),
        fc.integer({ min: -3, max: 6 }),
        fc.constantFrom(...ROUNDING_MODES),
        (value, precision, mode) => {
          const once = round(value, precision, mode)
          expect(round(once, precision, mode)).toBe(once)
        },
      ),
    )
  })

  it('brackets the value between floor and ceil, each within one unit', () => {
    fc.assert(
      fc.property(decimalNumber(6), fc.integer({ min: -3, max: 6 }), (value, precision) => {
        const unit = Number(`1e${-precision}`)
        const up = round(value, precision, 'ceil')
        const down = round(value, precision, 'floor')
        expect(up).toBeGreaterThanOrEqual(value)
        expect(down).toBeLessThanOrEqual(value)
        expect(subtract(up, value)).toBeLessThan(unit)
        expect(subtract(value, down)).toBeLessThan(unit)
        // Both are the value itself or two adjacent grid points.
        expect(subtract(up, down)).toBeLessThanOrEqual(unit)
      }),
    )
  })

  it('leaves a value that already fits within `precision` unchanged in every mode', () => {
    fc.assert(
      fc.property(
        decimalNumber(3),
        fc.integer({ min: 3, max: 10 }),
        fc.constantFrom(...ROUNDING_MODES),
        (value, precision, mode) => {
          expect(round(value, precision, mode)).toBe(value === 0 ? 0 : value)
        },
      ),
    )
  })

  it('makes the half modes agree whenever the dropped digits are not an exact tie', () => {
    fc.assert(
      fc.property(decimalNumber(6), fc.integer({ min: -2, max: 5 }), (value, precision) => {
        fc.pre(!isTie(value, precision))
        const halfUp = round(value, precision, 'halfUp')
        expect(round(value, precision, 'halfDown')).toBe(halfUp)
        expect(round(value, precision, 'halfEven')).toBe(halfUp)
        // And, off a tie, nearest is one of the two neighbours.
        expect([round(value, precision, 'ceil'), round(value, precision, 'floor')]).toContain(
          halfUp,
        )
      }),
    )
  })

  it('makes the half modes differ only in the direction of an exact tie', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100_000, max: 100_000 }), (n) => {
        const value = Number(`${n}.5`)
        const up = round(value, 0, 'halfUp')
        const down = round(value, 0, 'halfDown')
        const even = round(value, 0, 'halfEven')
        expect(Math.abs(subtract(up, down))).toBe(1)
        expect(Math.abs(up)).toBe(Math.abs(n) + 1)
        expect(Math.abs(down)).toBe(Math.abs(n))
        expect(even % 2 === 0).toBe(true)
        expect([up, down]).toContain(even)
      }),
    )
  })

  it('matches Math.round, Math.ceil and Math.floor at precision 0 off a tie', () => {
    fc.assert(
      fc.property(decimalNumber(4), (value) => {
        fc.pre(!isTie(value, 0))
        for (const mode of HALF_ROUNDING_MODES) {
          expect(round(value, 0, mode)).toBe(Math.round(value) === 0 ? 0 : Math.round(value))
        }
        expect(round(value, 0, 'ceil')).toBe(Math.ceil(value) === 0 ? 0 : Math.ceil(value))
        expect(round(value, 0, 'floor')).toBe(Math.floor(value) === 0 ? 0 : Math.floor(value))
      }),
    )
  })

  it('rounds integers to a negative precision like scaled integer rounding', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: 1_000_000 }), (n) => {
        // Round to hundreds through exact integer arithmetic on the oracle side.
        const quotient = Math.trunc(n / 100)
        const remainder = Math.abs(n % 100)
        const sign = n < 0 ? -1 : 1
        const halfUp = remainder >= 50 ? quotient + sign : quotient
        // A zero result keeps the sign of the input, so the oracle has to too.
        const zero = signedZero(n)
        expect(round(n, -2)).toBe(halfUp * 100 === 0 ? zero : halfUp * 100)
        expect(round(n, -2, 'floor')).toBe(
          Math.floor(n / 100) * 100 === 0 ? zero : Math.floor(n / 100) * 100,
        )
        expect(round(n, -2, 'ceil')).toBe(
          Math.ceil(n / 100) * 100 === 0 ? zero : Math.ceil(n / 100) * 100,
        )
      }),
    )
  })

  it('is odd-symmetric in the sign-agnostic modes and mirrors ceil/floor', () => {
    fc.assert(
      fc.property(decimalNumber(6), fc.integer({ min: -2, max: 5 }), (value, precision) => {
        fc.pre(value !== 0)
        for (const mode of HALF_ROUNDING_MODES) {
          expect(round(-value, precision, mode)).toBe(-round(value, precision, mode))
        }
        expect(round(-value, precision, 'ceil')).toBe(-round(value, precision, 'floor'))
        expect(round(-value, precision, 'floor')).toBe(-round(value, precision, 'ceil'))
      }),
    )
  })
})

/**
 * The zero a result should carry given the sign of the value it came from —
 * the oracle for the "`-0` is a value" rule. Kept at module scope so the
 * property callbacks stay under Biome's cognitive-complexity ceiling.
 */
function signedZero(value: number): number {
  return value < 0 || Object.is(value, -0) ? -0 : 0
}

describe('signed zero (IEEE 754)', () => {
  it('add and subtract give -0 only where IEEE says they must', () => {
    fc.assert(
      fc.property(decimalNumber(4), decimalNumber(4), (a, b) => {
        for (const result of [
          add(a, b),
          add(a, -a),
          add(-a, a),
          subtract(a, b),
          subtract(a, a),
          subtract(-a, -a),
        ]) {
          expect(Object.is(result, -0)).toBe(false)
        }
        expect(Object.is(add(-0, -0), -0)).toBe(true)
        expect(Object.is(subtract(-0, 0), -0)).toBe(true)
      }),
    )
  })

  it('multiply and divide sign a zero result by their operands', () => {
    fc.assert(
      fc.property(decimalNumber(4), decimalNumber(4), (a, b) => {
        expect(Object.is(multiply(a, 0), signedZero(a))).toBe(true)
        expect(Object.is(multiply(-a, 0), signedZero(-a))).toBe(true)
        expect(Object.is(multiply(0, -a), signedZero(-a))).toBe(true)
        fc.pre(b !== 0)
        expect(Object.is(divide(0, -b), signedZero(-b))).toBe(true)
        expect(Object.is(divide(-0, b), signedZero(-b))).toBe(true)
      }),
    )
  })

  it('round keeps the sign of a value that rounds away to zero', () => {
    fc.assert(
      fc.property(
        decimalNumber(6),
        fc.integer({ min: -12, max: 6 }),
        fc.constantFrom(...ROUNDING_MODES),
        (value, precision, mode) => {
          // The magnitude decides whether the result is zero at all; the sign
          // of the input decides the sign of that zero, always.
          for (const input of [value, -value, -0, 0]) {
            const result = round(input, precision, mode)
            if (result === 0) {
              expect(Object.is(result, -0)).toBe(Object.is(signedZero(input), -0))
            }
          }
        },
      ),
    )
  })
})
