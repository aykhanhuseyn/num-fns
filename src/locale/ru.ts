import type { GrammaticalGender, Locale, PluralCategory, WordChunk } from './types'

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
 * v1 — "третьего", "третьей", "третьим", etc. aren't covered; every value
 * this module returns is the nominative masculine singular form, e.g.
 * "первый"/"двадцать первый", never a declined or gendered variant). Covers
 * every ones/teens/tens/hundreds/scale word `numberToWords`-style composition
 * can produce as a trailing word; {@link deriveOrdinalWord} is a best-effort
 * fallback for anything else, used only when {@link fuseRoundScaleOrdinal}
 * doesn't apply (it needs a real numeric `value`, so the `cardinalToOrdinalWords`
 * convenience wrapper's placeholder `NaN` still falls through to this table).
 *
 * Fixed 2026-08-22 (`todo.md` §2): a cardinal reading whose trailing group is
 * bound to a scale word (a round thousand/million/etc., e.g.
 * `numberToWords(2000, { locale: ru })` -> "две тысячи") used to ordinalize
 * only the scale word itself, leaving the leading count word untouched
 * ("две тысячный") instead of the grammatically correct Russian compound
 * ordinal ("двухтысячный"). `fuseRoundScaleOrdinal` now contracts the
 * trailing chunk's multiplier into a combining prefix ("двух-", "пяти-",
 * "сто-", "двадцатипяти-") fused onto the scale ordinal stem before this
 * table is ever consulted for that chunk.
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

/** Matches a trailing "один" (agreeing form needed before feminine "тысяча"). */
const ODIN_REGEX = /(^|\s)один$/
/** Matches a trailing "два" (agreeing form needed before feminine "тысяча"). */
const DVA_REGEX = /(^|\s)два$/
/** Splits a spelled-out cardinal into tokens to isolate the last word for ordinalization. */
const WHITESPACE_REGEX = /\s+/

/** Best-effort fallback for a word not in {@link ORDINAL_WORDS}. */
function deriveOrdinalWord(word: string): string {
  if (word.endsWith('ь') || word.endsWith('о')) return `${word.slice(0, -1)}ый`
  return `${word}ый`
}

/**
 * Combining forms for digits 2-9, used as the trailing component of a
 * compound round-scale ordinal ("двух-" before "тысячный", "пяти-" before
 * "тысячный"). "1" is handled separately by {@link combiningForm} — it's
 * elided when it's the whole multiplier ("тысячный") but surfaces as "одно"
 * when it trails a tens/hundreds prefix ("двадцатиодно-").
 */
const ONES_COMBINING: Readonly<Record<number, string>> = {
  2: 'двух',
  3: 'трёх',
  4: 'четырёх',
  5: 'пяти',
  6: 'шести',
  7: 'семи',
  8: 'восьми',
  9: 'девяти',
}

/** Combining forms for the tens digit (10, 20, ..., 90), keyed by the digit itself (1-9). */
const TENS_COMBINING: Readonly<Record<number, string>> = {
  1: 'десяти',
  2: 'двадцати',
  3: 'тридцати',
  4: 'сорока',
  5: 'пятидесяти',
  6: 'шестидесяти',
  7: 'семидесяти',
  8: 'восьмидесяти',
  9: 'девяноста',
}

/** Combining forms for the irregular teens (11-19) — they don't decompose into tens+ones. */
const TEENS_COMBINING: Readonly<Record<number, string>> = {
  11: 'одиннадцати',
  12: 'двенадцати',
  13: 'тринадцати',
  14: 'четырнадцати',
  15: 'пятнадцати',
  16: 'шестнадцати',
  17: 'семнадцати',
  18: 'восемнадцати',
  19: 'девятнадцати',
}

/**
 * Combining forms for the hundreds digit (100, 200, ..., 900), keyed by the
 * digit itself (1-9). "сто" is invariant here, unlike 200-900, which take a
 * "-сот" genitive-plural-like form: real Russian is "стотысячный" (e.g.
 * "стотысячный посетитель"), not "статысячный" — corrected from the task
 * brief's example table, which listed 100 -> "ста".
 */
const HUNDREDS_COMBINING: Readonly<Record<number, string>> = {
  1: 'сто',
  2: 'двухсот',
  3: 'трёхсот',
  4: 'четырёхсот',
  5: 'пятисот',
  6: 'шестисот',
  7: 'семисот',
  8: 'восьмисот',
  9: 'девятисот',
}

/**
 * Ordinal stem fused onto a combining-form prefix, indexed the same way
 * `words.scales` is: index `0` (the units group) never participates in
 * fusion and has no stem.
 */
const SCALE_ORDINAL_STEMS: readonly string[] = [
  '',
  'тысячный',
  'миллионный',
  'миллиардный',
  'триллионный',
]

