// ESM consumer of the packed tarball: `import` from the package root and from
// a locale subpath, exercised on whatever Node version runs this file. Kept to
// syntax the oldest supported Node can parse (no top-level await, no `??=`) so
// a failure here means the *package* is broken, not the fixture.
import assert from 'node:assert'
import { formatMoney, formatNumber, mean, numberToWords, parseNumber, toRoman } from 'num-fns'
import { en, ru } from 'num-fns/locale'
import { az } from 'num-fns/locale/az'

assert.strictEqual(formatNumber(1234567.891), '1,234,567.891')
assert.strictEqual(formatNumber(1234567.891, { locale: az }), '1 234 567,891')
assert.strictEqual(parseNumber('1,234,567.891'), 1234567.891)
assert.strictEqual(numberToWords(1234), 'one thousand two hundred thirty-four')
assert.strictEqual(numberToWords(1234, { locale: az }), 'min iki yüz otuz dörd')
assert.strictEqual(numberToWords(1234, { locale: ru }), 'одна тысяча двести тридцать четыре')
assert.strictEqual(formatMoney(1234.5), '$ 1,234.50')
assert.strictEqual(toRoman(2026), 'MMXXVI')
assert.strictEqual(mean([1, 2, 3, 4]), 2.5)

// Locale objects must be the same shape whether they came from the barrel or
// the per-locale subpath — the two are separate Vite entries, so a bad build
// can genuinely produce one without the other.
assert.strictEqual(en.code, 'en')
assert.strictEqual(az.code, 'az')

// Validation errors have to survive the bundling step as real error types.
assert.throws(() => toRoman(0), RangeError)
assert.throws(() => parseNumber('not a number'), SyntaxError)

console.log('esm ok')
