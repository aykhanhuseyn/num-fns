import { describe, expect, it } from 'bun:test'
import {
  DEFAULT_GROUPING,
  delocalizeDigits,
  localizeDigits,
  resolveDigits,
  resolveGrouping,
} from './numbering'

/** The message prefix `resolveGrouping` throws with for this caller and label. */
const GROUPING_ERROR =
  /^numberToWords: locale words.grouping must be a non-empty list of integers from 1 to 15/
/** The message prefix `resolveDigits` throws with for this caller. */
const DIGITS_ERROR = /^formatNumber: locale digits must be ten distinct single characters/

const ARABIC_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

describe('resolveGrouping', () => {
  it('defaults to [3] when the locale leaves the field out', () => {
    expect(resolveGrouping(undefined, 'grouping', 'test')).toBe(DEFAULT_GROUPING)
    expect(DEFAULT_GROUPING).toEqual([3])
  })

  it('returns a valid grouping as given', () => {
    const indian = [3, 2]
    expect(resolveGrouping(indian, 'grouping', 'test')).toBe(indian)
    expect(resolveGrouping([4], 'grouping', 'test')).toEqual([4])
    expect(resolveGrouping([15, 1], 'grouping', 'test')).toEqual([15, 1])
  })

  it.each([
    [[]],
    [[0]],
    [[3, 0]],
    [[-1]],
    [[2.5]],
    [[16]],
    [[Number.NaN]],
    ['3' as unknown as number[]],
  ])('throws RangeError for %p, naming the field and the caller', (grouping) => {
    expect(() => resolveGrouping(grouping, 'locale words.grouping', 'numberToWords')).toThrow(
      GROUPING_ERROR,
    )
    expect(() => resolveGrouping(grouping, 'g', 'f')).toThrow(RangeError)
  })
})

describe('resolveDigits', () => {
  it('is undefined (ASCII) when the locale leaves the field out', () => {
    expect(resolveDigits(undefined, 'test')).toBeUndefined()
  })

  it('accepts ten distinct single characters, ASCII digits only in their own place', () => {
    expect(resolveDigits(ARABIC_INDIC, 'test')).toBe(ARABIC_INDIC)
    const ascii = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    expect(resolveDigits(ascii, 'test')).toBe(ascii)
    // Mathematical bold digits are one character outside the BMP.
    const bold = Array.from('𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗')
    expect(resolveDigits(bold, 'test')).toBe(bold)
  })

  it.each([
    [ARABIC_INDIC.slice(0, 9)],
    [[...ARABIC_INDIC, '٠']],
    [['٠', '٠', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']],
    [['٠١', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']],
    [['', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']],
    [['1', '0', '2', '3', '4', '5', '6', '7', '8', '9']],
    [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as unknown as string[]],
    ['٠١٢٣٤٥٦٧٨٩' as unknown as string[]],
  ])('throws RangeError for %p', (digits) => {
    expect(() => resolveDigits(digits, 'formatNumber')).toThrow(DIGITS_ERROR)
  })
})

describe('localizeDigits / delocalizeDigits', () => {
  it('leave text alone when the locale writes ASCII', () => {
    expect(localizeDigits('-1,234.5', undefined)).toBe('-1,234.5')
    expect(delocalizeDigits('-1,234.5', undefined)).toBe('-1,234.5')
  })

  it('swap only digits, both ways', () => {
    expect(localizeDigits('-1٬234٫50', ARABIC_INDIC)).toBe('-١٬٢٣٤٫٥٠')
    expect(delocalizeDigits('-١٬٢٣٤٫٥٠', ARABIC_INDIC)).toBe('-1٬234٫50')
  })

  it('reads ASCII and locale digits mixed', () => {
    expect(delocalizeDigits('١2٣', ARABIC_INDIC)).toBe('123')
  })

  it('round-trips characters outside the BMP', () => {
    const bold = Array.from('𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗')
    expect(localizeDigits('2026', bold)).toBe('𝟐𝟎𝟐𝟔')
    expect(delocalizeDigits('𝟐𝟎𝟐𝟔', bold)).toBe('2026')
  })
})
