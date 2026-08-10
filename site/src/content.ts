export const hero = {
  title: 'num-fns',
  tagline: 'Number utilities for JavaScript & TypeScript — like date-fns, but for numbers.',
  description:
    'Format and parse numbers, money and percentages; spell numbers out in words; ordinals, short/long notation, roman numerals, arithmetic, statistics and financial helpers. Pure, immutable, tree-shakeable, written in TypeScript.',
  statusNote:
    'Pre-release: every function on this page is currently Azerbaijani-only. The engine below calls the real, published source in this repo — nothing on this page is mocked.',
}

export const install = {
  bun: 'bun add num-fns',
  npm: 'npm install num-fns',
}

export const usageSnippet = `import { formatNumber, numberToWords, formatMoney, toRoman } from 'num-fns'

formatNumber(1234567.89, { decimals: 2 }); // "1 234 567,89"
numberToWords(1234); // "min iki yüz otuz dörd"
formatMoney(1234.5); // "1 234,50 ₼"
toRoman(1994); // "MCMXCIV"`

export const badges = ['MIT licensed', 'Bun + TypeScript', 'ESM & CJS', 'Zero dependencies']
