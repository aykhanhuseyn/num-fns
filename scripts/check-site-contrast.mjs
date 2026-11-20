#!/usr/bin/env node
/**
 * Checks the colour contrast of the website's design tokens
 * (`site/src/ui/theme.css`) in both themes, against WCAG 2.1 AA: 4.5:1 for
 * text, 3:1 for borders that carry meaning (focus ring, form control edges).
 *
 * Usage: node scripts/check-site-contrast.mjs
 * Exits non-zero when a pair fails.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(import.meta.dirname, '../site/src/ui/theme.css'), 'utf8')

const TOKEN = /--([\w-]+):\s*(#[0-9a-f]{6})\b/gi

/** Tokens of one block: `:root {` (light) or `:root[data-theme="dark"] {`. */
function tokens(selector) {
  const start = css.indexOf(selector)
  const block = css.slice(start, css.indexOf('}', start))
  return Object.fromEntries([...block.matchAll(TOKEN)].map((match) => [match[1], match[2]]))
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const SURFACES = ['bg', 'surface', 'surface-2', 'card', 'code-bg']
const TEXT = ['text', 'text-dim', 'text-faint', 'link', 'good', 'bad']
const PAIRS = [
  ...TEXT.flatMap((fg) => SURFACES.map((bg) => [fg, bg, 4.5])),
  ['on-accent', 'accent-fill', 4.5],
  ['text', 'accent-soft', 4.5],
  ['text-dim', 'accent-soft', 4.5],
  ['bad', 'bad-soft', 4.5],
  ['good', 'good-soft', 4.5],
  ['warn', 'warn-soft', 4.5],
  ['text', 'bad-soft', 4.5],
  ['text-dim', 'bad-soft', 4.5],
  ...SURFACES.map((bg) => ['focus', bg, 3]),
  ...['bg', 'card'].map((bg) => ['border-strong', bg, 3]),
]

const light = tokens(':root {')
const dark = { ...light, ...tokens(':root[data-theme="dark"] {') }

let failures = 0
for (const [name, theme] of [
  ['light', light],
  ['dark', dark],
]) {
  for (const [fg, bg, min] of PAIRS) {
    const value = ratio(theme[fg], theme[bg])
    if (value < min) {
      failures++
      console.log(`✗ ${name}: --${fg} on --${bg} is ${value.toFixed(2)}:1 (needs ${min}:1)`)
    }
  }
}
console.log(failures === 0 ? `✓ ${PAIRS.length * 2} colour pairs pass WCAG AA` : '')
process.exit(failures === 0 ? 0 : 1)
