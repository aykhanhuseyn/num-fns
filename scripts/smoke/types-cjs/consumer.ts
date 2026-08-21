// Type-level consumer under `moduleResolution: nodenext` in a CommonJS
// package (`"type": "commonjs"`), so these `import` statements compile to
// `require` and resolve through `exports[...].require.types` — the `.d.cts`
// twins that `scripts/fix-dist-types.ts` generates.
// `skipLibCheck` is off in this fixture's tsconfig on purpose: the point is to
// compile the shipped `.d.ts` files themselves, not just to reference them.
import { formatMoney, formatNumber, type NumberFormatOptions, numberToWords } from 'num-fns'
import type { Locale } from 'num-fns/locale'
import { en } from 'num-fns/locale'
import { az } from 'num-fns/locale/az'

const options: NumberFormatOptions = { locale: az, decimals: 2 }
const locales: Locale[] = [az, en]

export const formatted: string = formatNumber(1234.5, options)
export const money: string = formatMoney(1234.5, { locale: locales[0] })
export const words: string = numberToWords(1234, { locale: en })

// @ts-expect-error — `locale` takes a Locale object, never a language tag
// string. This was a real regression risk when the old `'az' | 'en'` string
// option was folded into the Locale system.
numberToWords(1234, { locale: 'en' })
