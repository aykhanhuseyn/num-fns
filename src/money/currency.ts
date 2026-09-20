import { guardRecord } from '../shared/no-throw'
/**
 * ISO 4217 codes `num-fns` ships symbol data for, and that every launch
 * locale carries unit words for (`Locale.currency.units`). A closed union
 * rather than `string` so that `formatMoney(1, { currency: 'EUR' })`
 * autocompletes and a typo is a compile error; JavaScript callers get the
 * same guarantee at runtime from {@link getCurrency}'s `RangeError`.
 *
 * Adding a code means adding it here, in {@link CURRENCIES}, and — for
 * `moneyToWords` to be able to spell it — in every locale's `currency.units`
 * (`locale/conformance.test.ts` pins that every launch locale covers every
 * code in this union, so a partial addition fails the suite on purpose).
 */
export type CurrencyCode = 'AZN' | 'USD' | 'EUR' | 'RUB' | 'GBP'

/**
 * The locale-independent facts about one currency. Everything a language
 * has an opinion on — the unit words, their plurals and grammatical gender,
 * and which side of the amount the symbol goes — lives in the `Locale`
 * instead (`Locale.currency`), so this record is the same for every locale.
 */
export interface Currency {
  /** ISO 4217 alphabetic code, e.g. `'USD'`. */
  code: CurrencyCode
  /** Currency sign, e.g. `'$'`, `'€'`, `'₼'`. Placement is the locale's call (`Locale.currency.symbolPosition`). */
  symbol: string
  /**
   * ISO 4217 minor-unit exponent — how many fractional digits an amount in
   * this currency carries (`2` for all five launch currencies: 100 cents to
   * the dollar). `formatMoney` defaults `decimals` to it and `moneyToWords`
   * uses it to split the major and minor amounts.
   */
  decimals: number
}

const CURRENCIES: Readonly<Record<CurrencyCode, Currency>> = {
  AZN: { code: 'AZN', symbol: '₼', decimals: 2 },
  USD: { code: 'USD', symbol: '$', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', decimals: 2 },
  RUB: { code: 'RUB', symbol: '₽', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', decimals: 2 },
}

/**
 * Looks up the locale-independent record for an ISO 4217 code — the symbol
 * and minor-unit exponent `formatMoney`/`parseMoney`/`moneyToWords` read
 * when given a `currency` option. Throws `RangeError` for a code `num-fns`
 * doesn't know, rather than returning `undefined`, so a JavaScript caller
 * gets the same guarantee the {@link CurrencyCode} union gives TypeScript.
 *
 * @example
 * getCurrency('EUR'); // { code: 'EUR', symbol: '€', decimals: 2 }
 * getCurrency('XYZ'); // throws RangeError
 */
export function getCurrency(code: CurrencyCode): Currency {
  return guardRecord(() => {
    // An own-key check rather than a bare index (or `in`) so a JavaScript
    // caller passing 'constructor' or 'toString' gets the RangeError, not
    // `Object.prototype`. Not `Object.hasOwn`: the build targets ES2018.
    const known = Object.keys(CURRENCIES)
    if (!known.includes(code)) {
      throw new RangeError(
        `getCurrency: unknown currency code "${code}" — expected one of ${known.join(', ')}`,
      )
    }
    return CURRENCIES[code]
  })
}
