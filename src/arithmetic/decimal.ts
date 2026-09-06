/**
 * Exact-decimal plumbing behind `add`/`subtract`/`multiply`/`divide`/`round`
 * (`todo.md` §4, "precise arithmetic").
 *
 * The idea: every finite JS number has a shortest decimal string that reads
 * back to exactly that number (`String(0.1)` is `"0.1"`, never
 * `"0.1000000000000000055511151231257827"`). That string is what a caller
 * *means* by the number, so the arithmetic here treats it as the value —
 * `0.1 + 0.2` is `1/10 + 2/10 = 3/10`, and `3/10` reads back as `0.3`. Each
 * operand becomes an integer `digits` and a power-of-ten `scale`
 * (`value = digits × 10^-scale`), the operation runs on the integers with
 * `BigInt` so nothing is ever lost mid-way, and the exact result is converted
 * back with `Number(string)` — which the language guarantees is correctly
 * rounded — rather than by dividing floats.
 *
 * `BigInt` is used through the `BigInt(...)` constructor rather than `10n`
 * literals on purpose: the build targets ES2018 (`vite.config.ts`,
 * `tsconfig.json`), where the literal syntax is a parse error but the global
 * itself (ES2020, present on every supported Node) is just a runtime value.
 *
 * Internal. Nothing here is exported from `src/index.ts` — a consumer sees
 * only the five public functions, which take and return plain numbers per
 * `todo.md` §4's "raw numbers" decision.
 */

/** A finite number written exactly as `digits × 10^-scale`. `scale` may be negative (`1e21` is `{ digits: 1, scale: -21 }`). */
export interface Decimal {
  digits: bigint
  scale: number
}

const ZERO = BigInt(0)
const TEN = BigInt(10)

/** The shapes `String(number)` produces for a finite number: `"15"`, `"-0.25"`, `"1e+21"`, `"1.5e-7"`. */
const DECIMAL_STRING = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/

/** `10^exponent` as a `BigInt`; `exponent` must be a non-negative integer. */
export function pow10(exponent: number): bigint {
  return TEN ** BigInt(exponent)
}

/** Number of decimal digits in `|value|` (`0` has one). */
export function digitCount(value: bigint): number {
  return (value < ZERO ? -value : value).toString().length
}

/**
 * Decomposes a finite number into its exact shortest-decimal form. The
 * caller guarantees finiteness (`assertFinite`); `String()` of a finite
 * number always matches `DECIMAL_STRING`, the destructuring fallback only
 * keeps the types honest.
 */
export function toDecimal(value: number): Decimal {
  const [, sign = '', integer = '0', fraction = '', exponent = '0'] =
    DECIMAL_STRING.exec(String(value)) ?? []
  return {
    digits: BigInt(`${sign}${integer}${fraction}`),
    scale: fraction.length - Number(exponent),
  }
}

/**
 * Converts an exact decimal back to the closest JS number. Goes through
 * `Number("<digits>e<-scale>")` because string-to-number conversion is
 * correctly rounded, whereas `Number(digits) / 10 ** scale` rounds twice.
 * Throws `RangeError` when the exact result is too large for a JS number —
 * a "precise" function never hands back `Infinity`. Never returns `-0`: a
 * negative result too small for a JS number (`-1e-308 / 1e308`) underflows
 * to `-0` in `Number()`, and is normalised to `0` here.
 */
export function fromDecimal(digits: bigint, scale: number, context: string): number {
  const literal = `${digits}e${-scale}`
  const result = Number(literal)
  if (!Number.isFinite(result)) {
    throw new RangeError(
      `${context}: result ${literal} is outside the range of a JavaScript number`,
    )
  }
  return result === 0 ? 0 : result
}

/** Rewrites two decimals over their larger (finer) common scale so their `digits` can be added or compared directly. */
export function alignScales(a: Decimal, b: Decimal): { a: bigint; b: bigint; scale: number } {
  if (a.scale === b.scale) return { a: a.digits, b: b.digits, scale: a.scale }
  if (a.scale > b.scale) {
    return { a: a.digits, b: b.digits * pow10(a.scale - b.scale), scale: a.scale }
  }
  return { a: a.digits * pow10(b.scale - a.scale), b: b.digits, scale: b.scale }
}
