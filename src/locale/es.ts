import type { GrammaticalGender, Locale, PluralCategory, WordChunk } from './types'

/**
 * Ordinal word for each cardinal token a Spanish `numberToWords`-style
 * composition can produce, nominative masculine singular only (mirrors the
 * v1 scope `ru.ts` documents for Russian case/gender). Unlike English or
 * Russian, Spanish ordinalizes *every* recognized token of a compound
 * number, not just the last one ("treinta y uno" -> "trigésimo primero",
 * not "treinta y primero") — see {@link ordinal.words} below.
 *
 * Round multiples of a scale word ("dos mil" -> idiomatic "dosmilésimo")
 * are the one case this per-token table does *not* handle by itself — fed
 * "dos" and "mil" independently it would produce "segundo milésimo". That
 * case is intercepted before this table is ever consulted, by
 * {@link fusedScaleOrdinal} (`todo.md` §2); this table still supplies the
 * scale-word stems that fusion fuses onto (`mil` -> `milésimo`, etc.) and
 * still handles every number that doesn't end in a scale word.
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

/** Matches a trailing "veintiuno"/"veintiuna" so it can apocopate to "veintiún" before a scale noun. */
const VEINTIUNO_SUFFIX_REGEX = /veintiun[oa]$/
/** Matches a trailing "uno"/"una" so it can apocopate to "un" before a scale noun. */
const UNO_SUFFIX_REGEX = /un[oa]$/

/**
 * Apocopates a trailing "uno"/"veintiuno" (and their feminine "una"/
 * "veintiuna") to "un"/"veintiún" before a scale noun ("un millón",
 * "veintiún mil", "treinta y un millones"). RAE sanctions the apocopated
 * form before "mil" even in feminine agreement ("doscientas treinta y un
 * mil personas") — the unapocopated "veintiuna mil" variant is accepted but
 * not the citation form, so it isn't produced here.
 */
function apocopate(words: string): string {
  return VEINTIUNO_SUFFIX_REGEX.test(words)
    ? words.replace(VEINTIUNO_SUFFIX_REGEX, 'veintiún')
    : words.replace(UNO_SUFFIX_REGEX, 'un')
}
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
 * Feminine agreement forms of {@link HUNDREDS}: the "-cientos" hundreds all
 * inflect ("doscientas casas"), while the multiplier form "ciento" (and the
 * standalone "cien" `compose` special-cases) is invariable. Kept as a full
 * parallel table rather than a mechanical "os" -> "as" rewrite for the same
 * reason {@link VEINTI} is a table: explicit forms over derivation.
 */
const HUNDREDS_FEMININE = [
  '',
  'ciento',
  'doscientas',
  'trescientas',
  'cuatrocientas',
  'quinientas',
  'seiscientas',
  'setecientas',
  'ochocientas',
  'novecientas',
]

/**
 * Scale words indexed by group-of-three-digits position, read from the
 * right — index `0` is the units group (no word), `1` is `mil`, and so on.
 * Hoisted to a standalone constant (rather than an inline array literal on
 * `es.words.scales`) so {@link scaleChunks} can reuse it without going
 * through `es` itself, which isn't assigned yet while its own object
 * literal is being built.
 */
const SCALES: ReadonlyArray<string | Partial<Record<PluralCategory, string>>> = [
  '',
  'mil',
  { one: 'millón', other: 'millones' },
  { one: 'millardo', other: 'millardos' },
  { one: 'billón', other: 'billones' },
]

/**
 * Renders a single 0-999 group as Spanish cardinal words: the regular
 * "ciento" hundreds form (100 alone is special-cased to "cien" by
 * `compose`, which is the only place that knows a chunk's overall value),
 * the irregular 20-29 contraction, and "y" between a tens word (30+) and a
 * nonzero ones digit ("treinta y cinco"). Feminine `gender` swaps the two
 * inflecting word families — "uno"/"veintiuno" -> "una"/"veintiuna" and the
 * "-cientos" hundreds -> "-cientas" ("doscientas treinta y una"); Spanish
 * has no neuter cardinal forms, so `es.words.genders` never admits one.
 * Apocopation of "uno"/"veintiuno" before a scale word ("un millón",
 * "veintiún millones") is `compose`'s job, since only `compose` knows a
 * chunk sits before a scale word at all.
 */
