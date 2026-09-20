import { describe, expect, it } from 'bun:test'
import { az } from '../locale/az'
import { en } from '../locale/en'
import { enGB } from '../locale/en-gb'
import { es } from '../locale/es'
import { ru } from '../locale/ru'
import type { Locale } from '../locale/types'
import { parseLongNotation, parseShortNotation, toLongNotation, toShortNotation } from './notation'

/**
 * `en` with a sixth scale word, so `toLongNotation`/`parseLongNotation` have
 * a locale whose values run past `Number.MAX_SAFE_INTEGER` — the case the
 * `bigint` input and `output: 'bigint'` exist for (`todo.md` §4).
 */
const enWithQuadrillion: Locale = {
  ...en,
  words: { ...en.words, scales: [...en.words.scales, 'quadrillion'] },
}

const LOCALES: ReadonlyArray<readonly [string, Locale]> = [
  ['en', en],
  ['en-GB', enGB],
  ['az', az],
  ['ru', ru],
  ['es', es],
]

describe('toShortNotation', () => {
  it('uses English K/M/B/T suffixes by default', () => {
    expect(toShortNotation(1500)).toBe('1.5K')
    expect(toShortNotation(2500000)).toBe('2.5M')
    expect(toShortNotation(3200000000)).toBe('3.2B')
    expect(toShortNotation(4100000000000)).toBe('4.1T')
  })

  it('trims trailing zero decimals', () => {
    expect(toShortNotation(1000000)).toBe('1M')
  })

  it('supports the Azerbaijani locale', () => {
    expect(toShortNotation(1500, { locale: az })).toBe('1,5 min')
    expect(toShortNotation(2500000, { locale: az })).toBe('2,5 mln')
  })

  it('supports other locales via their own scale abbreviations', () => {
    expect(toShortNotation(1500, { locale: ru })).toBe('1,5 тыс')
  })

  it('leaves small numbers unscaled', () => {
    expect(toShortNotation(999)).toBe('999')
    expect(toShortNotation(0)).toBe('0')
  })

  it('preserves the sign', () => {
    expect(toShortNotation(-1500)).toBe('-1.5K')
  })

  it('respects a custom decimal precision', () => {
    expect(toShortNotation(1234, { decimals: 2 })).toBe('1.23K')
  })

  it('rounds half up on the value as written, not as the scaled double is stored', () => {
    // `2675000 / 1e6` and `1005 / 1000` are stored just below 2.675 and
    // 1.005, so `toFixed(2)` gave "2.67M" and "1K"; the quotient is now
    // rounded exactly in decimal, like `round` and the bigint path.
    expect(toShortNotation(2675000, { decimals: 2 })).toBe('2.68M')
    expect(toShortNotation(1005, { decimals: 2 })).toBe('1.01K')
    expect(toShortNotation(1250, { decimals: 1 })).toBe('1.3K')
    expect(toShortNotation(1235, { decimals: 2 })).toBe('1.24K')
    expect(toShortNotation(-2675000, { decimals: 2 })).toBe('-2.68M')
    expect(toShortNotation(2675000, { decimals: 2 })).toBe(
      toShortNotation(BigInt(2675000), { decimals: 2 }),
    )
    expect((2675000 / 1e6).toFixed(2)).toBe('2.67') // the trap this replaces
  })

  it('rounds a fractional value below the smallest threshold to a whole number', () => {
    expect(toShortNotation(999.4)).toBe('999')
    expect(toShortNotation(2.5)).toBe('3')
    expect(toShortNotation(0.4)).toBe('0')
  })

  it('emits "-0" for a negative value that rounds away to zero', () => {
    expect(toShortNotation(-0.4)).toBe('-0')
    expect(toShortNotation(-0)).toBe('-0')
    expect(toShortNotation(-0.5)).toBe('-1')
    expect(toShortNotation(0.4)).toBe('0')
  })

  it('keeps every digit of a number whose scaled value is past 1e21, like a bigint', () => {
    expect(toShortNotation(1e24)).toBe('1000000000000T')
    expect(toShortNotation(1e24)).toBe(toShortNotation(BigInt('1000000000000000000000000')))
    // `(1e36 / 1e12).toFixed(1)` is "1e+24" — `toFixed` gives up past 1e21.
    expect(toShortNotation(1e36)).toBe(`1${'0'.repeat(24)}T`)
    expect(toShortNotation(1e36)).toBe(toShortNotation(BigInt(10) ** BigInt(36)))
  })

  it('throws RangeError for a decimals that is not a non-negative integer, on the number path too', () => {
    expect(() => toShortNotation(1500, { decimals: -1 })).toThrow(RangeError)
    expect(() => toShortNotation(1500, { decimals: NaN })).toThrow(RangeError)
    expect(() => toShortNotation(1500, { decimals: 1.5 })).toThrow(
      'toShortNotation: decimals must be a non-negative integer, received 1.5',
    )
  })

  it('throws for non-finite values', () => {
    expect(() => toShortNotation(Infinity)).toThrow(RangeError)
  })

  describe('bigint', () => {
    it('scales a bigint like the equivalent number', () => {
      expect(toShortNotation(BigInt(1500))).toBe('1.5K')
      expect(toShortNotation(BigInt(2500000))).toBe('2.5M')
      expect(toShortNotation(BigInt(3200000000))).toBe('3.2B')
      expect(toShortNotation(BigInt(4100000000000))).toBe('4.1T')
      expect(toShortNotation(BigInt(1000000))).toBe('1M')
    })

    it.each(LOCALES)(
      'agrees with the number path for whole scaled values (%s)',
      (_code, locale) => {
        for (const value of [
          0, 1, 999, 1000, 1005, 1500, 2500, 999999, 1000000, 1234567, 2675000, 999999999999999,
        ]) {
          for (const decimals of [0, 1, 2, 3]) {
            expect(toShortNotation(BigInt(value), { locale, decimals })).toBe(
              toShortNotation(value, { locale, decimals }),
            )
            // `BigInt(-0)` is `0n`: no negative zero bigint, so no "-0".
            expect(toShortNotation(BigInt(-value), { locale, decimals })).toBe(
              toShortNotation(value === 0 ? 0 : -value, { locale, decimals }),
            )
          }
        }
      },
    )

    it('preserves the sign', () => {
      expect(toShortNotation(BigInt(-1500))).toBe('-1.5K')
      expect(toShortNotation(BigInt(-999))).toBe('-999')
    })

    it('leaves values below the smallest threshold unscaled', () => {
      expect(toShortNotation(BigInt(999))).toBe('999')
      expect(toShortNotation(BigInt(0))).toBe('0')
      expect(toShortNotation(BigInt(999), { decimals: 3 })).toBe('999')
    })

    it('keeps every digit past the largest scale word', () => {
      expect(toShortNotation(BigInt('1234567890123456789'))).toBe('1234567.9T')
      expect(toShortNotation(BigInt('1234567890123456789'), { decimals: 6 })).toBe(
        '1234567.890123T',
      )
      expect(toShortNotation(BigInt('1000000000000000000000'))).toBe('1000000000T')
    })

    it('rounds half up on the exact remainder', () => {
      expect(toShortNotation(BigInt(1999), { decimals: 0 })).toBe('2K')
      expect(toShortNotation(BigInt(1500), { decimals: 0 })).toBe('2K')
      expect(toShortNotation(BigInt(1499), { decimals: 0 })).toBe('1K')
      expect(toShortNotation(BigInt(1250), { decimals: 1 })).toBe('1.3K')
      expect(toShortNotation(BigInt(1234), { decimals: 2 })).toBe('1.23K')
      expect(toShortNotation(BigInt(1235), { decimals: 2 })).toBe('1.24K')
    })

    it('trims trailing zero decimals', () => {
      expect(toShortNotation(BigInt(1000), { decimals: 3 })).toBe('1K')
      expect(toShortNotation(BigInt(1500), { decimals: 3 })).toBe('1.5K')
    })

    it('throws RangeError for a decimals that is not a non-negative integer', () => {
      expect(() => toShortNotation(BigInt(1500), { decimals: -1 })).toThrow(RangeError)
      expect(() => toShortNotation(BigInt(1500), { decimals: 1.5 })).toThrow(RangeError)
      expect(() => toShortNotation(BigInt(1500), { decimals: NaN })).toThrow(RangeError)
      expect(() => toShortNotation(BigInt(1500), { decimals: 1.5 })).toThrow(
        'toShortNotation: decimals must be a non-negative integer, received 1.5',
      )
    })

    it("uses the locale's abbreviations, spacing and decimal separator", () => {
      expect(toShortNotation(BigInt(1500), { locale: az })).toBe('1,5 min')
      expect(toShortNotation(BigInt(2500000), { locale: az })).toBe('2,5 mln')
      expect(toShortNotation(BigInt(1500), { locale: ru })).toBe('1,5 тыс')
      expect(toShortNotation(BigInt(1500), { locale: az, decimalSeparator: '.' })).toBe('1.5 min')
    })
  })
})

