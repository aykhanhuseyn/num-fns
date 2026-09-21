/**
 * Editorial layer over the mechanically-derived review items: which entries
 * deserve a reviewer's first ten minutes, and the entries where a bare word in
 * a table is not a clear enough question on its own.
 *
 * Keyed by `<localeExportId>.<path>`, matching {@link ReviewItem.path}. Adding
 * a locale or a currency needs no change here — an entry with no question just
 * renders without one.
 */

/**
 * Path prefixes whose items are surfaced first (the page's default filter).
 * Deliberately short: this is the list a reviewer with ten minutes should get
 * through, so it holds only what a non-speaker cannot self-check — vocabulary
 * borrowed across languages, the inflection machinery, and reading conventions
 * chosen from a dictionary rather than from use. Everything else is still there
 * under "Everything"; it is just not what we ask for first.
 */
const PRIORITY_PREFIXES: Readonly<Record<string, readonly string[]>> = {
  // Words this language borrowed for another country's money, plus the
  // Infinity word, which only surfaces under `noThrow` and so is the least
  // exercised string in the package.
  az: ['currency.units.RUB', 'currency.units.EUR', 'currency.units.GBP', 'words.infinity'],
  en: ['currency.units.RUB', 'currency.units.AZN', 'words.infinity'],
  enGB: ['currency.units.RUB', 'currency.units.AZN', 'words.infinity'],
  // `scales.1` is the тысяча case/gender split, the one place Russian
  // grammar is doing real work; the native hundreds and teens are not in
  // doubt and stay out of the short list.
  ru: [
    'currency.units.AZN',
    'currency.units.GBP',
    'words.scales.1',
    'words.decimalConnector',
    'words.infinity',
  ],
  // `scales.3` and `notation.scales.1` are both "millardo", which competes
  // with "mil millones" in actual use — a naming choice, not a lookup.
  es: [
    'currency.units.AZN',
    'currency.units.RUB',
    'words.scales.3',
    'notation.scales.1',
    'words.decimalConnector',
    'words.infinity',
  ],
}

/** Whether a `'value'` item at `path` is surfaced under the priority filter. */
export function isPriorityPath(localeCode: string, path: string): boolean {
  const prefixes = PRIORITY_PREFIXES[localeCode] ?? []
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}.`))
}

/**
 * Questions for entries where the word alone does not say what is being
 * asked — mostly currency units borrowed between these five languages, where
 * the risk is a plausible-looking transliteration nobody actually writes.
 */
const QUESTIONS: Readonly<Record<string, string>> = {
  // The three the maintainer flagged by name.
  'ru.currency.units.AZN.minor.word':
    'Is «гяпик» what a Russian speaker writing about Azerbaijani money actually uses? «гяпик» and «гапик» both appear in the wild, and some texts keep «гяпик» only in the plural.',
  'en.currency.units.RUB.minor.word':
    '“kopek” or “kopeck”? Both are attested in English; pick the one you would expect in a financial string.',
  'enGB.currency.units.RUB.minor.word':
    '“kopek” or “kopeck”? British usage may differ from the US spelling used in the `en` locale.',
  'es.currency.units.RUB.minor.word':
    '¿«kopek», «kopeck» o «copec»? La RAE y la prensa no coinciden — elige la forma que usarías en una cifra.',
  'es.currency.units.AZN.minor.word':
    '«gapik» es una transliteración inventada para esta librería. ¿Existe una forma habitual en español, o debería quedarse «qəpik»?',
  'es.currency.units.AZN.major.word':
    '¿«manat» se pluraliza «manats» o queda invariable («manat») en español?',
  'az.currency.units.RUB.minor.word':
    '"qəpik" burada rus kopeykası üçün işlənir. Azərbaycan dilində rus pulundan danışarkən "qəpik" demək adi haldır, yoxsa "kopeyka" daha düzgündür?',
  'az.currency.units.EUR.major.word':
    '"avro" yoxsa "yevro"? Rəsmi termin ilə danışıq dili fərqlənə bilər.',
  'az.currency.units.GBP.major.word':
    '"funt sterlinq" — hallanmadan, tək sözlə işlənməsi düzgündürmü?',

  // Conventions chosen from a dictionary, not from use.
  'ru.words.decimalConnector':
    'Читается ли 12,34 как «двенадцать запятая тридцать четыре»? Встречается и «целых» («двенадцать целых тридцать четыре сотых»).',
  'es.words.decimalConnector':
    '¿12,34 se lee «doce coma treinta y cuatro»? En parte de Hispanoamérica se dice «punto».',
  'ru.words.infinity': 'Слово, которое подставляется вместо ошибки для Infinity. Оно верное?',
  'es.words.infinity': 'Palabra que sustituye el error para Infinity. ¿Es correcta?',
  'az.words.infinity': 'Infinity əvəzinə işlədilən söz. Düzgündürmü?',

  // The plural/case machinery — the part a non-speaker cannot verify at all.
  'ru.words.scales.1.few':
    'Форма после 2–4 («две тысячи», «двадцать три тысячи»). Проверьте и 22, и 112.',
  'ru.words.scales.1.many': 'Форма после 5 и далее («пять тысяч», «одиннадцать тысяч»).',
  'es.words.scales.1':
    '«mil» nunca se pluraliza como palabra de escala («dos mil», no «dos miles»). ¿Correcto en todos los casos que se muestran?',
}

/** The question for a `'value'` item at `path`, if one is worth asking. */
export function questionFor(localeCode: string, path: string): string | undefined {
  return QUESTIONS[`${localeCode}.${path}`]
}
