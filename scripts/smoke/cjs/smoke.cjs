// CJS consumer of the packed tarball: `require` the package root and a locale
// subpath. This is the half that the `exports` map's `require` condition and
// the `.cjs` build outputs exist for, and the half a bundler-only test would
// never touch.
const assert = require('node:assert')
const { formatMoney, formatNumber, mean, numberToWords, parseNumber, toRoman } = require('num-fns')
const { az } = require('num-fns/locale/az')
const { en, ru } = require('num-fns/locale')

assert.strictEqual(formatNumber(1234567.891), '1,234,567.891')
assert.strictEqual(formatNumber(1234567.891, { locale: az }), '1 234 567,891')
assert.strictEqual(parseNumber('1,234,567.891'), 1234567.891)
assert.strictEqual(numberToWords(1234), 'one thousand two hundred thirty-four')
assert.strictEqual(numberToWords(1234, { locale: az }), 'min iki yüz otuz dörd')
assert.strictEqual(numberToWords(1234, { locale: ru }), 'одна тысяча двести тридцать четыре')
assert.strictEqual(formatMoney(1234.5), '$ 1,234.50')
assert.strictEqual(toRoman(2026), 'MMXXVI')
assert.strictEqual(mean([1, 2, 3, 4]), 2.5)

assert.strictEqual(en.code, 'en')
assert.strictEqual(az.code, 'az')

// `module.exports` must be a plain namespace object, not an ESM-interop
// wrapper: a stray `default` key here means a CJS consumer would have to write
// `require('num-fns').default.formatNumber`.
const root = require('num-fns')
assert.strictEqual(root.default, undefined)
assert.strictEqual(typeof root.formatNumber, 'function')

assert.throws(() => toRoman(0), RangeError)
assert.throws(() => parseNumber('not a number'), SyntaxError)

console.log('cjs ok')
