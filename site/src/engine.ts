import { localeByCode } from './locales'
import type { FieldDef, FunctionExample, ValueType } from './types'

export type FieldValues = Record<string, string | number | boolean>

/** Splits a numberArray field's raw text on commas and/or whitespace, e.g. "1, 2  3" -> ["1", "2", "3"]. */
const NUMBER_ARRAY_SPLIT_REGEX = /[,\s]+/

export function defaultValues(fields: readonly FieldDef[]): FieldValues {
  const values: FieldValues = {}
  for (const field of fields) values[field.id] = field.default
  return values
}

function parseNumberArray(raw: string): number[] {
  return raw
    .split(NUMBER_ARRAY_SPLIT_REGEX)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .map((token) => Number(token))
}

/**
 * Reads a control's text as an exact `bigint`. `BigInt(...)` is used rather
 * than a `123n` literal because the site's own source must stay free of
 * BigInt literal syntax (they only appear in the *displayed* snippet, see
 * {@link toLiteral}). The native error for bad input ("Cannot convert 1.5 to
 * a BigInt") is rethrown with the playground's own wording so the card's
 * error box explains what a `bigint` can and cannot hold.
 */
function parseBigInt(raw: string): bigint {
  const text = raw.trim()
  try {
    return BigInt(text)
  } catch {
    throw new SyntaxError(
      `as bigint: ${JSON.stringify(text)} is not a whole number — a bigint has no fraction or exponent, so enter plain digits (e.g. 1234567890123456789)`,
    )
  }
}

/**
 * The value type a field is coerced with *right now*: its declared
 * `valueType`, unless it has a {@link FieldDef.bigIntToggle} and that meta
 * checkbox is currently ticked, in which case `'bigint'`. Kept as the single
 * place cross-field state is consulted, so `coerceValue`/`toLiteral` stay
 * pure functions of one field.
 */
function effectiveValueType(field: FieldDef, values: FieldValues): ValueType {
  if (field.bigIntToggle !== undefined && values[field.bigIntToggle] === true) return 'bigint'
  return field.valueType
}

/**
 * Coerces a field's raw control value into what the real function call
 * needs. `'locale'` fields are the odd one out: the control holds a locale
 * code string (`'az'`, `'en'`, ...), but the real function needs the actual
 * `Locale` object that code names — resolved here via `localeByCode` so
 * every other layer (`buildCallPlan`, `runExample`) can stay agnostic to the
 * distinction and just call `example.fn(...args)`.
 */
function coerceValue(valueType: ValueType, raw: string | number | boolean): unknown {
  if (valueType === 'number') return typeof raw === 'number' ? raw : Number(raw)
  if (valueType === 'bigint') return parseBigInt(String(raw))
  if (valueType === 'boolean') return typeof raw === 'boolean' ? raw : raw === 'true'
  if (valueType === 'numberArray') return parseNumberArray(String(raw))
  if (valueType === 'locale') return localeByCode[String(raw)] ?? localeByCode.en
  return String(raw)
}

/**
 * Whether an option field should be dropped from the call entirely when left
 * at its default — used only for the handful of fields whose default is a
 * sentinel for "let the function pick its own default" (e.g.
 * `toShortNotation`'s locale-dependent `decimalSeparator`, default `''`).
 * Every other field always contributes its current value, even when that
 * value happens to equal `field.default` — `field.default` is just the
 * form's initial value, and for most fields it intentionally differs from
 * the real function's own default (e.g. `formatNumber`'s `decimals` defaults
 * to `2` here so the playground opens on a formatted example, but the real
 * function's default is "keep natural precision"). Omitting those by
 * "unchanged" would silently drop the option and call the real default
 * instead — exactly the bug this comment is here to prevent regressing.
 */
function isOmittedWhenDefault(field: FieldDef, raw: string | number | boolean): boolean {
  return Boolean(field.omitWhenDefault) && String(raw) === String(field.default)
}

/**
 * Renders a field's value as it should appear in the displayed call
 * snippet. `'locale'` fields are special-cased to the bare locale-code
 * identifier (`az`, not `"az"` or a dump of the resolved `Locale` object) —
 * that's how a real caller would write it after
 * `import { az } from 'num-fns/locale'`, and dumping the actual object would
 * be both unreadable (functions like `renderGroup`/`compose` aren't
 * serializable) and misleading about what the caller actually writes.
 * A `bigint` renders as the `123n` literal a caller would write (the
 * snippet is display text, so the literal syntax is right here even though
 * the site's own source avoids it).
 */
