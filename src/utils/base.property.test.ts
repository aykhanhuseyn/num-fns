import { describe, expect, it } from 'bun:test'
import fc from 'fast-check'
import { fromBase, toBase } from './base'

const RADIX = { min: 2, max: 36 }
/** Safe-integer bound: `toBase` rejects anything `Number.isSafeInteger` does. */
const SAFE_INTEGERS = { min: -Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER }
/** `bigint`s far past the safe range — the values only the `bigint` paths can carry exactly. */
const BIG_INTEGERS = {
  min: BigInt('-1000000000000000000000000000000000000000'),
  max: BigInt('1000000000000000000000000000000000000000'),
}
/** The first magnitude a `number` cannot hold exactly: `2^53 = MAX_SAFE_INTEGER + 1`. */
const FIRST_UNSAFE = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1)

describe('toBase/fromBase', () => {
  it('round-trips every safe integer in every radix', () => {
    fc.assert(
      fc.property(fc.integer(SAFE_INTEGERS), fc.integer(RADIX), (value, radix) => {
        expect(fromBase(toBase(value, radix), radix)).toBe(value)
      }),
    )
  })

  it('accepts its own output case-insensitively and with a leading +', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1e12 }), fc.integer(RADIX), (value, radix) => {
        const digits = toBase(value, radix)
        expect(fromBase(digits.toUpperCase(), radix)).toBe(value)
        expect(fromBase(`+${digits}`, radix)).toBe(value)
        expect(fromBase(`  ${digits}  `, radix)).toBe(value)
      }),
    )
  })

  it('emits only digits from the radix’s alphabet, and a sign only when negative', () => {
    fc.assert(
      fc.property(fc.integer(SAFE_INTEGERS), fc.integer(RADIX), (value, radix) => {
        const digits = toBase(value, radix)
        const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, radix)
        expect(digits.startsWith('-')).toBe(value < 0)
        for (const char of digits.replace('-', '')) {
          expect(alphabet).toContain(char)
        }
      }),
    )
  })

  it('agrees with the platform for the radices JavaScript has literals for', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), (value) => {
        expect(toBase(value, 2)).toBe(value.toString(2))
        expect(toBase(value, 8)).toBe(value.toString(8))
        expect(toBase(value, 16)).toBe(value.toString(16))
        expect(fromBase(toBase(value, 16), 16)).toBe(Number.parseInt(value.toString(16), 16))
      }),
    )
  })

  describe('bigint', () => {
    it('round-trips every bigint in every radix through output: "bigint"', () => {
      fc.assert(
        fc.property(fc.bigInt(BIG_INTEGERS), fc.integer(RADIX), (value, radix) => {
          expect(fromBase(toBase(value, radix), radix, { output: 'bigint' })).toBe(value)
        }),
      )
    })

    it('agrees with the number path on every safe integer', () => {
      fc.assert(
        fc.property(fc.integer(SAFE_INTEGERS), fc.integer(RADIX), (value, radix) => {
          const digits = toBase(BigInt(value), radix)
          expect(digits).toBe(toBase(value, radix))
          expect(fromBase(digits, radix, { output: 'bigint' })).toBe(BigInt(value))
          expect(fromBase(digits, radix)).toBe(value)
        }),
      )
    })

    it('refuses to return a rounded number past the safe range, in every radix', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: FIRST_UNSAFE, max: BIG_INTEGERS.max }),
          fc.integer(RADIX),
          fc.boolean(),
          (magnitude, radix, negative) => {
            const value = negative ? -magnitude : magnitude
            const digits = toBase(value, radix)
            expect(() => fromBase(digits, radix)).toThrow(RangeError)
            expect(fromBase(digits, radix, { output: 'bigint' })).toBe(value)
          },
        ),
      )
    })
  })

  it('rejects radices outside 2-36 and non-integer values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.oneof(fc.integer({ min: -100, max: 1 }), fc.integer({ min: 37, max: 1000 })),
        (value, radix) => {
          expect(() => toBase(value, radix)).toThrow(RangeError)
          expect(() => fromBase('1', radix)).toThrow(RangeError)
        },
      ),
    )
  })
})