describe('parseShortNotation', () => {
  it('round-trips with toShortNotation for the English default', () => {
    expect(parseShortNotation('1.5K')).toBe(1500)
    expect(parseShortNotation('2.5M')).toBe(2500000)
    expect(parseShortNotation('3.2B')).toBe(3200000000)
    expect(parseShortNotation('4.1T')).toBe(4100000000000)
  })

  it('parses whole scaled values', () => {
    expect(parseShortNotation('1M')).toBe(1000000)
  })

  it('round-trips with toShortNotation for the Azerbaijani locale', () => {
    expect(parseShortNotation('2,5 mln', { locale: az })).toBe(2500000)
    expect(parseShortNotation('1 min', { locale: az })).toBe(1000)
  })

  it('parses unscaled numbers', () => {
    expect(parseShortNotation('999')).toBe(999)
    expect(parseShortNotation('0')).toBe(0)
  })

  it('preserves the sign', () => {
    expect(parseShortNotation('-1.5K')).toBe(-1500)
  })

  it('is case-insensitive on the suffix', () => {
    expect(parseShortNotation('2.5m')).toBe(2500000)
  })

  it('throws for an empty string', () => {
    expect(() => parseShortNotation('')).toThrow(SyntaxError)
  })

  it('throws for an unparseable string', () => {
    expect(() => parseShortNotation('not a number')).toThrow(SyntaxError)
  })

  describe("{ output: 'bigint' }", () => {
    it('multiplies the mantissa by the scale exactly', () => {
      expect(parseShortNotation('2.5M', { output: 'bigint' })).toBe(BigInt(2500000))
      expect(parseShortNotation('1.5K', { output: 'bigint' })).toBe(BigInt(1500))
      expect(parseShortNotation('3.2B', { output: 'bigint' })).toBe(BigInt(3200000000))
      expect(parseShortNotation('4.1T', { output: 'bigint' })).toBe(BigInt(4100000000000))
      expect(parseShortNotation('1M', { output: 'bigint' })).toBe(BigInt(1000000))
      expect(typeof parseShortNotation('1M', { output: 'bigint' })).toBe('bigint')
    })

    it('keeps digits a number would lose', () => {
      expect(parseShortNotation('1234567.890123T', { output: 'bigint' })).toBe(
        BigInt('1234567890123000000'),
      )
      expect(parseShortNotation('9007199254740993K', { output: 'bigint' })).toBe(
        BigInt('9007199254740993000'),
      )
    })

    it('preserves the sign and is case-insensitive on the suffix', () => {
      expect(parseShortNotation('-1.5K', { output: 'bigint' })).toBe(BigInt(-1500))
      expect(parseShortNotation('2.5m', { output: 'bigint' })).toBe(BigInt(2500000))
    })

    it("uses the locale's abbreviations and decimal separator", () => {
      expect(parseShortNotation('2,5 mln', { locale: az, output: 'bigint' })).toBe(BigInt(2500000))
      expect(parseShortNotation('1 min', { locale: az, output: 'bigint' })).toBe(BigInt(1000))
      expect(parseShortNotation('1,5 тыс', { locale: ru, output: 'bigint' })).toBe(BigInt(1500))
      expect(
        parseShortNotation('1.5 min', { locale: az, decimalSeparator: '.', output: 'bigint' }),
      ).toBe(BigInt(1500))
    })

    it('parses an unscaled value', () => {
      expect(parseShortNotation('42', { output: 'bigint' })).toBe(BigInt(42))
      expect(parseShortNotation('0', { output: 'bigint' })).toBe(BigInt(0))
      expect(parseShortNotation('-999', { output: 'bigint' })).toBe(BigInt(-999))
    })

    it('tolerates surrounding whitespace', () => {
      expect(parseShortNotation('  1.5K  ', { output: 'bigint' })).toBe(BigInt(1500))
      expect(parseShortNotation('  42  ', { output: 'bigint' })).toBe(BigInt(42))
    })

    it('throws RangeError when the scaled value is not a whole number', () => {
      expect(() => parseShortNotation('1.2345K', { output: 'bigint' })).toThrow(RangeError)
      expect(() => parseShortNotation('1.5', { output: 'bigint' })).toThrow(RangeError)
      expect(() => parseShortNotation('0.0000001M', { output: 'bigint' })).toThrow(RangeError)
    })

    it('still throws SyntaxError for an empty string', () => {
      expect(() => parseShortNotation('', { output: 'bigint' })).toThrow(SyntaxError)
      expect(() => parseShortNotation('   ', { output: 'bigint' })).toThrow(SyntaxError)
    })

    it('still throws SyntaxError for garbage, with or without a suffix', () => {
      expect(() => parseShortNotation('abcK', { output: 'bigint' })).toThrow(SyntaxError)
      expect(() => parseShortNotation('K', { output: 'bigint' })).toThrow(SyntaxError)
      expect(() => parseShortNotation('not a number', { output: 'bigint' })).toThrow(SyntaxError)
    })

    it('round-trips with toShortNotation for whole scaled bigints', () => {
      for (const text of ['1500', '2500000', '1234567890123000000', '-4100000000000']) {
        const value = BigInt(text)
        const formatted = toShortNotation(value, { decimals: 6 })
        expect(parseShortNotation(formatted, { output: 'bigint' })).toBe(value)
      }
    })
  })

  it("{ output: 'number' } behaves exactly like the default", () => {
    expect(parseShortNotation('2.5M', { output: 'number' })).toBe(2500000)
    expect(parseShortNotation('42', { output: 'number' })).toBe(42)
    expect(typeof parseShortNotation('2.5M', { output: 'number' })).toBe('number')
  })

  it('throws RangeError for an output value other than "number" or "bigint"', () => {
    // @ts-expect-error — deliberately invalid output to exercise the runtime guard
    expect(() => parseShortNotation('1K', { output: 'string' })).toThrow(RangeError)
    // @ts-expect-error — deliberately invalid output to exercise the runtime guard
    expect(() => parseShortNotation('1K', { output: 'BigInt' })).toThrow(
      'parseShortNotation: output must be "number" or "bigint", received BigInt',
    )
  })

  it('types the result through the output option (compile-time check)', () => {
    const asBigInt: bigint = parseShortNotation('1K', { output: 'bigint' })
    const asNumber: number = parseShortNotation('1K')
    const asNumberExplicit: number = parseShortNotation('1 min', { output: 'number', locale: az })
    expect(typeof asBigInt).toBe('bigint')
    expect(typeof asNumber).toBe('number')
    expect(typeof asNumberExplicit).toBe('number')
  })
})