function toLiteral(valueType: ValueType, raw: string | number | boolean, value: unknown): string {
  if (valueType === 'locale') return String(raw)
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(formatScalar).join(', ')}]`
  return formatScalar(value)
}

/**
 * `String(value)`, except that a `bigint` keeps its `n` suffix — `String(10n)`
 * is `"10"`, indistinguishable from the number, and the whole point of the
 * bigint cards is to show which type came back. Shared by the snippet
 * (`toLiteral`) and the result box (`render.ts`).
 */
export function formatScalar(value: unknown): string {
  return typeof value === 'bigint' ? `${value}n` : String(value)
}

interface CallPlan {
  args: unknown[]
  literals: string[]
  /**
   * The first coercion failure, if any — today only a `'bigint'` field whose
   * text `BigInt(...)` rejects. Recorded rather than thrown so the snippet
   * can still be built (showing what was typed) while `runExample` reports
   * the error in place of calling the function.
   */
  error?: Error
}

/** One coerced field: the argument value and how it reads in the snippet. */
interface CoercedField {
  value: unknown
  literal: string
  error?: Error
}

function coerceField(field: FieldDef, values: FieldValues): CoercedField {
  const raw = values[field.id] ?? field.default
  const valueType = effectiveValueType(field, values)
  try {
    const value = coerceValue(valueType, raw)
    return { value, literal: toLiteral(valueType, raw, value) }
  } catch (error) {
    // Show the rejected text verbatim so the snippet mirrors the form.
    return {
      value: undefined,
      literal: JSON.stringify(String(raw)),
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Turns the current form state into a real argument list. Positional fields
 * always contribute their current value (so trailing optional positionals
 * like `toOrdinal`'s `separator` still show explicitly). Option fields
 * always contribute their current value too, unless marked
 * `omitWhenDefault` (see {@link isOmittedWhenDefault}). `'meta'` fields
 * (e.g. an "as bigint" toggle) are consulted through
 * {@link effectiveValueType} but never become arguments themselves.
 *
 * The options object is appended after the highest positional index, so an
 * example whose real function takes options as its third parameter
 * (`fromBase(value, radix, { output })`) just declares positionals 0 and 1.
 */
function buildCallPlan(fields: readonly FieldDef[], values: FieldValues): CallPlan {
  const errors: Error[] = []
  const { positionals, positionalLiterals } = planPositionals(fields, values, errors)
  const { optionsObject, optionEntries } = planOptions(fields, values, errors)

  const hasOptions = optionEntries.length > 0
  const args = hasOptions ? [...positionals, optionsObject] : positionals
  const literals = hasOptions
    ? [...positionalLiterals, `{ ${optionEntries.join(', ')} }`]
    : positionalLiterals

  return { args, literals, error: errors[0] }
}

/** The positional half of {@link buildCallPlan}; coercion failures are appended to `errors`. */
function planPositionals(
  fields: readonly FieldDef[],
  values: FieldValues,
  errors: Error[],
): { positionals: unknown[]; positionalLiterals: string[] } {
  const positionals: unknown[] = []
  const positionalLiterals: string[] = []
  for (const field of fields) {
    if (field.arg.kind !== 'positional') continue
    const { value, literal, error } = coerceField(field, values)
    if (error) errors.push(error)
    positionals[field.arg.index] = value
    positionalLiterals[field.arg.index] = literal
  }
  return { positionals, positionalLiterals }
}

/** The trailing-options half of {@link buildCallPlan}; coercion failures are appended to `errors`. */
function planOptions(
  fields: readonly FieldDef[],
  values: FieldValues,
  errors: Error[],
): { optionsObject: Record<string, unknown>; optionEntries: string[] } {
  const optionEntries: string[] = []
  const optionsObject: Record<string, unknown> = {}
  for (const field of fields) {
    if (field.arg.kind !== 'option') continue
    if (isOmittedWhenDefault(field, values[field.id] ?? field.default)) continue
    const { value, literal, error } = coerceField(field, values)
    if (error) errors.push(error)
    optionsObject[field.arg.key] = value
    optionEntries.push(`${field.arg.key}: ${literal}`)
  }
  return { optionsObject, optionEntries }
}

export interface RunResult {
  ok: boolean
  value?: unknown
  error?: string
}

export function runExample(example: FunctionExample, values: FieldValues): RunResult {
  try {
    const { args, error } = buildCallPlan(example.fields, values)
    if (error) throw error
    const value = example.fn(...args)
    return { ok: true, value }
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    return { ok: false, error: message }
  }
}

export function buildSnippet(example: FunctionExample, values: FieldValues): string {
  const { literals } = buildCallPlan(example.fields, values)
  return `${example.name}(${literals.join(', ')})`
}
