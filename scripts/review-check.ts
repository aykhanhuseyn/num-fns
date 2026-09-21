#!/usr/bin/env bun
/**
 * Replays a native-speaker review (see `site/review.html`) against the current
 * locale source, so a correction that arrived weeks ago can be applied without
 * re-deriving what it referred to.
 *
 * For every correction carrying a `path`, it resolves that path against the
 * live `Locale` object and checks the `current` value the reviewer saw is still
 * what the source says. A mismatch means the entry changed since the review —
 * the one failure mode that silently turns a good correction into a regression,
 * and the reason this script exists rather than a hand-applied table.
 *
 * Input is either the JSON the review page downloads, or a whole GitHub issue
 * body pasted to a file — the fenced ```json block is extracted either way.
 *
 * Usage:
 *   bun scripts/review-check.ts <file>      # file, or '-' for stdin
 *   bun run review:check <file>
 *
 * Exit code is non-zero when any correction no longer applies cleanly, so this
 * can gate a release.
 */

import { readFileSync } from 'node:fs'
import { az, en, enGB, es, ru } from '../src/locale/index'
import type { Locale } from '../src/locale/types'

const LOCALES: Readonly<Record<string, Locale>> = { az, en, enGB, ru, es }

/** The review page's payload shape (`site/src/review/report.ts`). */
const SCHEMA = 'num-fns-locale-review/1'

/** Where each locale's fields live, for the "edit this file" line. */
const SOURCE_FILES: Readonly<Record<string, string>> = {
  az: 'src/locale/az.ts',
  en: 'src/locale/en.ts',
  enGB: 'src/locale/en-gb.ts',
  ru: 'src/locale/ru.ts',
  es: 'src/locale/es.ts',
}

const FENCED_JSON = /```json\s*([\s\S]*?)```/

interface Correction {
  id: string
  section: string
  label: string
  kind: 'value' | 'output'
  path?: string
  current: string
  suggested: string
  note?: string
}

interface ReviewPatch {
  schema: string
  locale: string
  packageVersion?: string
  reviewer?: string
  reviewedAt?: string
  corrections: Correction[]
}

function readInput(source: string): string {
  return source === '-' ? readFileSync(0, 'utf8') : readFileSync(source, 'utf8')
}

/** Accepts the raw download or a pasted issue body with the payload in a fenced block. */
function extractPatch(raw: string): ReviewPatch {
  const fenced = FENCED_JSON.exec(raw)
  const text = fenced?.[1] ?? raw
  const parsed = JSON.parse(text) as ReviewPatch
  if (parsed.schema !== SCHEMA) {
    throw new Error(`review-check: expected schema '${SCHEMA}', got '${String(parsed.schema)}'`)
  }
  if (!Array.isArray(parsed.corrections)) {
    throw new Error('review-check: payload has no `corrections` array')
  }
  return parsed
}

/** Walks a dotted path (`currency.units.RUB.minor.plurals.many`) into a locale object. */
function resolvePath(root: Locale, path: string): unknown {
  let node: unknown = root
  for (const segment of path.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[segment]
  }
  return node
}

type Status = 'apply' | 'drifted' | 'missing' | 'manual' | 'empty'

interface Result {
  status: Status
  correction: Correction
  live?: string
}

function checkCorrection(locale: Locale, correction: Correction): Result {
  if (correction.suggested.trim() === '') return { status: 'empty', correction }
  if (!correction.path) return { status: 'manual', correction }

  const live = resolvePath(locale, correction.path)
  if (live === undefined) return { status: 'missing', correction }

  const liveText = String(live)
  if (liveText !== correction.current) return { status: 'drifted', correction, live: liveText }
  return { status: 'apply', correction, live: liveText }
}

const LABELS: Readonly<Record<Status, string>> = {
  apply: '✅ apply',
  drifted: '⚠️  drifted',
  missing: '❌ no such field',
  manual: '📝 by hand',
  empty: '💬 comment only',
}

function describe(result: Result, sourceFile: string): string {
  const { correction } = result
  const head = `${LABELS[result.status]}  ${correction.path ?? correction.label}`
  const lines = [head]

  if (result.status === 'apply') {
    lines.push(
      `    ${sourceFile}: ${JSON.stringify(correction.current)} → ${JSON.stringify(correction.suggested)}`,
    )
  } else if (result.status === 'drifted') {
    lines.push(
      `    reviewer saw ${JSON.stringify(correction.current)}, source now says ${JSON.stringify(result.live)}`,
      '    re-confirm with the reviewer before changing anything',
    )
  } else if (result.status === 'missing') {
    lines.push('    the field was renamed or removed since this review')
  } else if (result.status === 'manual') {
    lines.push(
      `    composed output — "${correction.current}" should read "${correction.suggested}"`,
      '    find which word or composer produces it; there is no single field to swap',
    )
  } else {
    lines.push(`    flagged with no replacement: ${correction.note ?? '(no note)'}`)
  }

  if (correction.note && result.status !== 'empty') lines.push(`    note: ${correction.note}`)
  return lines.join('\n')
}

function main(): void {
  const source = process.argv[2]
  if (!source) {
    console.error('Usage: bun scripts/review-check.ts <file.json | - >')
    process.exit(2)
  }

  const patch = extractPatch(readInput(source))
  const locale = LOCALES[patch.locale]
  if (!locale) {
    console.error(`review-check: unknown locale '${patch.locale}'`)
    process.exit(2)
  }
  const sourceFile = SOURCE_FILES[patch.locale] ?? `src/locale/${patch.locale}.ts`

  console.log(
    `Locale review: ${patch.locale} · ${patch.corrections.length} correction(s)` +
      (patch.packageVersion ? ` · reviewed against ${patch.packageVersion}` : '') +
      (patch.reviewer ? ` · by ${patch.reviewer}` : ''),
  )
  console.log(`Source file: ${sourceFile}\n`)

  const results = patch.corrections.map((correction) => checkCorrection(locale, correction))
  for (const result of results) console.log(`${describe(result, sourceFile)}\n`)

  const counts = results.reduce<Record<string, number>>((tally, result) => {
    tally[result.status] = (tally[result.status] ?? 0) + 1
    return tally
  }, {})
  console.log(
    Object.entries(counts)
      .map(([status, count]) => `${count} ${status}`)
      .join(' · '),
  )

  const blocked = results.filter(
    (result) => result.status === 'drifted' || result.status === 'missing',
  ).length
  if (blocked > 0) {
    console.error(
      `\n${blocked} correction(s) no longer match the source — resolve before applying.`,
    )
    process.exit(1)
  }
}

main()
