// CJS consumer of the packed tarball: `require` the package root and a locale
// subpath. This is the half that the `exports` map's `require` condition and
// the `.cjs` build outputs exist for, and the half a bundler-only test would
// never touch.
const assert = require('node:assert')
const {
  add,
  formatMoney,
  formatNumber,
  mean,
  numberToWords,
  parseNumber,
  round,
  toRoman,
} = require('num-fns')
const { az } = require('num-fns/locale/az')
const { en, ru } = require('num-fns/locale')
const { enGB } = require('num-fns/locale/en-gb')

assert.strictEqual(formatNumber(1234567.891), '1,234,567.891')
assert.strictEqual(formatNumber(1234567.891, { locale: az }), '1 234 567,891')
assert.strictEqual(parseNumber('1,234,567.891'), 1234567.891)
assert.strictEqual(numberToWords(1234), 'one thousand two hundred thirty-four')
assert.strictEqual(numberToWords(1234, { locale: az }), 'min iki yüz otuz dörd')
assert.strictEqual(numberToWords(1234, { locale: ru }), 'одна тысяча двести тридцать четыре')
assert.strictEqual(
  numberToWords(1234, { locale: enGB }),
  'one thousand two hundred and thirty-four',
)
assert.strictEqual(formatMoney(1234.5), '$ 1,234.50')
assert.strictEqual(toRoman(2026), 'MMXXVI')
assert.strictEqual(mean([1, 2, 3, 4]), 2.5)
// The decimal-safe arithmetic runs on BigInt reached through the `BigInt()`
// constructor (the ES2018 build can't carry `10n` literals) — check that the
// shipped bundle actually does the exact arithmetic on this Node.
assert.strictEqual(add(0.1, 0.2), 0.3)
assert.strictEqual(round(1.005, 2), 1.01)

assert.strictEqual(en.code, 'en')
assert.strictEqual(az.code, 'az')
assert.strictEqual(enGB.code, 'en-GB')

// `module.exports` must be a plain namespace object, not an ESM-interop
// wrapper: a stray `default` key here means a CJS consumer would have to write
// `require('num-fns').default.formatNumber`.
const root = require('num-fns')
assert.strictEqual(root.default, undefined)
assert.strictEqual(typeof root.formatNumber, 'function')

assert.throws(() => toRoman(0), RangeError)
assert.throws(() => parseNumber('not a number'), SyntaxError)

console.log('cjs ok')