/**
 * Builds the combining-form prefix for a 1-999 multiplier ahead of a scale
 * ordinal stem: "двух-", "пяти-", "двадцатипяти-", "двухсотпятидесяти-".
 * "один" is elided entirely when it's the *whole* multiplier ("тысячный",
 * not "однотысячный") but surfaces as "одно" when it's only the trailing
 * digit of a larger compound ("двадцатиодно-" before "тысячный").
 */
function combiningForm(multiplier: number): string {
  const hundredsDigit = Math.floor(multiplier / 100)
  const remainder = multiplier % 100
  let form = hundredsDigit > 0 ? (HUNDREDS_COMBINING[hundredsDigit] as string) : ''

  if (remainder === 0) return form
  if (remainder >= 11 && remainder <= 19) return form + (TEENS_COMBINING[remainder] as string)

  const tensDigit = Math.floor(remainder / 10)
  const onesDigit = remainder % 10
  if (tensDigit > 0) form += TENS_COMBINING[tensDigit] as string
  if (onesDigit === 1) {
    // Elided only when "one" is the entire multiplier; a compound trailing
    // "one" still needs a word ("двадцатиодно-", not bare "двадцати-").
    if (hundredsDigit > 0 || tensDigit > 0) form += 'одно'
  } else if (onesDigit > 0) {
    form += ONES_COMBINING[onesDigit] as string
  }
  return form
}

/**
 * Detects whether `value`'s cardinal reading ends in a scale word (a round
 * thousand/million/billion/trillion, possibly with a compound multiplier —
 * "два миллиона пятьсот тысяч") and, if so, fuses the trailing chunk into
 * the correct Russian compound ordinal ("двухтысячный",
 * "двадцатипятитысячный", "...пятисоттысячный") instead of leaving the
 * multiplier as a separate cardinal word in front of an ordinalized scale
 * word. Chunks before the trailing one are left as plain cardinal words,
 * unchanged — only the final chunk fuses.
 *
 * Returns `null` when fusion doesn't apply: `value` isn't a positive integer
 * (the `cardinalToOrdinalWords` convenience wrapper passes `NaN`), its
 * reading doesn't end in a scale word (`2001` -> "две тысячи первый", `21`
 * -> "двадцать первый"), or its scale is beyond this locale's vocabulary —
 * the caller then falls back to the plain last-word transform.
 */
function fuseRoundScaleOrdinal(value: number, tokens: readonly string[]): string | null {
  if (!Number.isInteger(value) || value <= 0) return null

  const groups: number[] = []
  let remaining = value
  while (remaining > 0) {
    groups.push(remaining % 1000)
    remaining = Math.floor(remaining / 1000)
  }
  // The trailing (units) group must be empty for the reading to end in a
  // scale word at all — a nonzero units digit means it ends in an ordinary
  // cardinal word instead ("две тысячи первый", not fused).
  if (groups[0] !== 0) return null

  let trailingScaleIndex = -1
  for (let i = 1; i < groups.length; i++) {
    if (groups[i]) {
      trailingScaleIndex = i
      break
    }
  }
  const scaleStem = SCALE_ORDINAL_STEMS[trailingScaleIndex]
  if (scaleStem === undefined) return null

  const multiplier = groups[trailingScaleIndex] as number
  const fusedWord = `${combiningForm(multiplier)}${scaleStem}`

  // The multiplier's own cardinal rendering (masculine, gender-agreement
  // differences like "два"/"две" don't change the token count) tells us how
  // many trailing tokens of `tokens` — plus one for the scale word itself —
  // to drop before appending the fused word.
  const multiplierTokenCount = renderGroup(multiplier).split(WHITESPACE_REGEX).length
  const leadingTokens = tokens.slice(0, tokens.length - (multiplierTokenCount + 1))
  return [...leadingTokens, fusedWord].join(' ')
}

/** Words for digits 1-9. Index `0` is unused so digits can index directly. */
const ONES = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']
/** Irregular words for 11-19, index `0` corresponding to 11. */
const TEENS = [
  'одиннадцать',
  'двенадцать',
  'тринадцать',
  'четырнадцать',
  'пятнадцать',
  'шестнадцать',
  'семнадцать',
  'восемнадцать',
  'девятнадцать',
]
/** Words for the tens digit: 10, 20, ..., 90. Index `0` is unused. */
const TENS = [
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
]
/** Irregular per digit 1-9 ("двести", "триста", ... — not a "два сто" compound). Index `0` is unused. */
const HUNDREDS = [
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
]

/**
 * The two Russian cardinals that inflect by gender, keyed by the ones digit
 * they replace: `один` -> `одна`/`одно`, `два` -> `две` (neuter shares the
 * masculine `два` — "два окна"). Every other cardinal word is invariant.
 */
const GENDERED_ONES: Readonly<Partial<Record<number, Partial<Record<GrammaticalGender, string>>>>> =
  {
    1: { feminine: 'одна', neuter: 'одно' },
    2: { feminine: 'две' },
  }

