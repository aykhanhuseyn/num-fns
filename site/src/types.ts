/** Which HTML control a field renders as. */
type FieldKind = 'number' | 'text' | 'select' | 'boolean'

/**
 * How a field's raw control value is coerced before being passed to the real
 * function. `'locale'` is special: the control's raw value is a locale code
 * string (`'az'`/`'en'`/`'ru'`/`'es'`, driving a `select`), but the value
 * actually passed to the real function is the corresponding `Locale` object
 * from `src/locale/` — see `engine.ts`'s `coerceValue` and `toLiteral`.
 * `'bigint'` reads the control's text with `BigInt(...)` (exact at any
 * magnitude, whole numbers only) and renders as a `123n` literal in the
 * snippet; no field declares it statically today — it is what a
 * {@link FieldDef.bigIntToggle} switches a `'number'` field to.
 */
export type ValueType = 'number' | 'string' | 'boolean' | 'numberArray' | 'locale' | 'bigint'

interface SelectOption {
  value: string
  label: string
}

/**
 * Where a field's value lands in the real function call: a positional
 * argument, a key on the trailing options object, or nowhere — a `'meta'`
 * field is a playground-only control that changes how *another* field is
 * coerced (see {@link FieldDef.bigIntToggle}) and never reaches the call.
 */
type FieldArg =
  | { kind: 'positional'; index: number }
  | { kind: 'option'; key: string }
  | { kind: 'meta' }

export interface FieldDef {
  /** Unique within its example; used as the form-state key. */
  id: string
  label: string
  kind: FieldKind
  valueType: ValueType
  /** Initial value shown in the control, and (for option fields) the value that gets omitted from the call when unchanged. */
  default: string | number | boolean
  arg: FieldArg
  selectOptions?: SelectOption[]
  step?: string
  placeholder?: string
  /**
   * For option fields only: drop this key from the call when its current
   * value equals `default`, letting the real function apply its own default
   * instead. Use only when `default` is a sentinel for "unset" (e.g. an
   * empty string standing in for a locale-dependent default) — for every
   * other field `default` is just the form's initial value and should
   * always be sent explicitly. See `engine.ts`'s `isOmittedWhenDefault`.
   */
  omitWhenDefault?: boolean
  /**
   * For `'number'` fields whose real function accepts `number | bigint`: the
   * id of a `{ kind: 'meta' }` boolean field on the same example. While that
   * checkbox is ticked, this field's text is coerced with `BigInt(...)`
   * instead of `Number(...)` and shown as `123n` in the snippet, so the same
   * control demonstrates the exact `bigint` path (paste a value beyond
   * `Number.MAX_SAFE_INTEGER`, e.g. `1234567890123456789`) without a second
   * card. See `engine.ts`'s `effectiveValueType`.
   */
  bigIntToggle?: string
}

/** Every real num-fns export is untyped here so one generic engine can drive all of them — see `engine.ts`. */
export type PlaygroundFn = (...args: unknown[]) => unknown

export interface FunctionExample {
  id: string
  name: string
  signature: string
  description: string
  /** Repo-relative path shown as a "View source" link. */
  sourceFile: string
  fields: FieldDef[]
  fn: PlaygroundFn
}

export interface Category {
  id: string
  title: string
  description: string
  examples: FunctionExample[]
}
