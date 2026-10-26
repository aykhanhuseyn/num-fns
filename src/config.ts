// Decision record: todo.md §4, the 2026-09-20 "global config" decision.

/**
 * The package-wide configuration object.
 *
 * Every public function throws on bad input by default — that is the
 * package's oldest rule and it is what `noThrow: false` means. Turning
 * `noThrow` on swaps every throw for an empty value, for callers who would
 * rather render nothing than wrap each call in a `try`. See
 * {@link NumFnsConfig.noThrow} for exactly what "empty" means per return
 * type.
 *
 * The configuration is module-global and mutable, so it is a decision an
 * application makes once at startup rather than something a library should
 * change underneath its own callers. Functions that take an options object
 * also accept a per-call `noThrow`, which wins over the global value;
 * functions with positional-only parameters (`add`, `round`, `clamp`,
 * `isEven`, …) follow the global value alone.
 */

/**
 * The shape of the package-wide configuration. Read it with
 * {@link getConfig}, change it with {@link setConfig}.
 *
 * @since 0.6.0
 */
export interface NumFnsConfig {
  /**
   * Whether every public function should return an empty value instead of
   * throwing. `false` by default, which is the behaviour every version
   * before this one had.
   *
   * With `noThrow: true`, *every* error a public function would raise —
   * a `NaN`/`null`/`undefined` value, a non-finite value, an unparseable
   * string, an out-of-domain value, and equally a mistyped option, an
   * unknown currency code or a separator clash — becomes an empty value
   * instead:
   *
   * - string-returning functions return `''`, except for `Infinity` and
   *   `-Infinity`, which render as the locale's `words.infinity` (prefixed
   *   with `words.negative` when negative);
   * - number-returning functions return `NaN`, including the parsers asked
   *   for `{ output: 'bigint' }` — a `bigint` has no empty value, so the
   *   static type is not accurate in this mode;
   * - boolean-returning functions (`isEven`, `isOdd`, `inRange`) return
   *   `false`;
   * - `mode` and `amortizationSchedule` return `[]`, and `getCurrency`
   *   returns `undefined` (again a type the signature does not admit).
   *
   * Because it hides genuine programming mistakes as readily as bad data,
   * prefer the per-call `noThrow` option on the calls that render
   * user-supplied values, and leave the global value `false`.
   */
  noThrow: boolean
}

/**
 * The `noThrow` option every options object accepts, overriding the
 * package-wide `noThrow` setting ({@link setConfig}) for a single call.
 *
 * Functions whose parameters are all positional (`add`, `round`, `clamp`,
 * `isEven`, `toBase`, the `stats` and `financial` helpers with no options
 * object) have nowhere to put it and follow the global setting alone.
 *
 * @since 0.6.0
 */
export interface NoThrowOptions {
  /**
   * Return this function's empty value instead of throwing — `''` for a
   * string, `NaN` for a number, `false` for a boolean, `[]` for a list. An
   * infinite value renders as the locale's `words.infinity` rather than
   * `''`. Defaults to the package-wide setting (`setConfig`), itself
   * `false`.
   */
  noThrow?: boolean
}

/** The configuration a fresh import starts with, and what {@link resetConfig} restores. */
const DEFAULTS: Readonly<NumFnsConfig> = { noThrow: false }

let active: NumFnsConfig = { ...DEFAULTS }

/**
 * Returns a copy of the current configuration.
 *
 * Mutating the returned object changes nothing — pass a partial to
 * {@link setConfig} instead.
 *
 * @example
 * getConfig().noThrow; // false
 *
 * @returns A new object with the current configuration values.
 * @throws Never. It only copies the current values.
 * @since 0.6.0
 */
export function getConfig(): NumFnsConfig {
  return { ...active }
}

/**
 * Changes the package-wide configuration.
 *
 * Merges `partial` into the package-wide configuration and returns the
 * result; a key left out, or explicitly `undefined`, keeps its current
 * value. Unlike the rest of the package this always throws on a bad value,
 * `noThrow` included: a mistyped configuration is a programming error that
 * no runtime fallback can make sensible.
 *
 * @example
 * setConfig({ noThrow: true });
 * formatNumber(Number.NaN); // ""
 *
 * @param partial - The keys to change. A key left out, or `undefined`, keeps
 * its current value.
 * @returns A copy of the configuration after the change.
 * @throws {TypeError} When a known key is given a value of the wrong type.
 * The `noThrow` setting does not suppress this error.
 * @since 0.6.0
 */
export function setConfig(partial: Partial<NumFnsConfig>): NumFnsConfig {
  if (partial.noThrow === undefined) return getConfig()
  if (typeof partial.noThrow !== 'boolean') {
    throw new TypeError(`setConfig: noThrow must be a boolean, received ${typeof partial.noThrow}`)
  }
  active = { ...active, noThrow: partial.noThrow }
  return getConfig()
}

/**
 * Restores the default configuration.
 *
 * Restores the shipped defaults (`noThrow: false`) and returns them. Mostly
 * useful in tests, so one suite's configuration cannot leak into the next.
 *
 * @example
 * resetConfig(); // { noThrow: false }
 *
 * @returns A copy of the default configuration.
 * @throws Never.
 * @since 0.6.0
 */
export function resetConfig(): NumFnsConfig {
  active = { ...DEFAULTS }
  return getConfig()
}
