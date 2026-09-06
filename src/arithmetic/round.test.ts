import { describe, expect, it } from 'bun:test'
import { round } from './round'

describe('round', () => {
  it('matches the documented examples', () => {
    expect(round(1.005, 2)).toBe(1.01)
    expect(round(2.5)).toBe(3)
    expect(round(2.5, 0, 'halfEven')).toBe(2)
    expect(round(-2.5, 0, 'halfDown')).toBe(-2)
    expect(round(1234, -2)).toBe(1200)
    expect(round(-1.21, 1, 'floor')).toBe(-1.3)
  })

  it('rounds the value as written, not as the binary float is stored', () => {
    expect(Math.round(1.005 * 100) / 100).toBe(1)
    expect(round(1.005, 2)).toBe(1.01)
    expect(round(2.675, 2)).toBe(2.68)
    expect(round(1.255, 2)).toBe(1.26)
    expect(round(-1.005, 2)).toBe(-1.01)
    expect(round(0.615, 2)).toBe(0.62)
  })

  it('defaults to zero decimal places and halfUp', () => {
    expect(round(1.4)).toBe(1)
    expect(round(1.6)).toBe(2)
    expect(round(-1.4)).toBe(-1)
    expect(round(-1.6)).toBe(-2)
    expect(round(1.5)).toBe(2)
    expect(round(-1.5)).toBe(-2)
  })

  it('rounds to a positive number of decimal places', () => {
    expect(round(1.23456, 2)).toBe(1.23)
    expect(round(1.23456, 3)).toBe(1.235)
    expect(round(-1.23456, 4)).toBe(-1.2346)
    expect(round(999.999, 2)).toBe(1000)
    expect(round(-999.999, 2)).toBe(-1000)
    expect(round(0.999, 0)).toBe(1)
  })

  it('handles the large-magnitude case that breaks scale-and-divide rounding', () => {
    expect(round(-268435456.47635, 4)).toBe(-268435456.4764)
    expect(round(268435456.47635, 4)).toBe(268435456.4764)
  })

  describe('exact ties in every mode', () => {
    it('halfUp rounds half away from zero', () => {
      expect(round(2.5, 0, 'halfUp')).toBe(3)
      expect(round(-2.5, 0, 'halfUp')).toBe(-3)
      expect(round(0.5, 0, 'halfUp')).toBe(1)
      expect(round(-0.5, 0, 'halfUp')).toBe(-1)
      expect(round(1.5, 0, 'halfUp')).toBe(2)
      expect(round(-1.5, 0, 'halfUp')).toBe(-2)
    })

    it('halfDown rounds half toward zero', () => {
      expect(round(2.5, 0, 'halfDown')).toBe(2)
      expect(round(-2.5, 0, 'halfDown')).toBe(-2)
      expect(round(0.5, 0, 'halfDown')).toBe(0)
      expect(round(-0.5, 0, 'halfDown')).toBe(0)
      expect(round(1.5, 0, 'halfDown')).toBe(1)
      expect(round(-1.5, 0, 'halfDown')).toBe(-1)
    })

    it('halfEven rounds half to the nearest even digit', () => {
      expect(round(2.5, 0, 'halfEven')).toBe(2)
      expect(round(-2.5, 0, 'halfEven')).toBe(-2)
      expect(round(0.5, 0, 'halfEven')).toBe(0)
      expect(round(-0.5, 0, 'halfEven')).toBe(0)
      expect(round(1.5, 0, 'halfEven')).toBe(2)
      expect(round(-1.5, 0, 'halfEven')).toBe(-2)
      expect(round(3.5, 0, 'halfEven')).toBe(4)
      expect(round(0.15, 1, 'halfEven')).toBe(0.2)
      expect(round(0.25, 1, 'halfEven')).toBe(0.2)
      expect(round(0.35, 1, 'halfEven')).toBe(0.4)
    })

    it('ceil rounds toward positive infinity', () => {
      expect(round(2.5, 0, 'ceil')).toBe(3)
      expect(round(-2.5, 0, 'ceil')).toBe(-2)
      expect(round(0.5, 0, 'ceil')).toBe(1)
      expect(round(-0.5, 0, 'ceil')).toBe(0)
      expect(round(1.2, 0, 'ceil')).toBe(2)
      expect(round(-1.2, 0, 'ceil')).toBe(-1)
    })

    it('floor rounds toward negative infinity', () => {
      expect(round(2.5, 0, 'floor')).toBe(2)
      expect(round(-2.5, 0, 'floor')).toBe(-3)
      expect(round(0.5, 0, 'floor')).toBe(0)
      expect(round(-0.5, 0, 'floor')).toBe(-1)
      expect(round(1.8, 0, 'floor')).toBe(1)
      expect(round(-1.2, 0, 'floor')).toBe(-2)
    })

    it('agrees across the half modes when the dropped digits are not a tie', () => {
      for (const mode of ['halfUp', 'halfDown', 'halfEven'] as const) {
        expect(round(2.51, 0, mode)).toBe(3)
        expect(round(2.49, 0, mode)).toBe(2)
        expect(round(-2.51, 0, mode)).toBe(-3)
        expect(round(-2.49, 0, mode)).toBe(-2)
        expect(round(0.05, 1, mode)).toBe(mode === 'halfUp' ? 0.1 : 0)
      }
    })
  })

  describe('negative precision', () => {
    it('rounds to tens, hundreds and thousands', () => {
      expect(round(1234, -2)).toBe(1200)
      expect(round(1250, -2)).toBe(1300)
      expect(round(1250, -2, 'halfEven')).toBe(1200)
      expect(round(1350, -2, 'halfEven')).toBe(1400)
      expect(round(-1250, -2, 'halfDown')).toBe(-1200)
      expect(round(-1234, -2)).toBe(-1200)
      expect(round(123.456, -1)).toBe(120)
      expect(round(-123.456, -1)).toBe(-120)
      expect(round(1234, -3)).toBe(1000)
    })

    it('drops more digits than the value has', () => {
      expect(round(7, -2)).toBe(0)
      expect(round(-7, -2)).toBe(0)
      expect(round(7, -2, 'ceil')).toBe(100)
      expect(round(-7, -2, 'floor')).toBe(-100)
      expect(round(7, -2, 'floor')).toBe(0)
      expect(round(-7, -2, 'ceil')).toBe(0)
      expect(round(5, -1)).toBe(10)
      expect(round(5, -1, 'halfDown')).toBe(0)
      expect(round(5, -1, 'halfEven')).toBe(0)
      expect(round(15, -1, 'halfEven')).toBe(20)
      expect(round(50, -2)).toBe(100)
      expect(round(50, -2, 'halfEven')).toBe(0)
      expect(round(0, -2)).toBe(0)
    })
  })

  it('returns the value unchanged when precision covers all of its digits', () => {
    expect(round(1.23456, 10)).toBe(1.23456)
    expect(round(1.23456, 5)).toBe(1.23456)
    expect(round(1.5, 1)).toBe(1.5)
    expect(round(42, 0)).toBe(42)
    expect(round(-42, 3)).toBe(-42)
    expect(round(1e21, -21)).toBe(1e21)
    expect(round(1e21, 0)).toBe(1e21)
    expect(round(1.5e-7, 8)).toBe(1.5e-7)
    expect(round(1.5e-7, 9)).toBe(1.5e-7)
  })

  it('accepts inputs whose String() form uses exponent notation', () => {
    expect(round(1.5e-7, 7)).toBe(2e-7)
    expect(round(1.5e-7, 7, 'halfEven')).toBe(2e-7)
    expect(round(1.5e-7, 7, 'halfDown')).toBe(1e-7)
    expect(round(1.5e-7, 6)).toBe(0)
    expect(round(1e21, -22)).toBe(0)
    expect(round(1e21, -22, 'ceil')).toBe(1e22)
    expect(round(1.5e21, -21)).toBe(2e21)
    expect(round(1.5e21, -21, 'halfEven')).toBe(2e21)
    expect(round(2.5e21, -21, 'halfEven')).toBe(2e21)
  })

  it('handles zero and small values rounding to zero', () => {
    expect(round(0)).toBe(0)
    expect(round(0, 5)).toBe(0)
    expect(round(0.0001, 2)).toBe(0)
    expect(round(-0.0001, 2)).toBe(0)
    expect(round(-0.4)).toBe(0)
  })

  it('never returns -0', () => {
    expect(Object.is(round(-0), -0)).toBe(false)
    expect(Object.is(round(-0, 2), -0)).toBe(false)
    expect(Object.is(round(-0, -2), -0)).toBe(false)
    expect(Object.is(round(-0.4), -0)).toBe(false)
    expect(Object.is(round(-0.0001, 2), -0)).toBe(false)
    expect(Object.is(round(-0.5, 0, 'halfDown'), -0)).toBe(false)
    expect(Object.is(round(-0.5, 0, 'halfEven'), -0)).toBe(false)
    expect(Object.is(round(-0.5, 0, 'ceil'), -0)).toBe(false)
    expect(Object.is(round(-7, -2), -0)).toBe(false)
  })

  it('throws RangeError when value is not finite', () => {
    expect(() => round(Number.NaN)).toThrow(RangeError)
    expect(() => round(Number.POSITIVE_INFINITY, 2)).toThrow(RangeError)
    expect(() => round(Number.NEGATIVE_INFINITY, 2)).toThrow(RangeError)
    expect(() => round(Number.NaN)).toThrow('round: value must be finite, received NaN')
  })

  it('throws RangeError when precision is not an integer', () => {
    expect(() => round(1, 1.5)).toThrow(RangeError)
    expect(() => round(1, Number.NaN)).toThrow(RangeError)
    expect(() => round(1, Number.POSITIVE_INFINITY)).toThrow(RangeError)
    expect(() => round(1, Number.NEGATIVE_INFINITY)).toThrow(RangeError)
    expect(() => round(1, 1.5)).toThrow('round: precision must be an integer, received 1.5')
  })

  it('throws RangeError instead of returning Infinity when the result overflows', () => {
    expect(() => round(7, -1e15, 'ceil')).toThrow(RangeError)
    expect(() => round(-7, -1e15, 'floor')).toThrow(RangeError)
    expect(() => round(7, -1e15, 'ceil')).toThrow(
      'round: result 1e1000000000000000 is outside the range of a JavaScript number',
    )
  })

  it('rounds toward zero in halfUp/halfDown/halfEven with an absurd negative precision', () => {
    expect(round(7, -1e15)).toBe(0)
    expect(round(-7, -1e15, 'halfDown')).toBe(0)
    expect(round(7, -1e15, 'halfEven')).toBe(0)
    expect(round(7, -1e15, 'floor')).toBe(0)
  })
})
