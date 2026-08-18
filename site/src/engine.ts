import { localeByCode } from './locales'
import type { FieldDef, FunctionExample } from './types'

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
 * Coerces a field's raw control value into what the real function call
 * needs. `'locale'` fields are the odd one out: the control holds a locale
 * code string (`'az'`, `'en'`, ...), but the real function needs the actual
 * `Locale` object that code names — resolved here via `localeByCode` so
 * every other layer (`buildCallPlan`, `runExample`) can stay agnostic to the
 * distinction and just call `example.fn(...args)`.
 */
function coerceValue(field: FieldDef, raw: string | number | boolean): unknown {
  if (field.valueType === 'number') return typeof raw === 'number' ? raw : Number(raw)
  if (field.valueType === 'boolean') return typeof raw === 'boolean' ? raw : raw === 'true'
  if (field.valueType === 'numberArray') return parseNumberArray(String(raw))
  if (field.valueType === 'locale') return localeByCode[String(raw)] ?? localeByCode.en
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
 */
function toLiteral(field: FieldDef, raw: string | number | boolean, value: unknown): string {
  if (field.valueType === 'locale') return String(raw)
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(String).join(', ')}]`
  return String(value)
}

interface CallPlan {
  args: unknown[]
  literals: string[]
}

/**
 * Turns the current form state into a real argument list. Positional fields
 * always contribute their current value (so trailing optional positionals
 * like `toOrdinal`'s `separator` still show explicitly). Option fields
 * always contribute their current value too, unless marked
 * `omitWhenDefault` (see {@link isOmittedWhenDefault}).
 */
function buildCallPlan(fields: readonly FieldDef[], values: FieldValues): CallPlan {
  const positionalFields = fields
    .filter((field) => field.arg.kind === 'positional')
    .sort((a, b) => {
      const indexA = a.arg.kind === 'positional' ? a.arg.index : 0
      const indexB = b.arg.kind === 'positional' ? b.arg.index : 0
      return indexA - indexB
    })

  const positionals: unknown[] = []
  const positionalLiterals: string[] = []
  for (const field of positionalFields) {
    if (field.arg.kind !== 'positional') continue
    const raw = values[field.id] ?? field.default
    const value = coerceValue(field, raw)
    positionals[field.arg.index] = value
    positionalLiterals[field.arg.index] = toLiteral(field, raw, value)
  }

  const optionEntries: string[] = []
  const optionsObject: Record<string, unknown> = {}
  for (const field of fields) {
    if (field.arg.kind !== 'option') continue
    const raw = values[field.id] ?? field.default
    if (isOmittedWhenDefault(field, raw)) continue
    const value = coerceValue(field, raw)
    optionsObject[field.arg.key] = value
    optionEntries.push(`${field.arg.key}: ${toLiteral(field, raw, value)}`)
  }

  const hasOptions = optionEntries.length > 0
  const args = hasOptions ? [...positionals, optionsObject] : positionals
  const literals = hasOptions
    ? [...positionalLiterals, `{ ${optionEntries.join(', ')} }`]
    : positionalLiterals

  return { args, literals }
}

export interface RunResult {
  ok: boolean
  value?: unknown
  error?: string
}

export function runExample(example: FunctionExample, values: FieldValues): RunResult {
  try {
    const { args } = buildCallPlan(example.fields, values)
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
