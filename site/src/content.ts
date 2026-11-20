// Text shared by the landing and docs pages.

export const hero = {
  title: 'num-fns',
  tagline: 'Number utilities for JavaScript and TypeScript. Like date-fns, but for numbers.',
  description:
    'Format and parse numbers, money and percentages. Spell numbers in words, with grammatical gender. Ordinals, short and long notation, roman numerals, byte sizes, exact decimal arithmetic, statistics and financial helpers.',
}

export const install = {
  npm: 'npm install num-fns',
  bun: 'bun add num-fns',
  pnpm: 'pnpm add num-fns',
  yarn: 'yarn add num-fns',
}

export const usageSnippet = `import { formatNumber, numberToWords, formatMoney, parseNumber, toRoman } from 'num-fns'
import { az } from 'num-fns/locale'

formatNumber(1234567.89, { decimals: 2 }); // "1,234,567.89"
numberToWords(1234); // "one thousand two hundred thirty-four"
formatMoney(1234.5); // "$1,234.50"
formatMoney(1234.5, { currency: 'EUR' }); // "€1,234.50"
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
  'Zero dependencies',
  'No Intl',
  'ESM + CJS',
  'TypeScript',
  'bigint in and out',
  'Tree-shakeable',
]
