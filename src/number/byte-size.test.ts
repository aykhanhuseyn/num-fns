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
})
