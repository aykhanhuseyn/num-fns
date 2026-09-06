// Type-level consumer under legacy `moduleResolution: node10`, which cannot
// read the `exports` map at all — it finds subpath types through
// `typesVersions` in package.json instead. This fixture exists because that
// map is easy to break silently: nothing else in the repo reads it, and the
// package root would keep resolving (via `types`) even if every subpath entry
// were wrong.
import { formatNumber, numberToWords, parseNumber } from 'num-fns'
import type { Locale } from 'num-fns/locale'
import { en, es, ru } from 'num-fns/locale'
import { az } from 'num-fns/locale/az'
import { enGB } from 'num-fns/locale/en-gb'

const locales: Locale[] = [az, en, enGB, ru, es]

export const formatted: string = formatNumber(1234.5, { locale: locales[0], decimals: 2 })
export const words: string = numberToWords(1234, { locale: az })
export const wordsEnGB: string = numberToWords(1234, { locale: enGB })

// BigInt in and out: the widened `number | bigint` parameters and the parser
// overloads have to survive the `.d.ts`/`.d.cts` emit. `BigInt(...)` calls
// only — a `1n` literal needs target >= ES2020 in every consumer, and the
// shipped declarations must not force that on anyone.
export const big: string = formatNumber(BigInt(1))
export const asBigInt: bigint = parseNumber('1', { output: 'bigint' })
export const asNumber: number = parseNumber('1')
export const asNumberExplicit: number = parseNumber('1', { output: 'number' })

// @ts-expect-error — the `'bigint'` overload returns `bigint`, which is not
// assignable to `number`; if this compiles, the overloads collapsed to a union.
export const notANumber: number = parseNumber('1', { output: 'bigint' })