describe('toLongNotation', () => {
  it('pairs digit groups with English scale words by default', () => {
    expect(toLongNotation(1234567)).toBe('1 million 234 thousand 567')
    expect(toLongNotation(1000)).toBe('1 thousand')
    expect(toLongNotation(1000000)).toBe('1 million')
  })

  it('supports the Azerbaijani locale', () => {
    expect(toLongNotation(1234567, { locale: az })).toBe('1 milyon 234 min 567')
  })

  it('resolves plural-inflected scale words via the locale', () => {
    expect(toLongNotation(1000, { locale: ru })).toBe('1 тысяча')
    expect(toLongNotation(2000, { locale: ru })).toBe('2 тысячи')
    expect(toLongNotation(5000, { locale: ru })).toBe('5 тысяч')
  })

  it('returns "0" for zero', () => {
    expect(toLongNotation(0)).toBe('0')
  })

  it('preserves the sign', () => {
    expect(toLongNotation(-1234567)).toBe('-1 million 234 thousand 567')
  })

  it('supports a custom group separator', () => {
    expect(toLongNotation(1234567, { groupSeparator: ', ' })).toBe('1 million, 234 thousand, 567')
  })

  it('throws for non-integers', () => {
    expect(() => toLongNotation(1.5)).toThrow(TypeError)
  })

  it('throws for non-finite values', () => {
    expect(() => toLongNotation(Number.POSITIVE_INFINITY)).toThrow(RangeError)
    expect(() => toLongNotation(Number.NEGATIVE_INFINITY)).toThrow(RangeError)
    expect(() => toLongNotation(Number.NaN)).toThrow(RangeError)
  })

  it('spells up to the largest magnitude the locale has a scale word for', () => {
    // `en` stops at "trillion", so 1000 ** 5 - 1 is the ceiling; one more
    // would need a scale word that does not exist in `en.words.scales`.
    expect(toLongNotation(999_999_999_999_999)).toBe(
      '999 trillion 999 billion 999 million 999 thousand 999',
    )
    expect(() => toLongNotation(1e15)).toThrow(RangeError)
  })

  describe('bigint', () => {
    it.each(LOCALES)(
      'expands a bigint exactly like the equivalent number (%s)',
      (_code, locale) => {
        for (const value of [
          0, 1, 999, 1000, 1001, 2000, 5000, 21000, 1000000, 1234567, 1000000000, 2000000005,
          1000000000000, 123456789012345, 999999999999999,
        ]) {
          expect(toLongNotation(BigInt(value), { locale })).toBe(toLongNotation(value, { locale }))
          expect(toLongNotation(BigInt(-value), { locale })).toBe(
            toLongNotation(-value, { locale }),
          )
        }
      },
    )

    it('pairs digit groups with scale words', () => {
      expect(toLongNotation(BigInt(1234567))).toBe('1 million 234 thousand 567')
      expect(toLongNotation(BigInt(1000))).toBe('1 thousand')
      expect(toLongNotation(BigInt(1234567), { locale: az })).toBe('1 milyon 234 min 567')
      expect(toLongNotation(BigInt(5000), { locale: ru })).toBe('5 тысяч')
    })

    it('returns "0" for zero', () => {
      expect(toLongNotation(BigInt(0))).toBe('0')
    })

    it('preserves the sign', () => {
      expect(toLongNotation(BigInt(-1234567))).toBe('-1 million 234 thousand 567')
    })

    it('supports a custom group separator, with the same validation', () => {
      expect(toLongNotation(BigInt(1234567), { groupSeparator: ', ' })).toBe(
        '1 million, 234 thousand, 567',
      )
      expect(() => toLongNotation(BigInt(1234567), { groupSeparator: '' })).toThrow(RangeError)
      expect(() => toLongNotation(BigInt(1234567), { groupSeparator: ' 0 ' })).toThrow(RangeError)
    })

    it('throws RangeError past the cap, naming the exact bigint maximum', () => {
      expect(toLongNotation(BigInt('999999999999999'))).toBe(
        '999 trillion 999 billion 999 million 999 thousand 999',
      )
      expect(() => toLongNotation(BigInt('1000000000000000'))).toThrow(RangeError)
      expect(() => toLongNotation(BigInt('-1000000000000000'))).toThrow(RangeError)
      expect(() => toLongNotation(BigInt('1000000000000000'))).toThrow(
        'toLongNotation: value exceeds the maximum supported magnitude of 999999999999999',
      )
    })

    describe('a custom locale with scales past Number.MAX_SAFE_INTEGER', () => {
      it('expands values a number could not hold exactly', () => {
        expect(toLongNotation(BigInt('1000000000000000'), { locale: enWithQuadrillion })).toBe(
          '1 quadrillion',
        )
        expect(toLongNotation(BigInt('9007199254740993'), { locale: enWithQuadrillion })).toBe(
          '9 quadrillion 7 trillion 199 billion 254 million 740 thousand 993',
        )
        expect(toLongNotation(BigInt('-9007199254740993'), { locale: enWithQuadrillion })).toBe(
          '-9 quadrillion 7 trillion 199 billion 254 million 740 thousand 993',
        )
      })

      it('reports the new cap exactly, where a number would print 1e18', () => {
        expect(toLongNotation(BigInt('999999999999999999'), { locale: enWithQuadrillion })).toBe(
          '999 quadrillion 999 trillion 999 billion 999 million 999 thousand 999',
        )
        expect(() =>
          toLongNotation(BigInt('1000000000000000000'), { locale: enWithQuadrillion }),
        ).toThrow(
          'toLongNotation: value exceeds the maximum supported magnitude of 999999999999999999',
        )
      })
    })
  })
})

