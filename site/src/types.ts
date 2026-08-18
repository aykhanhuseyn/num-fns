/** Which HTML control a field renders as. */
type FieldKind = 'number' | 'text' | 'select' | 'boolean'

/**
 * How a field's raw control value is coerced before being passed to the real
 * function. `'locale'` is special: the control's raw value is a locale code
 * string (`'az'`/`'en'`/`'ru'`/`'es'`, driving a `select`), but the value
 * actually passed to the real function is the corresponding `Locale` object
 * from `src/locale/` — see `engine.ts`'s `coerceValue` and `toLiteral`.
 */
type ValueType = 'number' | 'string' | 'boolean' | 'numberArray' | 'locale'

interface SelectOption {
  value: string
  label: string
}

/** Where a field's value lands in the real function call: a positional argument, or a key on the trailing options object. */
type FieldArg = { kind: 'positional'; index: number } | { kind: 'option'; key: string }

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
