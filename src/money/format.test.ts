import { describe, expect, it } from 'bun:test'
import { formatMoney, parseMoney } from './format'

describe('formatMoney', () => {
  it('formats with the manat symbol after the amount by default', () => {
    expect(formatMoney(1234.5)).toBe('1 234,50 ₼')
  })

  it('supports a custom symbol and position', () => {
    expect(formatMoney(9.99, { symbol: '$', symbolPosition: 'before' })).toBe('$ 9,99')
  })

  it('supports a custom decimal precision', () => {
    expect(formatMoney(10, { decimals: 0 })).toBe('10 ₼')
  })
})

describe('parseMoney', () => {
  it('round-trips with formatMoney', () => {
    expect(parseMoney(formatMoney(1234.5))).toBeCloseTo(1234.5)
  })

  it('strips a custom symbol', () => {
    expect(parseMoney('$ 9,99', { symbol: '$' })).toBeCloseTo(9.99)
  })
})