describe('parseLongNotation', () => {
  it('pairs digit groups with English scale words back into a number', () => {
    expect(parseLongNotation('1 million 234 thousand 567')).toBe(1234567)
    expect(parseLongNotation('1 thousand')).toBe(1000)
    expect(parseLongNotation('1 million')).toBe(1000000)
  })

  it('supports the Azerbaijani locale', () => {
    expect(parseLongNotation('1 milyon 234 min 567', { locale: az })).toBe(1234567)
  })

  it('resolves every plural-inflected surface form of a scale word', () => {
    expect(parseLongNotation('1 тысяча', { locale: ru })).toBe(1000)
    expect(parseLongNotation('2 тысячи', { locale: ru })).toBe(2000)
    expect(parseLongNotation('5 тысяч', { locale: ru })).toBe(5000)
  })

  it('parses "0"', () => {
    expect(parseLongNotation('0')).toBe(0)
  })

  it('preserves the sign', () => {
    expect(parseLongNotation('-1 million 234 thousand 567')).toBe(-1234567)
  })

  it('supports a custom group separator', () => {
    expect(parseLongNotation('1 million, 234 thousand, 567', { groupSeparator: ', ' })).toBe(
      1234567,
    )
  })

  it('round-trips with toLongNotation', () => {
    expect(parseLongNotation(toLongNotation(1234567))).toBe(1234567)
    expect(parseLongNotation(toLongNotation(-987654321))).toBe(-987654321)
  })

  it('throws for an empty string', () => {
    expect(() => parseLongNotation('')).toThrow(SyntaxError)
  })

  it('throws for an unparseable string', () => {
    expect(() => parseLongNotation('abc million')).toThrow(SyntaxError)
  })

  it('parses "-0" to plain zero, never negative zero', () => {
    const parsed = parseLongNotation('-0')
    expect(Object.is(parsed, 0)).toBe(true)
    expect(Object.is(parsed, -0)).toBe(false)
    expect(parseLongNotation('-0', { output: 'bigint' })).toBe(BigInt(0))
  })

  describe("{ output: 'bigint' }", () => {
    it('returns an exact bigint', () => {
      const parsed = parseLongNotation('1 million 234 thousand 567', { output: 'bigint' })
      expect(typeof parsed).toBe('bigint')
      expect(parsed).toBe(BigInt(1234567))
      expect(parseLongNotation('1 thousand', { output: 'bigint' })).toBe(BigInt(1000))
      expect(parseLongNotation('0', { output: 'bigint' })).toBe(BigInt(0))
      expect(parseLongNotation('567', { output: 'bigint' })).toBe(BigInt(567))
    })

    it('preserves the sign', () => {
      expect(parseLongNotation('-1 million 234 thousand 567', { output: 'bigint' })).toBe(
        BigInt(-1234567),
      )
    })

    it("uses the locale's scale words, every plural form included", () => {
      expect(parseLongNotation('1 milyon 234 min 567', { locale: az, output: 'bigint' })).toBe(
        BigInt(1234567),
      )
      expect(parseLongNotation('1 тысяча', { locale: ru, output: 'bigint' })).toBe(BigInt(1000))
      expect(parseLongNotation('2 тысячи', { locale: ru, output: 'bigint' })).toBe(BigInt(2000))
      expect(parseLongNotation('5 тысяч', { locale: ru, output: 'bigint' })).toBe(BigInt(5000))
    })

    it('supports a custom group separator', () => {
      expect(
        parseLongNotation('1 million, 234 thousand, 567', {
          groupSeparator: ', ',
          output: 'bigint',
        }),
      ).toBe(BigInt(1234567))
    })

    it('keeps every digit of a value past Number.MAX_SAFE_INTEGER', () => {
      expect(parseLongNotation('9007199254740993 thousand', { output: 'bigint' })).toBe(
        BigInt('9007199254740993000'),
      )
      expect(parseLongNotation('9007199254740993', { output: 'bigint' })).toBe(
        BigInt('9007199254740993'),
      )
    })

    it('reads a custom-locale string whose scales run past a trillion', () => {
      const options = { locale: enWithQuadrillion, output: 'bigint' } as const
      expect(parseLongNotation('1 quadrillion', options)).toBe(BigInt('1000000000000000'))
      expect(
        parseLongNotation(
          '9 quadrillion 7 trillion 199 billion 254 million 740 thousand 993',
          options,
        ),
      ).toBe(BigInt('9007199254740993'))
      expect(
        parseLongNotation(
          '999 quadrillion 999 trillion 999 billion 999 million 999 thousand 999',
          options,
        ),
      ).toBe(BigInt('999999999999999999'))
    })

    it('round-trips with toLongNotation', () => {
      for (const text of ['1234567', '-987654321', '999999999999999']) {
        const value = BigInt(text)
        expect(parseLongNotation(toLongNotation(value), { output: 'bigint' })).toBe(value)
      }
      for (const text of ['9007199254740993', '-999999999999999999']) {
        const value = BigInt(text)
        expect(
          parseLongNotation(toLongNotation(value, { locale: enWithQuadrillion }), {
            locale: enWithQuadrillion,
            output: 'bigint',
          }),
        ).toBe(value)
      }
    })

    it('still throws SyntaxError for an empty or unparseable string', () => {
      expect(() => parseLongNotation('', { output: 'bigint' })).toThrow(SyntaxError)
      expect(() => parseLongNotation('abc million', { output: 'bigint' })).toThrow(SyntaxError)
    })

    it('still rejects an unusable group separator', () => {
      expect(() =>
        parseLongNotation('1 million', { groupSeparator: '', output: 'bigint' }),
      ).toThrow(RangeError)
    })
  })

  describe('number output past Number.MAX_SAFE_INTEGER', () => {
    it('throws RangeError pointing at output: "bigint" rather than rounding', () => {
      expect(() => parseLongNotation('9007199254740993 thousand')).toThrow(RangeError)
      expect(() => parseLongNotation('9007199254740993 thousand')).toThrow("output: 'bigint'")
      expect(() => parseLongNotation('9007199254740993 thousand')).toThrow(
        "parseLongNotation: 9007199254740993000 exceeds Number.MAX_SAFE_INTEGER and cannot be returned exactly as a number; pass { output: 'bigint' }",
      )
      expect(() => parseLongNotation('9007199254740993 thousand', { output: 'number' })).toThrow(
        RangeError,
      )
    })

    it('throws for an oversized single digit group and for the negative side too', () => {
      expect(() => parseLongNotation('9007199254740993')).toThrow(RangeError)
      expect(() => parseLongNotation('-9007199254740993')).toThrow(RangeError)
      // 1 quadrillion (1e15) is still a safe integer; 10 quadrillion is not.
      expect(parseLongNotation('1 quadrillion', { locale: enWithQuadrillion })).toBe(1e15)
      expect(() => parseLongNotation('10 quadrillion', { locale: enWithQuadrillion })).toThrow(
        RangeError,
      )
    })

    it('still returns exactly Number.MAX_SAFE_INTEGER, which is safe', () => {
      expect(parseLongNotation('9007199254740991')).toBe(Number.MAX_SAFE_INTEGER)
      expect(parseLongNotation('-9007199254740991')).toBe(-Number.MAX_SAFE_INTEGER)
      expect(
        parseLongNotation('9 quadrillion 7 trillion 199 billion 254 million 740 thousand 991', {
          locale: enWithQuadrillion,
        }),
      ).toBe(Number.MAX_SAFE_INTEGER)
    })
  })

  it("{ output: 'number' } behaves exactly like the default", () => {
    expect(parseLongNotation('1 million 234 thousand 567', { output: 'number' })).toBe(1234567)
    expect(typeof parseLongNotation('1 thousand', { output: 'number' })).toBe('number')
  })

  it('throws RangeError for an output value other than "number" or "bigint"', () => {
    // @ts-expect-error — deliberately invalid output to exercise the runtime guard
    expect(() => parseLongNotation('1 thousand', { output: 'string' })).toThrow(RangeError)
    // @ts-expect-error — deliberately invalid output to exercise the runtime guard
    expect(() => parseLongNotation('1 thousand', { output: 'BigInt' })).toThrow(
      'parseLongNotation: output must be "number" or "bigint", received BigInt',
    )
  })

  it('types the result through the output option (compile-time check)', () => {
    const asBigInt: bigint = parseLongNotation('1 thousand', { output: 'bigint' })
    const asNumber: number = parseLongNotation('1 thousand')
    const asNumberExplicit: number = parseLongNotation('1 thousand', {
      output: 'number',
      groupSeparator: ' ',
    })
    expect(typeof asBigInt).toBe('bigint')
    expect(typeof asNumber).toBe('number')
    expect(typeof asNumberExplicit).toBe('number')
  })
})

describe('long notation group separator validation', () => {
  it('throws when toLongNotation is given an unusable group separator', () => {
    // Produced "1 million234 thousand" before 2026-09-01 — its own parser
    // could not read it back.
    expect(() => toLongNotation(1234567, { groupSeparator: '' })).toThrow(RangeError)
    expect(() => toLongNotation(1234567, { groupSeparator: ' 0 ' })).toThrow(RangeError)
  })

  it('throws when parseLongNotation is given an unusable group separator', () => {
    expect(() => parseLongNotation('1 million 234 thousand', { groupSeparator: '' })).toThrow(
      RangeError,
    )
    expect(() => parseLongNotation('1 million', { groupSeparator: '7' })).toThrow(RangeError)
  })
})