function renderGroup(value: number, gender?: GrammaticalGender): string {
  const feminine = gender === 'feminine'
  const hundreds = Math.floor(value / 100)
  const remainder = value % 100

  const parts: string[] = []
  if (hundreds > 0) parts.push((feminine ? HUNDREDS_FEMININE : HUNDREDS)[hundreds] as string)

  const remainderWords = renderRemainder(remainder, feminine)
  if (remainderWords) parts.push(remainderWords)

  return parts.join(' ')
}

/**
 * Renders the 0-99 remainder of a group for {@link renderGroup}: the
 * irregular teens, the 20-29 contraction, and "y" between a tens word (30+)
 * and a nonzero ones digit. Returns `''` for `0` (the group's reading is
 * just its hundreds word, if any). Split out of `renderGroup` to keep each
 * function's branching within the lint budget.
 */
function renderRemainder(remainder: number, feminine: boolean): string {
  if (remainder >= 11 && remainder <= 19) return TEENS[remainder - 11] as string
  if (remainder >= 20 && remainder <= 29) {
    return feminine && remainder === 21 ? 'veintiuna' : (VEINTI[remainder - 20] as string)
  }

  const tens = Math.floor(remainder / 10)
  const ones = remainder % 10
  const onesWord = feminine && ones === 1 ? 'una' : (ONES[ones] as string)
  if (tens > 0 && ones > 0) return `${TENS[tens]} y ${onesWord}`
  if (tens > 0) return TENS[tens] as string
  return onesWord
}

/**
 * Joins ordered chunks (largest scale first) into a cardinal reading. The
 * two composition irregularities documented on {@link es}'s own doc
 * comment live here: the "cien"/"ciento" split and "uno"/"veintiuno"
 * apocopation. Extracted to a standalone named function (rather than an
 * inline arrow assigned to `es.words.compose`) so {@link fusedScaleOrdinal}
 * can call it directly on a subset of chunks — referencing `es.words.compose`
 * from inside `es`'s own object literal isn't possible, since `es` isn't
 * assigned yet while that literal is being built.
 */
function compose(chunks: readonly WordChunk[], gender?: GrammaticalGender): string {
  return chunks
    .map((chunk) => {
      // "mil" is gender-transparent — agreement passes through it to the
      // hundreds words ("doscientas mil casas") — so the thousands chunk
      // is re-rendered in the requested gender. "millón" and above are
      // masculine nouns and keep the chunk's ungendered rendering.
      const baseWords =
        chunk.scaleIndex === 1 && gender === 'feminine'
          ? renderGroup(chunk.value, gender)
          : chunk.words
      const words = chunk.value === 100 ? 'cien' : baseWords
      if (!chunk.scaleWord) return words
      if (chunk.scaleIndex === 1) {
        // "mil" never takes "uno"/"un" — 1000 is "mil", not "un mil" —
        // and a larger thousands chunk apocopates its trailing
        // "uno"/"una"/"veintiuno"/"veintiuna" ("veintiún mil", not
        // "veintiuno mil"; see `apocopate`'s note on feminine "mil").
        return chunk.value === 1 ? chunk.scaleWord : `${apocopate(words)} ${chunk.scaleWord}`
      }
      // "uno"/"veintiuno" apocopate to "un"/"veintiún" before a masculine
      // scale noun ("un millón", "veintiún millones", "treinta y un millones").
      return `${apocopate(words)} ${chunk.scaleWord}`
    })
    .join(' ')
}

