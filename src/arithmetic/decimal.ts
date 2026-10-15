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
 * a "precise" function never hands back `Infinity`.
 *
 * A zero result keeps its sign (the 2026-09-20 "`-0` is a value" decision).
 * Two things can make it negative: the exact result underflowed from a
 * negative value (`-1e-308 / 1e308`), which `digits < 0` already records, or
 * the exact digits are zero but IEEE 754 says the sign is negative
 * (`multiply(-1, 0)`), which only the caller knows — hence `negativeZero`.
 */
export function fromDecimal(
  digits: bigint,
  scale: number,
  context: string,
  negativeZero = false,
): number {
  const literal = `${digits}e${-scale}`
  const result = Number(literal)
  if (!Number.isFinite(result)) {
    throw new RangeError(
      `${context}: result ${literal} is outside the range of a JavaScript number`,
    )
  }
  if (result !== 0) return result
  return digits < ZERO || negativeZero ? -0 : 0
}

/**
 * How many significant digits of a quotient are carried before it is
 * converted back to a JavaScript number. A number holds at most 17, so
 * anything beyond ~20 only matters for deciding which way a near-tie falls;
 * 25 leaves a wide margin without making the `BigInt` division noticeably
 * slower.
 */
export const QUOTIENT_DIGITS = 25

/**
 * The exact sum of `values`, each read at its shortest decimal, as one
 * decimal. Nothing is rounded on the way: the running total is kept as
 * `BigInt` digits over the finest scale seen so far, so `sum` converts to a
 * number once, at the end, instead of once per element like a `reduce` over
 * `add` would. The caller guarantees every value is finite.
 */
export function sumDecimals(values: readonly number[]): Decimal {
  // Start from the first value rather than `0` at scale 0, so a list of
  // large values (`[1e308, 1e308]`) is not first rewritten over scale 0.
  let total: Decimal = { digits: ZERO, scale: 0 }
  values.forEach((value, index) => {
    total = index === 0 ? toDecimal(value) : addDecimals(total, toDecimal(value))
  })
  return total
}

/** `a + b`, exactly. */
export function addDecimals(a: Decimal, b: Decimal): Decimal {
  const aligned = alignScales(a, b)
  return { digits: aligned.a + aligned.b, scale: aligned.scale }
}

/** `a - b`, exactly. */
export function subtractDecimals(a: Decimal, b: Decimal): Decimal {
  const aligned = alignScales(a, b)
  return { digits: aligned.a - aligned.b, scale: aligned.scale }
}

/** `a × b`, exactly. */
export function multiplyDecimals(a: Decimal, b: Decimal): Decimal {
  return { digits: a.digits * b.digits, scale: a.scale + b.scale }
}

/**
 * `x / y` carried to {@link QUOTIENT_DIGITS} significant digits. The
 * dividend is shifted left until the integer quotient is guaranteed to hold
 * at least that many digits: `|x| ≥ 10^(dx-1)` and `|y| < 10^dy`, so
 * `|x·10^shift / y| > 10^(dx-1+shift-dy) = 10^(QUOTIENT_DIGITS-1)`. A JS
 * number has at most 17 significant digits, so the shift is always positive.
 * The caller guarantees `y.digits` is not zero.
 */
export function divideDecimals(x: Decimal, y: Decimal): Decimal {
  const shift = QUOTIENT_DIGITS + digitCount(y.digits) - digitCount(x.digits)
  return { digits: (x.digits * pow10(shift)) / y.digits, scale: x.scale - y.scale + shift }
}

/** Rewrites two decimals over their larger (finer) common scale so their `digits` can be added or compared directly. */
export function alignScales(a: Decimal, b: Decimal): { a: bigint; b: bigint; scale: number } {
  if (a.scale === b.scale) return { a: a.digits, b: b.digits, scale: a.scale }
  if (a.scale > b.scale) {
    return { a: a.digits, b: b.digits * pow10(a.scale - b.scale), scale: a.scale }
  }
  return { a: a.digits * pow10(b.scale - a.scale), b: b.digits, scale: b.scale }
}
