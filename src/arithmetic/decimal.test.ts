import { describe, expect, it } from 'bun:test'
import { alignScales, digitCount, fromDecimal, pow10, toDecimal } from './decimal'

describe('toDecimal', () => {
  it('decomposes an integer with scale 0', () => {
    expect(toDecimal(15)).toEqual({ digits: BigInt(15), scale: 0 })
    expect(toDecimal(-7)).toEqual({ digits: BigInt(-7), scale: 0 })
  })

  it('decomposes a negative fraction, keeping the sign on the digits', () => {
    expect(toDecimal(-0.25)).toEqual({ digits: BigInt(-25), scale: 2 })
    expect(toDecimal(0.1)).toEqual({ digits: BigInt(1), scale: 1 })
  })

  it('reads the positive exponent String() switches to for large values', () => {
    expect(String(1e21)).toBe('1e+21')
    expect(toDecimal(1e21)).toEqual({ digits: BigInt(1), scale: -21 })
    expect(toDecimal(-1e21)).toEqual({ digits: BigInt(-1), scale: -21 })
  })

  it('reads the negative exponent String() switches to for tiny values', () => {
    expect(String(1.5e-7)).toBe('1.5e-7')
    expect(toDecimal(1.5e-7)).toEqual({ digits: BigInt(15), scale: 8 })
  })

  it('treats 0 and -0 identically', () => {
    expect(toDecimal(0)).toEqual({ digits: BigInt(0), scale: 0 })
    expect(toDecimal(-0)).toEqual({ digits: BigInt(0), scale: 0 })
  })

  it('takes the shortest decimal reading, not the stored binary expansion', () => {
    expect(toDecimal(0.30000000000000004)).toEqual({
      digits: BigInt('30000000000000004'),
      scale: 17,
    })
    expect(toDecimal(1.005)).toEqual({ digits: BigInt(1005), scale: 3 })
  })
})

describe('fromDecimal', () => {
  it('round-trips every shape toDecimal produces', () => {
    for (const value of [15, -0.25, 1e21, 1.5e-7, 0, 0.1, 1.005, -268435456.47635, 1e308, 5e-324]) {
      const { digits, scale } = toDecimal(value)
      expect(fromDecimal(digits, scale, 'test')).toBe(value)
    }
  })

  it('converts digits at an explicit scale', () => {
    expect(fromDecimal(BigInt(3), 1, 'test')).toBe(0.3)
    expect(fromDecimal(BigInt(-25), 2, 'test')).toBe(-0.25)
    expect(fromDecimal(BigInt(15), -6, 'test')).toBe(15_000_000)
    expect(fromDecimal(BigInt(1005), 3, 'test')).toBe(1.005)
  })

  it('returns +0 for zero digits unless the caller asks for a signed zero', () => {
    expect(Object.is(fromDecimal(BigInt(0), 5, 'test'), -0)).toBe(false)
    expect(Object.is(fromDecimal(BigInt(0), -5, 'test'), -0)).toBe(false)
    expect(fromDecimal(BigInt(0), 0, 'test')).toBe(0)
    expect(Object.is(fromDecimal(BigInt(0), 0, 'test', true), -0)).toBe(true)
  })

  it('keeps the sign of a negative value that underflows to zero', () => {
    // Number('-1e-400') is -0, and -0 is a value: it comes out as -0.
    expect(Object.is(fromDecimal(BigInt(-1), 400, 'test'), -0)).toBe(true)
    expect(Object.is(fromDecimal(BigInt(1), 400, 'test'), -0)).toBe(false)
  })

  it('throws RangeError, prefixed with the context, when the result overflows', () => {
    expect(() => fromDecimal(BigInt(1), -400, 'ctx')).toThrow(RangeError)
    expect(() => fromDecimal(BigInt(1), -400, 'ctx')).toThrow(
      'ctx: result 1e400 is outside the range of a JavaScript number',
    )
    expect(() => fromDecimal(BigInt(-2), -308, 'ctx')).toThrow(RangeError)
  })
})

describe('pow10', () => {
  it('returns exact powers of ten as BigInt', () => {
    expect(pow10(0)).toBe(BigInt(1))
    expect(pow10(1)).toBe(BigInt(10))
    expect(pow10(3)).toBe(BigInt(1000))
    expect(pow10(25)).toBe(BigInt('10000000000000000000000000'))
  })
})

describe('digitCount', () => {
  it('counts the digits of a positive value', () => {
    expect(digitCount(BigInt(1))).toBe(1)
    expect(digitCount(BigInt(999))).toBe(3)
    expect(digitCount(BigInt(1000))).toBe(4)
    expect(digitCount(pow10(25))).toBe(26)
  })

  it('counts 0 as one digit', () => {
    expect(digitCount(BigInt(0))).toBe(1)
  })

  it('ignores the sign of a negative value', () => {
    expect(digitCount(BigInt(-1))).toBe(1)
    expect(digitCount(BigInt(-12345))).toBe(5)
  })
})

describe('alignScales', () => {
  it('returns the digits untouched when the scales already match', () => {
    expect(alignScales(toDecimal(1.5), toDecimal(2.5))).toEqual({
      a: BigInt(15),
      b: BigInt(25),
      scale: 1,
    })
    expect(alignScales(toDecimal(3), toDecimal(-4))).toEqual({
      a: BigInt(3),
      b: BigInt(-4),
      scale: 0,
    })
  })

  it('scales b up when a is finer', () => {
    expect(alignScales(toDecimal(1.25), toDecimal(2.5))).toEqual({
      a: BigInt(125),
      b: BigInt(250),
      scale: 2,
    })
    expect(alignScales(toDecimal(1), toDecimal(1e21))).toEqual({
      a: BigInt(1),
      b: pow10(21),
      scale: 0,
    })
  })

  it('scales a up when b is finer', () => {
    expect(alignScales(toDecimal(1.5), toDecimal(2.25))).toEqual({
      a: BigInt(150),
      b: BigInt(225),
      scale: 2,
    })
    expect(alignScales(toDecimal(1e21), toDecimal(1))).toEqual({
      a: pow10(21),
      b: BigInt(1),
      scale: 0,
    })
  })

  it('preserves the value of both operands at the common scale', () => {
    const aligned = alignScales(toDecimal(-0.25), toDecimal(1.5e-7))
    expect(fromDecimal(aligned.a, aligned.scale, 'test')).toBe(-0.25)
    expect(fromDecimal(aligned.b, aligned.scale, 'test')).toBe(1.5e-7)
  })
})
