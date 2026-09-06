// Type-level consumer under `moduleResolution: nodenext` in an ESM package
// (`"type": "module"`), resolving through `exports[...].import.types`.
// `skipLibCheck` is off in this fixture's tsconfig on purpose: the point is to
// compile the shipped `.d.ts` files themselves, not just to reference them.
import {
  formatMoney,
  formatNumber,
  type NumberFormatOptions,
  numberToWords,
  parseNumber,
} from 'num-fns'
import type { Locale } from 'num-fns/locale'
import { en } from 'num-fns/locale'
import { az } from 'num-fns/locale/az'
import { enGB } from 'num-fns/locale/en-gb'

const options: NumberFormatOptions = { locale: az, decimals: 2 }
const locales: Locale[] = [az, en, enGB]

export const formatted: string = formatNumber(1234.5, options)
export const money: string = formatMoney(1234.5, { locale: locales[0] })
export const words: string = numberToWords(1234, { locale: en })
export const wordsEnGB: string = numberToWords(1234, { locale: enGB })

// @ts-expect-error — `locale` takes a Locale object, never a language tag
// string. This was a real regression risk when the old `'az' | 'en'` string
// option was folded into the Locale system.
numberToWords(1234, { locale: 'en' })

// BigInt in and out: the widened `number | bigint` parameters and the parser
// overloads have to survive the `.d.ts`/`.d.cts` emit. `BigInt(...)` calls
// only — a `1n` literal needs target >= ES2020 in every consumer, and the
// shipped declarations must not force that on anyone.
export const big: string = formatNumber(BigInt(1))
export const bigMoney: string = formatMoney(BigInt(1234), { locale: en })
export const asBigInt: bigint = parseNumber('1', { output: 'bigint' })
export const asNumber: number = parseNumber('1')
export const asNumberExplicit: number = parseNumber('1', { output: 'number' })

// @ts-expect-error — the `'bigint'` overload returns `bigint`, which is not
// assignable to `number`; if this compiles, the overloads collapsed to a union.
export const notANumber: number = parseNumber('1', { output: 'bigint' })
