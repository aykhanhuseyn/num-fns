// Brand assets live in `site/public/` and are therefore copied verbatim rather
// than hashed, so they are addressed by URL instead of imported. `BASE_URL` is
// `./` (see vite.config.ts), which keeps them resolving under the GitHub Pages
// project subpath as well as at a domain root.
const asset = (file: string): string => `${import.meta.env.BASE_URL}${file}`

export const brand = {
  /** Rounded app mark, transparent corners — sits beside the wordmark. */
  mark: asset('logo.png'),
  /** Wordmark + mark, trimmed and keyed to transparency — the hero heading. */
  lockup: asset('lockup.png'),
  /** Full-bleed 1280x640 lockup on navy — social card and README banner. */
  banner: asset('banner.png'),
}

export const hero = {
  title: 'num-fns',
  tagline: 'Number utilities for JavaScript & TypeScript — like date-fns, but for numbers.',
  description:
    "Format and parse numbers, money and percentages; spell numbers out in words; ordinals, short/long notation, roman numerals, decimal-safe arithmetic (0.1 + 0.2 is 0.3), statistics and financial helpers. Every integer-domain function also takes a bigint and every parser can return one ({ output: 'bigint' }), exact past Number.MAX_SAFE_INTEGER. No Intl anywhere, so the output is identical on every runtime. Bad input throws by default; setConfig({ noThrow: true }) returns an empty value instead. Pure, tree-shakeable, written in TypeScript.",
  statusNote:
    'Pre-release: the locale system is implemented — az, en, ru, and es are all wired into numberToWords, ordinals, notation, and money/percentage formatting. The default locale is en; pass { locale: az } (or ru/es) on any function card below to see it live. The engine below calls the real, published source in this repo — nothing on this page is mocked.',
}

export const install = {
  bun: 'bun add num-fns',
  npm: 'npm install num-fns',
}

export const usageSnippet = `import { formatNumber, numberToWords, formatMoney, parseNumber, toRoman } from 'num-fns'
import { az } from 'num-fns/locale'

formatNumber(1234567.89, { decimals: 2 }); // "1,234,567.89"
numberToWords(1234); // "one thousand two hundred thirty-four"
formatMoney(1234.5); // "$ 1,234.50"
formatMoney(1234.5, { currency: 'EUR' }); // "€ 1,234.50"
toRoman(1994); // "MCMXCIV"

// pass a locale for anything locale-dependent — az remains fully supported
numberToWords(1234, { locale: az }); // "min iki yüz otuz dörd"
formatMoney(1234.5, { locale: az }); // "1 234,50 ₼"
formatMoney(1234.5, { locale: az, currency: 'USD' }); // "1 234,50 $"

// bigint in, bigint out — exact past Number.MAX_SAFE_INTEGER
formatNumber(1234567890123456789n); // "1,234,567,890,123,456,789"
parseNumber('1,234,567,890,123,456,789', { output: 'bigint' }); // 1234567890123456789n

// bad input throws; opt out per call, or globally with setConfig
formatNumber(Number.NaN, { noThrow: true }); // ""
formatNumber(Number.POSITIVE_INFINITY, { noThrow: true }); // "infinity"`

export const badges = [
  'MIT licensed',
  'Bun + TypeScript',
  'ESM & CJS',
  'Zero dependencies',
  'bigint in & out',
  'No Intl',
]
