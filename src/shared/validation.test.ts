import { describe, expect, it } from 'bun:test'
import {
  assertFinite,
  assertFiniteBounds,
  assertFiniteRate,
  assertFiniteResult,
  assertNonNegative,
  assertPositive,
  assertPositiveInteger,
} from './validation'

describe('assertFinite', () => {
  it('does not throw for a finite number', () => {
    expect(() => assertFinite(5, 'value', 'fn')).not.toThrow()
  })

  it('throws RangeError with the context/label/value in the message', () => {
    expect(() => assertFinite(Number.NaN, 'value', 'fn')).toThrow(
      new RangeError('fn: value must be finite, received NaN'),
    )
    expect(() => assertFinite(Number.POSITIVE_INFINITY, 'value', 'fn')).toThrow(RangeError)
  })
})

describe('assertFiniteRate', () => {
  it('does not throw for a finite rate greater than -1', () => {
    expect(() => assertFiniteRate(0.05, 'fn')).not.toThrow()
    expect(() => assertFiniteRate(-0.5, 'fn')).not.toThrow()
  })

  it('throws for non-finite or <= -1 rates', () => {
    expect(() => assertFiniteRate(Number.NaN, 'fn')).toThrow(RangeError)
    expect(() => assertFiniteRate(-1, 'fn')).toThrow(
      new RangeError('fn: rate must be finite and greater than -1, received -1'),
    )
    expect(() => assertFiniteRate(-2, 'fn')).toThrow(RangeError)
  })
})

describe('assertNonNegative', () => {
  it('does not throw for 0 or a positive finite number', () => {
    expect(() => assertNonNegative(0, 'time', 'fn')).not.toThrow()
    expect(() => assertNonNegative(3, 'time', 'fn')).not.toThrow()
  })

  it('throws for negative or non-finite values', () => {
    expect(() => assertNonNegative(-1, 'time', 'fn')).toThrow(
      new RangeError('fn: time must be a finite number >= 0, received -1'),
    )
    expect(() => assertNonNegative(Number.NaN, 'time', 'fn')).toThrow(RangeError)
  })
})

describe('assertPositive', () => {
  it('does not throw for a positive finite number', () => {
    expect(() => assertPositive(1, 'n', 'fn')).not.toThrow()
  })

  it('throws for 0, negative, or non-finite values', () => {
    expect(() => assertPositive(0, 'n', 'fn')).toThrow(
      new RangeError('fn: n must be a finite number > 0, received 0'),
    )
    expect(() => assertPositive(-1, 'n', 'fn')).toThrow(RangeError)
    expect(() => assertPositive(Number.NaN, 'n', 'fn')).toThrow(RangeError)
  })
})

describe('assertPositiveInteger', () => {
  it('does not throw for a positive integer', () => {
    expect(() => assertPositiveInteger(1, 'periods', 'fn')).not.toThrow()
  })

  it('throws for 0, negative, non-integer, or non-finite values', () => {
    expect(() => assertPositiveInteger(0, 'periods', 'fn')).toThrow(
      new RangeError('fn: periods must be a positive integer, received 0'),
    )
    expect(() => assertPositiveInteger(-3, 'periods', 'fn')).toThrow(RangeError)
    expect(() => assertPositiveInteger(3.5, 'periods', 'fn')).toThrow(RangeError)
    expect(() => assertPositiveInteger(Number.NaN, 'periods', 'fn')).toThrow(RangeError)
  })
})

describe('assertFiniteBounds', () => {
  it('does not throw when min and max are finite and min <= max', () => {
    expect(() => assertFiniteBounds(0, 10, 'fn')).not.toThrow()
    expect(() => assertFiniteBounds(5, 5, 'fn')).not.toThrow()
  })

  it('throws when min or max is not finite', () => {
    expect(() => assertFiniteBounds(Number.NaN, 10, 'fn')).toThrow(
      new RangeError('fn: min and max must be finite, received min=NaN, max=10'),
    )
    expect(() => assertFiniteBounds(0, Number.POSITIVE_INFINITY, 'fn')).toThrow(RangeError)
  })

  it('throws when min is greater than max', () => {
    expect(() => assertFiniteBounds(10, 0, 'fn')).toThrow(
      new RangeError('fn: min (10) must not be greater than max (0)'),
    )
  })
})

describe('assertFiniteResult', () => {
  it('does not throw for a finite result', () => {
    expect(() => assertFiniteResult(1e308, 'fn')).not.toThrow()
    expect(() => assertFiniteResult(-0, 'fn')).not.toThrow()
  })

  it('throws RangeError for a result that overflowed', () => {
    expect(() => assertFiniteResult(Number.POSITIVE_INFINITY, 'fn')).toThrow(
      new RangeError('fn: result Infinity is outside the range of a JavaScript number'),
    )
    expect(() => assertFiniteResult(Number.NEGATIVE_INFINITY, 'fn')).toThrow(RangeError)
    expect(() => assertFiniteResult(Number.NaN, 'fn')).toThrow(RangeError)
  })
})