/**
 * Renders a single 0-999 group as Russian cardinal words, in the masculine
 * citation form unless `gender` selects the feminine/neuter agreement for a
 * trailing "один"/"два" ("двадцать одна", "одно"). `numberToWords` only
 * passes `gender` for the units group — agreement for the thousands group's
 * trailing "один"/"два" before the feminine "тысяча" is handled by
 * `compose`, not here, since only `compose` knows a chunk's scale position.
 */
function renderGroup(value: number, gender?: GrammaticalGender): string {
  const hundreds = Math.floor(value / 100)
  const remainder = value % 100

  const parts: string[] = []
  if (hundreds > 0) parts.push(HUNDREDS[hundreds] as string)

  if (remainder >= 11 && remainder <= 19) {
    parts.push(TEENS[remainder - 11] as string)
  } else {
    const tens = Math.floor(remainder / 10)
    const ones = remainder % 10
    if (tens > 0) parts.push(TENS[tens] as string)
    if (ones > 0) {
      const genderedOne = gender ? GENDERED_ONES[ones]?.[gender] : undefined
      parts.push(genderedOne ?? (ONES[ones] as string))
    }
  }

  return parts.join(' ')
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
    ones: ONES,
    teens: TEENS,
    tens: TENS,
    // Irregular per digit 1-9 ("двести", "триста", ... — not a "два сто" compound).
    hundreds: HUNDREDS,
    scales: [
      '',
      { one: 'тысяча', few: 'тысячи', many: 'тысяч' },
      { one: 'миллион', few: 'миллиона', many: 'миллионов' },
      { one: 'миллиард', few: 'миллиарда', many: 'миллиардов' },
      { one: 'триллион', few: 'триллиона', many: 'триллионов' },
    ],
    negative: 'минус',
    // The standard spoken reading names the decimal comma itself: `12.34`
    // -> "двенадцать запятая тридцать четыре" (`todo.md` §2).
    decimalConnector: 'запятая',
    // Russian distinguishes all three genders in "один"/"два" ("одна
    // книга", "одно окно", "две книги"); masculine is the citation form.
    genders: ['masculine', 'feminine', 'neuter'],
    defaultGender: 'masculine',
    renderGroup,
    compose: (chunks: readonly WordChunk[]): string =>
      chunks
        .map((chunk) => {
          let words = chunk.words
          if (chunk.scaleIndex === 1) {
            // "тысяча" is feminine: a trailing "один"/"два" must agree
            // ("одна тысяча", "двадцать две тысячи"), unlike "миллион" and
            // above which stay masculine ("двадцать один миллион").
            words = words.replace(ODIN_REGEX, '$1одна').replace(DVA_REGEX, '$1две')
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
    words: (value: number, cardinalWords: string): string => {
      const tokens = cardinalWords.toLowerCase().split(WHITESPACE_REGEX)

      const fused = fuseRoundScaleOrdinal(value, tokens)
      if (fused !== null) return fused

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
    symbolPosition: 'after',
    units: {
      RUB: {
        // "рубль" is masculine ("один рубль"), matching `words.defaultGender`;
        // set explicitly so it's self-documenting rather than an accident of
        // the default. "копейка" is feminine ("одна копейка", "две копейки")
        // — the gender that actually changes output here, since without it
        // the amount defaults to masculine ("один копейка", wrong).
        major: {
          word: 'рубль',
          plurals: { one: 'рубль', few: 'рубля', many: 'рублей' },
          gender: 'masculine',
        },
        minor: {
          word: 'копейка',
          plurals: { one: 'копейка', few: 'копейки', many: 'копеек' },
          gender: 'feminine',
        },
      },
      USD: {
        major: {
          word: 'доллар',
          plurals: { one: 'доллар', few: 'доллара', many: 'долларов' },
          gender: 'masculine',
        },
        minor: {
          word: 'цент',
          plurals: { one: 'цент', few: 'цента', many: 'центов' },
          gender: 'masculine',
        },
      },
      EUR: {
        // "евро" is indeclinable — the same form in every plural category —
        // and masculine in the current standard ("один евро").
        major: { word: 'евро', gender: 'masculine' },
        minor: {
          word: 'цент',
          plurals: { one: 'цент', few: 'цента', many: 'центов' },
          gender: 'masculine',
        },
      },
      GBP: {
        // "стерлингов" is an invariant genitive-plural attribute: only "фунт"
        // inflects ("один фунт стерлингов", "два фунта стерлингов").
        major: {
          word: 'фунт стерлингов',
          plurals: { one: 'фунт стерлингов', few: 'фунта стерлингов', many: 'фунтов стерлингов' },
          gender: 'masculine',
        },
        minor: {
          word: 'пенс',
          plurals: { one: 'пенс', few: 'пенса', many: 'пенсов' },
          gender: 'masculine',
        },
      },
      AZN: {
        major: {
          word: 'манат',
          plurals: { one: 'манат', few: 'маната', many: 'манатов' },
          gender: 'masculine',
        },
        minor: {
          word: 'гяпик',
          plurals: { one: 'гяпик', few: 'гяпика', many: 'гяпиков' },
          gender: 'masculine',
        },
      },
    },
  },
}
