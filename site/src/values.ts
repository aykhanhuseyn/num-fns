import type { Entry } from './catalog'
import { defaultValues, type FieldValues, type RunResult, runExample } from './engine'
import { type LocaleInfo, localeInfo } from './locales'

/** Settings that apply to every function at once (the playground's "Defaults" bar). */
export interface Globals {
  /** Locale export id (`az`, `enGB`, …) used by every function that takes `locale`. */
  locale: string
  /** `setConfig({ noThrow })` for every call. */
  noThrow: boolean
}

export const DEFAULT_GLOBALS: Globals = { locale: 'en', noThrow: false }

/**
 * The values a call uses: the registry's starting values, the global locale
 * in place of the `locale` field's own start, then whatever the reader typed.
 */
export function effectiveValues(entry: Entry, touched: FieldValues, globals: Globals): FieldValues {
  const values = defaultValues(entry.fields)
  for (const field of entry.fields) {
    if (field.valueType === 'locale') values[field.id] = globals.locale
  }
  return { ...values, ...touched }
}

function localeFieldId(entry: Entry): string | undefined {
  return entry.fields.find((field) => field.valueType === 'locale')?.id
}

export interface Variant {
  key: string
  label: string
  detail: string
  result: RunResult
}

/** The same call in every locale: the "Localization" table. */
export function localeVariants(entry: Entry, values: FieldValues, globals: Globals): Variant[] {
  const id = localeFieldId(entry)
  if (!id) return []
  return localeInfo.map((info: LocaleInfo) => ({
    key: info.code,
    label: info.name,
    detail: info.code,
    result: runExample(entry, { ...values, [id]: info.code }, { noThrow: globals.noThrow }),
  }))
}

const GENDERS = ['masculine', 'feminine', 'neuter'] as const

/**
 * The same call once per grammatical gender, for the locale in use — only
 * for a function with a `gender` option and a locale that has genders.
 */
export function genderVariants(entry: Entry, values: FieldValues, globals: Globals): Variant[] {
  const field = entry.fields.find(
    (candidate) => candidate.arg.kind === 'option' && candidate.arg.key === 'gender',
  )
  const localeId = localeFieldId(entry)
  if (!field || !localeId) return []
  const info = localeInfo.find((candidate) => candidate.code === values[localeId])
  const genders = info?.locale.words.genders
  if (!genders) return []
  return GENDERS.filter((gender) => genders.includes(gender)).map((gender) => ({
    key: gender,
    label: gender,
    detail: gender === info?.locale.words.defaultGender ? 'default' : '',
    result: runExample(entry, { ...values, [field.id]: gender }, { noThrow: globals.noThrow }),
  }))
}

/** Whether any option differs from "unset", so the default result is worth showing beside it. */
export function hasOptionSet(entry: Entry, values: FieldValues): boolean {
  return entry.fields.some((field) => {
    if (field.arg.kind !== 'option') return false
    const value = values[field.id] ?? field.default
    return !(field.omitWhenDefault && String(value) === String(field.default))
  })
}
