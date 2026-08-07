import { describe, expect, it } from 'bun:test'
import { formatPercentage, parsePercentage } from './format'

describe('formatPercentage', () => {
  it('formats a percentage value with no space by default', () => {
    expect(formatPercentage(45)).toBe('45%')
  })

  it('supports decimals and a space before the sign', () => {
    expect(formatPercentage(45.5, { decimals: 1, space: true })).toBe('45,5 %')
  })

  it('multiplies a ratio by 100 when requested', () => {
    expect(formatPercentage(0.455, { decimals: 1, multiplyBy100: true })).toBe('45,5%')
  })
})

describe('parsePercentage', () => {
  it('parses a percentage string', () => {
    expect(parsePercentage('45,5%')).toBeCloseTo(45.5)
  })

  it('returns a ratio when asRatio is set', () => {
    expect(parsePercentage('45,5%', { asRatio: true })).toBeCloseTo(0.455)
  })
})
