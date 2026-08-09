import type { Locale, PluralCategory, WordChunk } from './types'

/**
 * Full CLDR-style Russian plural rule for non-negative integers: `one` for
 * ..1 (not ..11), `few` for ..2-4 (not ..12-14), `many` otherwise. Values
 * that aren't integers (a fractional amount, e.g. money) fall to `other`,
 * matching CLDR's own treatment of non-integer cardinals.
 */
function ruPlural(n: number): PluralCategory {
  if (!Number.isInteger(n)) return 'other'
  const abs = Math.abs(n)
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod10 === 1 && mod100 !== 11) return 'one'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few'
  return 'many'
}

/**
 * Ordinal word for the last token of a Russian cardinal reading, nominative
 * masculine singular only (`todo.md` §2 scopes case/gender declension out of
 * v1 — "третьего", "третьей", etc. aren't covered). Covers every ones/teens/
 * tens/hundreds/scale word `numberToWords`-style composition can produce as
 * a trailing word; {@link deriveOrdinalWord} is a best-effort fallback for
 * anything else.
 */
const ORDINAL_WORDS: Readonly<Record<string, string>> = {
  ноль: 'нулевой',
  один: 'первый',
  два: 'второй',
  три: 'третий',
  четыре: 'четвёртый',
  пять: 'пятый',
  шесть: 'шестой',
  семь: 'седьмой',
  восемь: 'восьмой',
  девять: 'девятый',
  одиннадцать: 'одиннадцатый',
  двенадцать: 'двенадцатый',
  тринадцать: 'тринадцатый',
  четырнадцать: 'четырнадцатый',
  пятнадцать: 'пятнадцатый',
  шестнадцать: 'шестнадцатый',
  семнадцать: 'семнадцатый',
  восемнадцать: 'восемнадцатый',
  девятнадцать: 'девятнадцатый',
  десять: 'десятый',
  двадцать: 'двадцатый',
  тридцать: 'тридцатый',
  сорок: 'сороковой',
  пятьдесят: 'пятидесятый',
  шестьдесят: 'шестидесятый',
  семьдесят: 'семидесятый',
  восемьдесят: 'восьмидесятый',
  девяносто: 'девяностый',
  сто: 'сотый',
  двести: 'двухсотый',
  триста: 'трёхсотый',
  четыреста: 'четырёхсотый',
  пятьсот: 'пятисотый',
  шестьсот: 'шестисотый',
  семьсот: 'семисотый',
  восемьсот: 'восьмисотый',
  девятьсот: 'девятисотый',
  тысяча: 'тысячный',
  тысячи: 'тысячный',
  тысяч: 'тысячный',
  миллион: 'миллионный',
  миллиона: 'миллионный',
  миллионов: 'миллионный',
  миллиард: 'миллиардный',
  миллиарда: 'миллиардный',
  миллиардов: 'миллиардный',
  триллион: 'триллионный',
  триллиона: 'триллионный',
  триллионов: 'триллионный',
}

/** Best-effort fallback for a word not in {@link ORDINAL_WORDS}. */
function deriveOrdinalWord(word: string): string {
  if (word.endsWith('ь') || word.endsWith('о')) return `${word.slice(0, -1)}ый`
  return `${word}ый`
}

/**
 * Russian locale (`todo.md` §1/§2). The two grammar traps called out in the
 * backlog live in `words.compose`: `тысяча` is feminine, so a trailing
 * "один"/"два" in the thousands group must agree ("одна тысяча", "две
 * тысячи"), while "миллион" and above stay masculine ("двадцать один
 * миллион"). Scale and currency words inflect by {@link ruPlural} via the
 * `Partial<Record<PluralCategory, string>>` maps in `words.scales` and
 * `currency`.
 */
export const ru: Locale = {
  code: 'ru',
  name: 'Russian',
  formatDefaults: {
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  words: {
    zero: 'ноль',
    ones: ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'],
    teens: [
      'одиннадцать',
      'двенадцать',
      'тринадцать',
      'четырнадцать',
      'пятнадцать',
      'шестнадцать',
      'семнадцать',
      'восемнадцать',
      'девятнадцать',
    ],
    tens: [
      '',
      'десять',
      'двадцать',
      'тридцать',
      'сорок',
      'пятьдесят',
      'шестьдесят',
      'семьдесят',
      'восемьдесят',
      'девяносто',
    ],
    // Irregular per digit 1-9 ("двести", "триста", ... — not a "два сто" compound).
    hundreds: [
      '',
      'сто',
      'двести',
      'триста',
      'четыреста',
      'пятьсот',
      'шестьсот',
      'семьсот',
      'восемьсот',
      'девятьсот',
    ],
    scales: [
      '',
      { one: 'тысяча', few: 'тысячи', many: 'тысяч' },
      { one: 'миллион', few: 'миллиона', many: 'миллионов' },
      { one: 'миллиард', few: 'миллиарда', many: 'миллиардов' },
      { one: 'триллион', few: 'триллиона', many: 'триллионов' },
    ],
    negative: 'минус',
    compose: (chunks: readonly WordChunk[]): string =>
      chunks
        .map((chunk) => {
          let words = chunk.words
          if (chunk.scaleIndex === 1) {
            // "тысяча" is feminine: a trailing "один"/"два" must agree
            // ("одна тысяча", "двадцать две тысячи"), unlike "миллион" and
            // above which stay masculine ("двадцать один миллион").
            words = words.replace(/(^|\s)один$/, '$1одна').replace(/(^|\s)два$/, '$1две')
          }
          return chunk.scaleWord ? `${words} ${chunk.scaleWord}` : words
        })
        .join(' '),
  },
  plural: ruPlural,
  ordinal: {
    // Russian abbreviates ordinals with a fixed "-й" regardless of the full
    // word's ending, unlike English's varying st/nd/rd/th (nominative
    // masculine singular only, per the v1 scope noted above).
    suffix: (value: number): string => {
      if (!Number.isInteger(value) || value < 0) {
        throw new RangeError(
          `ru.ordinal.suffix: value must be a non-negative integer, received ${value}`,
        )
      }
      return 'й'
    },
    words: (_value: number, cardinalWords: string): string => {
      const tokens = cardinalWords.toLowerCase().split(/\s+/)
      const lastWord = tokens.pop() as string
      const ordinalLastWord = ORDINAL_WORDS[lastWord] ?? deriveOrdinalWord(lastWord)
      return [...tokens, ordinalLastWord].join(' ')
    },
  },
  notation: {
    scales: [
      { threshold: 1e12, short: 'трлн', long: 'триллион' },
      { threshold: 1e9, short: 'млрд', long: 'миллиард' },
      { threshold: 1e6, short: 'млн', long: 'миллион' },
      { threshold: 1e3, short: 'тыс', long: 'тысяча' },
    ],
    spaceBeforeShort: true,
  },
  currency: {
    code: 'RUB',
    symbol: '₽',
    symbolPosition: 'after',
    major: { word: 'рубль', plurals: { one: 'рубль', few: 'рубля', many: 'рублей' } },
    minor: { word: 'копейка', plurals: { one: 'копейка', few: 'копейки', many: 'копеек' } },
  },
}
