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

/**
 * `bigint` byte counts, well past `Number.MAX_SAFE_INTEGER` — the input a
 * `fs.statSync(path, { bigint: true }).size` or a summed archive could hand
 * over. Bounds are built with `BigInt('…')`: the ES2018 target has no `n`
 * literal.
 */
const bigByteCount = fc.bigInt({ min: BigInt(0), max: BigInt('1000000000000000000000000000000') })
/** A safe-range `bigint`, so the number path can be run on the same value for comparison. */
const safeBigByteCount = fc.bigInt({ min: BigInt(0), max: BigInt(Number.MAX_SAFE_INTEGER) })
/**
 * A unit count below either base, so `count × base^k` formats as exactly
 * `count` of the k-th unit (no rounding) and stays inside the PB range for
 * k ≤ 5.
 */
const unitCount = fc.bigInt({ min: BigInt(1), max: BigInt(999) })

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

  describe('bigint input', () => {
    it('agrees with the number path on every safe integer', () => {
      fc.assert(
        fc.property(
          safeBigByteCount,
          fc.integer({ min: 0, max: 6 }),
          fc.constantFrom(1024, 1000),
          (bytes, decimals, base) => {
            const options = { decimals, base }
            expect(toByteSize(bytes, options)).toBe(toByteSize(Number(bytes), options))
          },
        ),
      )
    })

    it('round-trips exactly through output: "bigint" when the size is a whole unit multiple', () => {
      fc.assert(
        fc.property(
          unitCount,
          fc.integer({ min: 0, max: 5 }),
          fc.constantFrom(1024, 1000),
          (count, exponent, base) => {
            const bytes = count * BigInt(base) ** BigInt(exponent)
            const options = { base }
            expect(
              parseByteSize(toByteSize(bytes, options), { ...options, output: 'bigint' }),
            ).toBe(bytes)
          },
        ),
      )
    })

    it('recovers a huge byte count to within the precision the format keeps', () => {
      fc.assert(
        fc.property(
          bigByteCount,
          fc.integer({ min: 0, max: 6 }),
          fc.constantFrom(1024, 1000),
          (bytes, decimals, base) => {
            const options = { decimals, base }
            const formatted = toByteSize(bytes, options)
            // The number path may round the huge value, so compare through the
            // exact bigint parser and a rational bound scaled to the input.
            let roundTrip: bigint
            try {
              roundTrip = parseByteSize(formatted, { ...options, output: 'bigint' })
            } catch (error) {
              // A non-whole rounded size cannot come back as a bigint; the
              // number parser still recovers it approximately.
              expect(error).toBeInstanceOf(RangeError)
              const approximate = parseByteSize(formatted, options)
              const relativeError =
                Math.abs(approximate - Number(bytes)) / Math.max(1, Number(bytes))
              expect(relativeError).toBeLessThanOrEqual(0.5 * 10 ** -decimals + 1e-9)
              return
            }
            const difference = roundTrip > bytes ? roundTrip - bytes : bytes - roundTrip
            // The scaled value is rounded to `decimals` places, so
            // |Δ| ≤ 0.5·10^-decimals·threshold ≤ 0.5·10^-decimals·bytes, i.e.
            // |Δ|·2·10^decimals ≤ bytes — checked in exact integer arithmetic.
            expect(difference * BigInt(2) * BigInt(10) ** BigInt(decimals) <= bytes).toBe(true)
          },
        ),
      )
    })

    it('rejects negative bigint byte counts', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: BigInt('-1000000000000000000000000000000'), max: BigInt(-1) }),
          (bytes) => {
            expect(() => toByteSize(bytes)).toThrow(RangeError)
          },
        ),
      )
    })
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
