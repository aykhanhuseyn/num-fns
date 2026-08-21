import { describe, expect, it } from 'bun:test'
import fc from 'fast-check'
import { fromRoman, toRoman } from './roman'

/** `toRoman` covers 1-3999; standard numerals have no zero and no vinculum. */
const ROMAN_RANGE = { min: 1, max: 3999 }
const ROMAN_NUMERAL_REGEX = /^[MDCLXVI]+$/

describe('toRoman/fromRoman', () => {
  it('round-trips every value in range — checked exhaustively, not sampled', () => {
    // 3999 values is cheap enough to just enumerate, which is strictly better
    // than sampling for a function whose whole domain is this small.
    for (let value = ROMAN_RANGE.min; value <= ROMAN_RANGE.max; value++) {
      expect(fromRoman(toRoman(value))).toBe(value)
    }
  })

  it('only ever emits the seven standard numerals', () => {
    fc.assert(
      fc.property(fc.integer(ROMAN_RANGE), (value) => {
        expect(toRoman(value)).toMatch(ROMAN_NUMERAL_REGEX)
      }),
    )
  })

  it('is order-preserving: a larger number never produces a shorter-sorting numeral', () => {
    fc.assert(
      fc.property(fc.integer(ROMAN_RANGE), fc.integer(ROMAN_RANGE), (a, b) => {
        if (a === b) return
        const [smaller, larger] = a < b ? [a, b] : [b, a]
        expect(fromRoman(toRoman(smaller))).toBeLessThan(fromRoman(toRoman(larger)))
      }),
    )
  })

  it('accepts its own output case-insensitively', () => {
    fc.assert(
      fc.property(fc.integer(ROMAN_RANGE), (value) => {
        const numeral = toRoman(value)
        expect(fromRoman(numeral.toLowerCase())).toBe(value)
        expect(fromRoman(numeral.toUpperCase())).toBe(value)
      }),
    )
  })

  it('rejects everything outside 1-3999', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100_000, max: 0 }), (value) => {
        expect(() => toRoman(value)).toThrow(RangeError)
      }),
    )
    fc.assert(
      fc.property(fc.integer({ min: 4000, max: 100_000 }), (value) => {
        expect(() => toRoman(value)).toThrow(RangeError)
      }),
    )
  })
})