/**
 * Builds the base-1000 `WordChunk`s for a positive integer — the same
 * right-to-left grouping `number/words.ts`'s `integerToWords` performs,
 * duplicated here rather than imported because `locale/es.ts` can't import
 * from `number/words.ts` without a circular dependency (`number/words.ts`
 * is the one that imports every locale, `en` included — see that module's
 * doc comment and `Locale.fractions`'s in `types.ts` for the same
 * constraint elsewhere). Used only by {@link fusedScaleOrdinal}, to recover
 * which scale chunk a round-multiple-of-1000 ordinal needs to fuse.
 */
function scaleChunks(value: number): WordChunk[] {
  const groups: number[] = []
  let remaining = value
  while (remaining > 0) {
    groups.push(remaining % 1000)
    remaining = Math.floor(remaining / 1000)
  }

  const chunks: WordChunk[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupValue = groups[i] as number
    if (!groupValue) continue

    const scaleEntry = SCALES[i] ?? ''
    const category: PluralCategory = Math.abs(groupValue) === 1 ? 'one' : 'other'
    const scaleWord =
      typeof scaleEntry === 'string' ? scaleEntry : (scaleEntry[category] ?? scaleEntry.other ?? '')
    chunks.push({ value: groupValue, words: renderGroup(groupValue), scaleIndex: i, scaleWord })
  }
  return chunks
}

/**
 * Matches the " y " compound connector a multiplier needs when it isn't a
 * contracted 21-29 form ("treinta y uno", not "veintiuno") — see
 * {@link fusedScaleOrdinal}.
 */
const Y_CONNECTOR_REGEX = / y /
/**
 * Matches "veintiún" so {@link fusedScaleOrdinal} can drop its written
 * accent once fused onto a following ordinal stem: the stress moves to the
 * stem's own accented syllable ("veintiunmilésimo", not "veintiúnmilésimo").
 * No other apocopated form ("un") carries a written accent to begin with.
 */
const VEINTIUN_ACCENT_REGEX = /veintiún/

/**
 * Fuses the RAE-idiomatic ordinal for a positive multiple of 1000 — "dos
 * mil" (2000) fuses to "dosmilésimo", not the per-token "segundo milésimo"
 * {@link ORDINAL_WORDS} would otherwise produce by ordinalizing "dos" and
 * "mil" independently (`todo.md` §2). Only the number's *final* scale chunk
 * fuses: its multiplier cardinal — the same "cien" special-case and
 * "uno"/"veintiuno" apocopation `compose` applies before a scale word, with
 * "veintiún"'s accent dropped since it's no longer word-final — attaches
 * directly to that scale's ordinal stem (`ORDINAL_WORDS['mil']` ===
 * `'milésimo'`, etc.), and a multiplier of exactly 1 is omitted entirely
 * ("un millón" -> "millonésimo", not "unmillonésimo"). Any chunks above the
 * fused one stay in ordinary cardinal form via {@link compose} ("2 003 000"
 * -> "dos millones tresmilésimo").
 *
 * Returns `null` — falling back to {@link ORDINAL_WORDS}'s per-token
 * algorithm — for `0`, for a value not divisible by 1000, and for a
 * multiplier that itself needs the " y " connector ("treinta y uno" before
 * "mil", 31 000): RAE's one-word fusion is attested for simple multipliers
 * (units, teens, the contracted 21-29 forms, decades, hundreds, and their
 * concatenation — "doscientoscincuentamilésimo" for 250 000) but there's no
 * attested single-word fusion for a tens-and-ones compound that needs "y",
 * so those numbers are left to the pre-existing per-token behavior rather
 * than inventing an unattested spelling.
 */
