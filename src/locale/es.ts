import type { Locale, PluralCategory, WordChunk } from './types'

/**
 * Ordinal word for each cardinal token a Spanish `numberToWords`-style
 * composition can produce, nominative masculine singular only (mirrors the
 * v1 scope `ru.ts` documents for Russian case/gender). Unlike English or
 * Russian, Spanish ordinalizes *every* recognized token of a compound
 * number, not just the last one ("treinta y uno" -> "trigésimo primero",
 * not "treinta y primero") — see {@link ordinal.words} below. Round
 * multiples of a scale word (e.g. "dos mil" -> idiomatic "dosmilésimo") are
 * a known gap: this table ordinalizes each token independently, so it
 * produces "segundo milésimo" instead — documented rather than silently wrong.
 */
const ORDINAL_WORDS: Readonly<Record<string, string>> = {
  cero: 'cero',
  uno: 'primero',
  dos: 'segundo',
  tres: 'tercero',
  cuatro: 'cuarto',
  cinco: 'quinto',
  seis: 'sexto',
  siete: 'séptimo',
  ocho: 'octavo',
  nueve: 'noveno',
  diez: 'décimo',
  once: 'undécimo',
  doce: 'duodécimo',
  trece: 'decimotercero',
  catorce: 'decimocuarto',
  quince: 'decimoquinto',
  dieciséis: 'decimosexto',
  diecisiete: 'decimoséptimo',
  dieciocho: 'decimoctavo',
  diecinueve: 'decimonoveno',
  veinte: 'vigésimo',
  veintiuno: 'vigésimo primero',
  veintidós: 'vigésimo segundo',
  veintitrés: 'vigésimo tercero',
  veinticuatro: 'vigésimo cuarto',
  veinticinco: 'vigésimo quinto',
  veintiséis: 'vigésimo sexto',
  veintisiete: 'vigésimo séptimo',
  veintiocho: 'vigésimo octavo',
  veintinueve: 'vigésimo noveno',
  treinta: 'trigésimo',
  cuarenta: 'cuadragésimo',
  cincuenta: 'quincuagésimo',
  sesenta: 'sexagésimo',
  setenta: 'septuagésimo',
  ochenta: 'octogésimo',
  noventa: 'nonagésimo',
  cien: 'centésimo',
  ciento: 'centésimo',
  mil: 'milésimo',
  millón: 'millonésimo',
  millones: 'millonésimo',
  millardo: 'millardésimo',
  millardos: 'millardésimo',
  billón: 'billonésimo',
  billones: 'billonésimo',
}

/** Matches a trailing "veintiuno" so it can apocopate to "veintiún" before a scale noun. */
const VEINTIUNO_SUFFIX_REGEX = /veintiuno$/
/** Matches a trailing "uno" so it can apocopate to "un" before a scale noun. */
const UNO_SUFFIX_REGEX = /uno$/
/** Splits a spelled-out cardinal into tokens for per-token ordinalization. */
const WHITESPACE_REGEX = /\s+/

/** Words for digits 1-9. Index `0` is unused so digits can index directly. */
const ONES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
/** Irregular words for 11-19, index `0` corresponding to 11. */
const TEENS = [
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciséis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
]
/** Words for the tens digit: 10, 20, ..., 90. Index `0` is unused. `20` is `'veinte'`; 21-29 use {@link VEINTI} instead. */
const TENS = [
  '',
  'diez',
  'veinte',
  'treinta',
  'cuarenta',
  'cincuenta',
  'sesenta',
  'setenta',
  'ochenta',
  'noventa',
]
/**
 * Irregular per digit 1-9 ("quinientos", "setecientos", "novecientos" aren't the
 * regular "*cientos" pattern). Index 1 is "ciento", the multiplier form used before
 * more digits or a scale word; standalone 100 is special-cased to "cien" in `compose`.
 */
const HUNDREDS = [
  '',
  'ciento',
  'doscientos',
  'trescientos',
  'cuatrocientos',
  'quinientos',
  'seiscientos',
  'setecientos',
  'ochocientos',
  'novecientos',
]
/**
 * 20-29 contract into a single word ("veintiuno", not "veinte y uno") —
 * unlike every other tens digit, which joins the ones digit with "y"
 * ("treinta y uno"). Three of these (21, 22, 23) also gain an accent
 * ("veintidós", "veintitrés") that a mechanical "veint" + ones-word
 * concatenation wouldn't produce, so this is a lookup table rather than a
 * derived form. Index `0` is `20` itself ("veinte"), matching {@link TENS}'s
 * indexing so `VEINTI[remainder - 20]` reads naturally in {@link renderGroup}.
 */
const VEINTI = [
  'veinte',
  'veintiuno',
  'veintidós',
  'veintitrés',
  'veinticuatro',
  'veinticinco',
  'veintiséis',
  'veintisiete',
  'veintiocho',
  'veintinueve',
]

/**
 * Renders a single 0-999 group as Spanish cardinal words: the regular
 * "ciento" hundreds form (100 alone is special-cased to "cien" by
 * `compose`, which is the only place that knows a chunk's overall value),
 * the irregular 20-29 contraction, and "y" between a tens word (30+) and a
 * nonzero ones digit ("treinta y cinco"). Apocopation of "uno"/"veintiuno"
 * before a scale word ("un millón", "veintiún millones") is `compose`'s
 * job, since only `compose` knows a chunk sits before a scale word at all.
 */
