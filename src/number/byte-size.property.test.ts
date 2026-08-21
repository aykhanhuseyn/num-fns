import { describe, expect, it } from 'bun:test'
import fc from 'fast-check'
import { parseByteSize, toByteSize } from './byte-size'

/**
 * `toByteSize` is lossy by design — it rounds a scaled value to `decimals`
 * places and drops trailing zeros — so the round trip is bounded, not exact.
 * The bound is what a caller can actually rely on, and it is worth pinning:
 * the scaled value is always in `[1, base)`, so rounding it to `d` places
 * costs at most half a unit of the last kept digit *relative* to the value.
 */
const byteCount = fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER })

describe('toByteSize/parseByteSize round trip', () => {
  it('recovers the byte count to within the precision the format keeps', () => {
    fc.assert(
      fc.property(
        byteCount,
        fc.integer({ min: 0, max: 6 }),
        fc.constantFrom(1024, 1000),
        (bytes, decimals, base) => {
          const options = { decimals, base }
          const roundTrip = parseByteSize(toByteSize(bytes, options), options)
          const relativeError = Math.abs(roundTrip - bytes) / Math.max(1, bytes)
          expect(relativeError).toBeLessThanOrEqual(0.5 * 10 ** -decimals + 1e-9)
        },
      ),
    )
  })

  it('is exact below one KB, where no scaling happens', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 999 }), (bytes) => {
        expect(parseByteSize(toByteSize(bytes))).toBe(bytes)
      }),
    )
  })

  it('never emits a scaled value outside [1, base)', () => {
    fc.assert(
      fc.property(byteCount, fc.constantFrom(1024, 1000), (bytes, base) => {
        const formatted = toByteSize(bytes, { base, decimals: 6 })
        const [amount = ''] = formatted.split(' ')
        const scaled = Number(amount)
        if (formatted.endsWith(' B')) expect(scaled).toBeLessThan(base)
        else {
          expect(scaled).toBeGreaterThanOrEqual(1)
          // The largest scale (PB) has nothing above it to promote into, so a
          // big enough byte count legitimately scales past `base`.
          if (!formatted.endsWith('PB')) expect(scaled).toBeLessThan(base)
        }
      }),
    )
  })

  it('rejects negative and non-finite byte counts', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: -1 }), (bytes) => {
        expect(() => toByteSize(bytes)).toThrow(RangeError)
      }),
    )
    expect(() => toByteSize(Number.POSITIVE_INFINITY)).toThrow(RangeError)
    expect(() => toByteSize(Number.NaN)).toThrow(RangeError)
  })
})