function fusedScaleOrdinal(value: number): string | null {
  if (value <= 0 || value % 1000 !== 0) return null

  const chunks = scaleChunks(value)
  const lastChunk = chunks[chunks.length - 1]
  if (!lastChunk || lastChunk.scaleIndex === 0) return null

  const stem = ORDINAL_WORDS[lastChunk.scaleWord]
  if (!stem) return null

  const multiplierWords = lastChunk.value === 100 ? 'cien' : renderGroup(lastChunk.value)
  const apocopated = apocopate(multiplierWords)
  if (Y_CONNECTOR_REGEX.test(apocopated)) return null

  const fusedMultiplier =
    lastChunk.value === 1
      ? ''
      : apocopated.replace(VEINTIUN_ACCENT_REGEX, 'veintiun').replace(WHITESPACE_REGEX, '')
  const precedingChunks = chunks.slice(0, -1)
  const prefix = precedingChunks.length > 0 ? `${compose(precedingChunks)} ` : ''
  return `${prefix}${fusedMultiplier}${stem}`
}

/**
 * Spanish locale (`todo.md` §1/§2). Two composition irregularities live in
 * `compose` (above): the "cien"/"ciento" split (100 alone is "cien", but
 * "ciento" before more digits or a scale word, e.g. "cien mil" vs "ciento
 * uno") and "uno"/"veintiuno" apocopating to "un"/"veintiún" before a
 * masculine scale noun ("un millón", "veintiún millones") — except "mil",
 * which drops the leading "uno" entirely ("mil", not "un mil"), the same
 * irregularity `az.ts` documents for "min". `1e9` is named "millardo" here
 * rather than the more colloquial "mil millones", per the leaning noted in
 * `todo.md` §1's scale-naming decision — the traditional Spanish "billón"
 * (`1e12`, long scale) is kept distinct from English "billion" (`1e9`).
 * `words.decimalConnector` is `'coma'`, RAE's standard decimal reading
 * ("doce coma treinta y cuatro" for `12.34`) — closing the `todo.md` §2 gap
 * this locale previously left unset (a plain-space join, shared at the time
 * with `en`/`ru`).
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
    scales: SCALES,
    negative: 'menos',
    // Only used between a tens word and a nonzero ones digit within a single
    // 0-999 group ("treinta y cinco"), never between scale groups — consumed
    // by `renderGroup`, not `compose` (see `Locale.words.and`'s doc comment
    // in `types.ts`).
    and: 'y',
    // RAE's standard reading of the decimal point ("doce coma treinta y
    // cuatro" for 12.34) — see the module doc comment's `todo.md` §2 note.
    decimalConnector: 'coma',
    // Spanish cardinals distinguish masculine/feminine ("una casa",
    // "doscientas casas") but have no neuter counting form; masculine is
    // the citation form.
    genders: ['masculine', 'feminine'],
    defaultGender: 'masculine',
    renderGroup,
    compose,
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
    // A round multiple of a scale word ("dos mil", "veintiún millones")
    // fuses into one word via `fusedScaleOrdinal` ("dosmilésimo",
    // "veintiunmillonésimo") instead of reaching the per-token fallback
    // below. Every other number ordinalizes *every* recognized token of its
    // compound cardinal reading, not just the last one, and drops the "y"
    // connector ("treinta y uno" (31) -> "trigésimo primero", not
    // "trigésimo y primero").
    words: (value: number, cardinalWords: string): string => {
      const fused = fusedScaleOrdinal(value)
      if (fused !== null) return fused

      return cardinalWords
        .toLowerCase()
        .split(WHITESPACE_REGEX)
        .filter((token) => token !== 'y')
        .map((token) => ORDINAL_WORDS[token] ?? token)
        .join(' ')
    },
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
    // Both "euro" and "céntimo" are masculine, matching `words.defaultGender` —
    // set explicitly so it's self-documenting; output is unchanged from the
    // pre-gender-field behavior since masculine is what the default already
    // produced.
    major: { word: 'euro', plurals: { one: 'euro', other: 'euros' }, gender: 'masculine' },
    minor: {
      word: 'céntimo',
      plurals: { one: 'céntimo', other: 'céntimos' },
      gender: 'masculine',
    },
  },
}
