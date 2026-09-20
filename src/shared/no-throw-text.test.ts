import { afterEach, describe, expect, it } from 'bun:test'
import { resetConfig, setConfig } from '../config'
import { az } from '../locale/az'
import { ru } from '../locale/ru'
import { guardText } from './no-throw-text'

const boom = (): never => {
  throw new RangeError('boom')
}

afterEach(() => {
  resetConfig()
})

describe('guardText', () => {
  it('rethrows when noThrow is off', () => {
    expect(() => guardText(boom, [Number.NaN])).toThrow(RangeError)
  })

  it('returns the text when nothing throws', () => {
    expect(guardText(() => 'ok', [1], { noThrow: true })).toBe('ok')
  })

  it('falls back to the empty string for a finite or non-numeric value', () => {
    expect(guardText(boom, [Number.NaN], { noThrow: true })).toBe('')
    expect(guardText(boom, [], { noThrow: true })).toBe('')
    expect(guardText(boom, ['1e999'], { noThrow: true })).toBe('')
  })

  it('words an infinity in the default locale when no locale is given', () => {
    setConfig({ noThrow: true })
    expect(guardText(boom, [Number.POSITIVE_INFINITY])).toBe('infinity')
    expect(guardText(boom, [Number.NEGATIVE_INFINITY])).toBe('negative infinity')
  })

  it("words an infinity in the call's own locale", () => {
    expect(guardText(boom, [Number.POSITIVE_INFINITY], { noThrow: true, locale: az })).toBe(
      'sonsuzluq',
    )
    expect(guardText(boom, [Number.NEGATIVE_INFINITY], { noThrow: true, locale: ru })).toBe(
      'минус бесконечность',
    )
  })

  it('names the first infinite value when a function takes several', () => {
    expect(guardText(boom, [2, Number.NEGATIVE_INFINITY], { noThrow: true })).toBe(
      'negative infinity',
    )
  })
})