function renderGroup(value: number): string {
  const hundreds = Math.floor(value / 100)
  const remainder = value % 100

  const parts: string[] = []
  if (hundreds > 0) parts.push(HUNDREDS[hundreds] as string)

  if (remainder >= 11 && remainder <= 19) {
    parts.push(TEENS[remainder - 11] as string)
  } else if (remainder >= 20 && remainder <= 29) {
    parts.push(VEINTI[remainder - 20] as string)
  } else {
    const tens = Math.floor(remainder / 10)
    const ones = remainder % 10
    if (tens > 0 && ones > 0) parts.push(`${TENS[tens]} y ${ONES[ones]}`)
    else if (tens > 0) parts.push(TENS[tens] as string)
    else if (ones > 0) parts.push(ONES[ones] as string)
  }

  return parts.join(' ')
}

/**
 * Spanish locale (`todo.md` §1/§2). Two composition irregularities live in
 * `words.compose`: the "cien"/"ciento" split (100 alone is "cien", but
 * "ciento" before more digits or a scale word, e.g. "cien mil" vs "ciento
 * uno") and "uno"/"veintiuno" apocopating to "un"/"veintiún" before a
 * masculine scale noun ("un millón", "veintiún millones") — except "mil",
 * which drops the leading "uno" entirely ("mil", not "un mil"), the same
 * irregularity `az.ts` documents for "min". `1e9` is named "millardo" here
 * rather than the more colloquial "mil millones", per the leaning noted in
 * `todo.md` §1's scale-naming decision — the traditional Spanish "billón"
 * (`1e12`, long scale) is kept distinct from English "billion" (`1e9`).
 */
export const es: Locale = {
  code: 'es',
  name: 'Spanish',
  formatDefaults: {
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  words: {
    zero: 'cero',
    ones: ONES,
    teens: TEENS,
    tens: TENS,
    hundreds: HUNDREDS,
    scales: [
      '',
      'mil',
      { one: 'millón', other: 'millones' },
      { one: 'millardo', other: 'millardos' },
      { one: 'billón', other: 'billones' },
    ],
    negative: 'menos',
    // Only used between a tens word and a nonzero ones digit within a single
    // 0-999 group ("treinta y cinco"), never between scale groups — consumed
    // by `renderGroup`, not `compose` (see `Locale.words.and`'s doc comment
    // in `types.ts`).
    and: 'y',
    renderGroup,
    compose: (chunks: readonly WordChunk[]): string =>
      chunks
        .map((chunk) => {
          const words = chunk.value === 100 ? 'cien' : chunk.words
          if (!chunk.scaleWord) return words
          if (chunk.scaleIndex === 1) {
            // "mil" never takes "uno"/"un" — 1000 is "mil", not "un mil".
            return chunk.value === 1 ? chunk.scaleWord : `${words} ${chunk.scaleWord}`
          }
          // "uno"/"veintiuno" apocopate to "un"/"veintiún" before a masculine
          // scale noun ("un millón", "veintiún millones", "treinta y un millones").
          const apocopated = words.endsWith('veintiuno')
            ? words.replace(VEINTIUNO_SUFFIX_REGEX, 'veintiún')
            : words.replace(UNO_SUFFIX_REGEX, 'un')
          return `${apocopated} ${chunk.scaleWord}`
        })
        .join(' '),
  },
  // Only "millón"/"millardo"/"billón" inflect by count; "mil" never does.
  plural: (n: number): PluralCategory => (Math.abs(n) === 1 ? 'one' : 'other'),
  ordinal: {
    // Written with the masculine ordinal indicator "º" directly after the digits
    // (e.g. "5º"), unlike English's varying st/nd/rd/th (nominative masculine
    // singular only; feminine "ª" isn't covered — see the module doc comment).
    suffix: (value: number): string => {
      if (!Number.isInteger(value) || value < 0) {
        throw new RangeError(
          `es.ordinal.suffix: value must be a non-negative integer, received ${value}`,
        )
      }
      return 'º'
    },
    // Spanish ordinalizes every recognized token of a compound number, not just
    // the last one, and drops the "y" connector ("treinta y uno" (31) ->
    // "trigésimo primero", not "trigésimo y primero"). See the module doc
    // comment for the round-multiple-of-a-scale-word gap this leaves.
    words: (_value: number, cardinalWords: string): string =>
      cardinalWords
        .toLowerCase()
        .split(WHITESPACE_REGEX)
        .filter((token) => token !== 'y')
        .map((token) => ORDINAL_WORDS[token] ?? token)
        .join(' '),
  },
  notation: {
    scales: [
      { threshold: 1e12, short: 'B', long: 'billón' },
      { threshold: 1e9, short: 'MM', long: 'millardo' },
      { threshold: 1e6, short: 'M', long: 'millón' },
      { threshold: 1e3, short: 'mil', long: 'mil' },
    ],
    spaceBeforeShort: true,
  },
  currency: {
    code: 'EUR',
    symbol: '€',
    symbolPosition: 'after',
    major: { word: 'euro', plurals: { one: 'euro', other: 'euros' } },
    minor: { word: 'céntimo', plurals: { one: 'céntimo', other: 'céntimos' } },
  },
}
