// Type-level consumer under legacy `moduleResolution: node10`, which cannot
// read the `exports` map at all — it finds subpath types through
// `typesVersions` in package.json instead. This fixture exists because that
// map is easy to break silently: nothing else in the repo reads it, and the
// package root would keep resolving (via `types`) even if every subpath entry
// were wrong.
import { formatNumber, numberToWords } from 'num-fns'
import type { Locale } from 'num-fns/locale'
import { en, es, ru } from 'num-fns/locale'
import { az } from 'num-fns/locale/az'

const locales: Locale[] = [az, en, ru, es]

export const formatted: string = formatNumber(1234.5, { locale: locales[0], decimals: 2 })
export const words: string = numberToWords(1234, { locale: az })
