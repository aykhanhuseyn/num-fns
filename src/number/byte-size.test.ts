import { describe, expect, it } from 'bun:test'
import { parseByteSize, toByteSize } from './byte-size'

describe('toByteSize', () => {
  it('formats bytes below 1 KB as whole bytes', () => {
    expect(toByteSize(0)).toBe('0 B')
    expect(toByteSize(500)).toBe('500 B')
  })

  it('formats using binary (1024) scaling by default', () => {
    expect(toByteSize(1536)).toBe('1.5 KB')
    expect(toByteSize(1024 * 1024)).toBe('1 MB')
    expect(toByteSize(1024 ** 3 * 2.5)).toBe('2.5 GB')
  })

  it('formats using decimal (1000) scaling when base: 1000', () => {
    expect(toByteSize(1500, { base: 1000 })).toBe('1.5 KB')
    expect(toByteSize(1000 * 1000, { base: 1000 })).toBe('1 MB')
  })

  it('respects the decimals option', () => {
    expect(toByteSize(1536, { decimals: 3 })).toBe('1.5 KB')
    expect(toByteSize(1234, { decimals: 0 })).toBe('1 KB')
  })

  it('respects the decimalSeparator option', () => {
    expect(toByteSize(1536, { decimalSeparator: ',' })).toBe('1,5 KB')
  })

  it('throws when bytes is not finite', () => {
    expect(() => toByteSize(Number.NaN)).toThrow(RangeError)
    expect(() => toByteSize(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })

  it('throws when bytes is negative', () => {
    expect(() => toByteSize(-1)).toThrow(RangeError)
  })

  describe('bigint input', () => {
    it('formats a bigint below 1 KB as whole bytes', () => {
      expect(toByteSize(BigInt(0))).toBe('0 B')
      expect(toByteSize(BigInt(500))).toBe('500 B')
      expect(toByteSize(BigInt(1023))).toBe('1023 B')
    })

    it('scales a bigint exactly, agreeing with the number path', () => {
      expect(toByteSize(BigInt(1024))).toBe('1 KB')
      expect(toByteSize(BigInt(1536))).toBe('1.5 KB')
      expect(toByteSize(BigInt(1024 * 1024))).toBe('1 MB')
      expect(toByteSize(BigInt(1024) ** BigInt(3) * BigInt(5))).toBe('5 GB')
      expect(toByteSize(BigInt(1500), { base: 1000 })).toBe('1.5 KB')
      expect(toByteSize(BigInt(1000 * 1000), { base: 1000 })).toBe('1 MB')
    })

    it('rounds half up on the exact remainder', () => {
      // 1792 / 1024 = 1.75 exactly: one decimal rounds up to 1.8 on both paths.
      expect(toByteSize(BigInt(1792), { decimals: 1 })).toBe('1.8 KB')
      expect(toByteSize(BigInt(1792), { decimals: 1 })).toBe(toByteSize(1792, { decimals: 1 }))
      expect(toByteSize(BigInt(1234), { decimals: 0 })).toBe('1 KB')
    })

    it('respects decimals and decimalSeparator for a bigint', () => {
      expect(toByteSize(BigInt(1536), { decimals: 3 })).toBe('1.5 KB')
      expect(toByteSize(BigInt(1536), { decimalSeparator: ',' })).toBe('1,5 KB')
    })

    it('keeps every digit of a bigint past the largest scale', () => {
      expect(toByteSize(BigInt(1500) * BigInt(1024) ** BigInt(5))).toBe('1500 PB')
      expect(toByteSize(BigInt('123456789012345678901234567890'))).toBe('109651655766236.97 PB')
      expect(toByteSize(BigInt('123456789012345678901234567890'), { base: 1000 })).toBe(
        '123456789012345.68 PB',
      )
    })

    it('throws when a bigint is negative', () => {
      expect(() => toByteSize(BigInt(-1))).toThrow(RangeError)
      expect(() => toByteSize(BigInt('-123456789012345678901234567890'))).toThrow(RangeError)
    })

    it('throws when decimals is not a non-negative integer for a bigint', () => {
      expect(() => toByteSize(BigInt(1536), { decimals: 1.5 })).toThrow(RangeError)
      expect(() => toByteSize(BigInt(1536), { decimals: -1 })).toThrow(RangeError)
    })
  })
})

describe('parseByteSize', () => {
  it('parses strings produced by toByteSize', () => {
    expect(parseByteSize('1.5 KB')).toBe(1536)
    expect(parseByteSize('1 MB')).toBe(1024 * 1024)
    expect(parseByteSize('500 B')).toBe(500)
  })

  it('parses without a space before the unit', () => {
    expect(parseByteSize('1.5KB')).toBe(1536)
  })

  it('parses using decimal (1000) scaling when base: 1000', () => {
    expect(parseByteSize('1.5 KB', { base: 1000 })).toBe(1500)
  })

  it('parses a bare number as raw bytes', () => {
    expect(parseByteSize('2048')).toBe(2048)
  })

  it('round-trips with toByteSize', () => {
    expect(parseByteSize(toByteSize(1536))).toBe(1536)
    expect(parseByteSize(toByteSize(5_242_880))).toBe(5_242_880)
  })

  it('throws on an empty string', () => {
    expect(() => parseByteSize('')).toThrow(SyntaxError)
    expect(() => parseByteSize('   ')).toThrow(SyntaxError)
  })

  it('accepts an explicit output: "number"', () => {
    expect(parseByteSize('1.5 KB', { output: 'number' })).toBe(1536)
  })

  it('throws RangeError for an invalid output value', () => {
    expect(() => parseByteSize('1.5 KB', { output: 'decimal' as unknown as 'number' })).toThrow(
      RangeError,
    )
  })

  describe("{ output: 'bigint' }", () => {
    it('returns an exact bigint for a labelled size', () => {
      expect(parseByteSize('1.5 KB', { output: 'bigint' })).toBe(BigInt(1536))
      expect(parseByteSize('1.5KB', { output: 'bigint' })).toBe(BigInt(1536))
      expect(parseByteSize('1 MB', { output: 'bigint' })).toBe(BigInt(1024 * 1024))
      expect(parseByteSize('2.5 KB', { base: 1000, output: 'bigint' })).toBe(BigInt(2500))
      expect(parseByteSize('1,5 KB', { decimalSeparator: ',', output: 'bigint' })).toBe(
        BigInt(1536),
      )
    })

    it('returns an exact bigint for the plain-byte forms', () => {
      expect(parseByteSize('500 B', { output: 'bigint' })).toBe(BigInt(500))
      expect(parseByteSize('0 B', { output: 'bigint' })).toBe(BigInt(0))
      expect(parseByteSize('2048', { output: 'bigint' })).toBe(BigInt(2048))
    })

    it('keeps every digit past Number.MAX_SAFE_INTEGER', () => {
      expect(parseByteSize('1500 PB', { output: 'bigint' })).toBe(
        BigInt(1500) * BigInt(1024) ** BigInt(5),
      )
      expect(parseByteSize('123456789012345678901234567890 B', { output: 'bigint' })).toBe(
        BigInt('123456789012345678901234567890'),
      )
    })

    it('round-trips an exact toByteSize output', () => {
      expect(parseByteSize(toByteSize(BigInt(1536)), { output: 'bigint' })).toBe(BigInt(1536))
      expect(parseByteSize(toByteSize(BigInt(5_242_880)), { output: 'bigint' })).toBe(
        BigInt(5_242_880),
      )
    })

    it('throws RangeError when the size is not a whole number of bytes', () => {
      // 1.7 KB is 1740.8 bytes.
      expect(() => parseByteSize('1.7 KB', { output: 'bigint' })).toThrow(RangeError)
      expect(() => parseByteSize('1.7 KB', { output: 'bigint' })).toThrow('not a whole number')
      expect(() => parseByteSize('1.5 B', { output: 'bigint' })).toThrow(RangeError)
      expect(() => parseByteSize('0.5', { output: 'bigint' })).toThrow(RangeError)
    })

    it('still throws SyntaxError for text that is not a number', () => {
      expect(() => parseByteSize('abc KB', { output: 'bigint' })).toThrow(SyntaxError)
      expect(() => parseByteSize('', { output: 'bigint' })).toThrow(SyntaxError)
    })
  })
})
