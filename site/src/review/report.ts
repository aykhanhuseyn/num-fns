import type { ItemKind, LocaleReview, ReviewItem, Verdicts } from './types'

/**
 * Turns a finished review into the two things the maintainer needs: a table a
 * human can read in the issue, and a fenced JSON block
 * `scripts/review-check.ts` can replay against the source to produce the actual
 * edit. Only *corrections* are enumerated — approvals collapse into the counts,
 * which is both what makes the report readable and what keeps it inside
 * GitHub's URL length limit.
 */

declare const __PKG_VERSION__: string

const REPO_URL = 'https://github.com/aykhanhuseyn/num-fns'

/** GitHub answers 414 somewhere past 8 KB; stay well clear and fall back to the clipboard. */
const URL_BUDGET = 6000

/** Consumed by `scripts/review-check.ts`, which pins the same string. */
const PATCH_SCHEMA = 'num-fns-locale-review/1'

export interface Correction {
  id: string
  section: string
  label: string
  kind: ItemKind
  path?: string
  current: string
  suggested: string
  note?: string
}

export interface ReviewPatch {
  schema: string
  locale: string
  localeTag: string
  packageVersion: string
  reviewer?: string
  reviewedAt: string
  counts: { total: number; reviewed: number; approved: number; corrections: number }
  corrections: Correction[]
}

export function collectCorrections(review: LocaleReview, verdicts: Verdicts): Correction[] {
  const corrections: Correction[] = []
  for (const section of review.sections) {
    for (const item of section.items) {
      const verdict = verdicts[item.id]
      if (verdict?.status !== 'wrong') continue
      corrections.push({
        id: item.id,
        section: section.title,
        label: item.label,
        kind: item.kind,
        ...(item.path ? { path: item.path } : {}),
        current: item.current,
        suggested: verdict.suggestion?.trim() ?? '',
        ...(verdict.note?.trim() ? { note: verdict.note.trim() } : {}),
      })
    }
  }
  return corrections
}

function countReviewed(review: LocaleReview, verdicts: Verdicts): number {
  const ids = new Set(Object.keys(verdicts))
  return review.sections
    .flatMap((section) => section.items)
    .filter((item: ReviewItem) => ids.has(item.id)).length
}

export function buildPatch(
  review: LocaleReview,
  verdicts: Verdicts,
  reviewer: string,
): ReviewPatch {
  const corrections = collectCorrections(review, verdicts)
  const reviewed = countReviewed(review, verdicts)
  return {
    schema: PATCH_SCHEMA,
    locale: review.code,
    localeTag: review.tag,
    packageVersion: typeof __PKG_VERSION__ === 'string' ? __PKG_VERSION__ : 'unknown',
    ...(reviewer.trim() ? { reviewer: reviewer.trim() } : {}),
    reviewedAt: new Date().toISOString(),
    counts: {
      total: review.itemCount,
      reviewed,
      approved: reviewed - corrections.length,
      corrections: corrections.length,
    },
    corrections,
  }
}

/** Hoisted per biome's `useTopLevelRegex`: these run once per correction row. */
const PIPE_REGEX = /\|/g
const NEWLINE_REGEX = /\n/g

/** Escapes a cell so a word containing `|` or a newline cannot break the table. */
function cell(text: string): string {
  const shown = text.trim() === '' ? '(empty)' : text
  return shown.replace(PIPE_REGEX, '\\|').replace(NEWLINE_REGEX, ' ')
}

function correctionRow(correction: Correction): string {
  const target = correction.path ? `\`${correction.path}\`` : `_${cell(correction.label)}_`
  return `| ${target} | ${cell(correction.current)} | **${cell(correction.suggested)}** | ${cell(correction.note ?? '')} |`
}

export function buildIssueTitle(review: LocaleReview, corrections: number): string {
  return `[locale-review:${review.code}] ${corrections} correction${corrections === 1 ? '' : 's'} to ${review.name}`
}

export function buildIssueBody(patch: ReviewPatch, review: LocaleReview): string {
  const { counts } = patch
  const lines = [
    `Native-speaker review of the **${review.name}** (\`${review.code}\`) locale, from the review page at \`site/review.html\`.`,
    '',
    `- Reviewed **${counts.reviewed}** of ${counts.total} entries — ${counts.approved} confirmed correct, **${counts.corrections}** ${counts.corrections === 1 ? 'needs' : 'need'} changing.`,
    `- Reviewed against \`num-fns@${patch.packageVersion}\`.`,
    patch.reviewer ? `- Reviewer: ${patch.reviewer}` : '- Reviewer: (anonymous)',
    '',
  ]

  if (counts.corrections > 0) {
    lines.push(
      '| Field | Current | Should be | Why |',
      '| --- | --- | --- | --- |',
      ...patch.corrections.map(correctionRow),
      '',
    )
  } else {
    lines.push('No corrections — everything reviewed reads correctly. 🎉', '')
  }

  lines.push(
    '<details><summary>Machine-readable patch — <code>bun run review:check &lt;file.json&gt;</code></summary>',
    '',
    '```json',
    JSON.stringify(patch, null, 2),
    '```',
    '',
    '</details>',
  )
  return lines.join('\n')
}

export interface IssueLink {
  /** The prefilled URL, or the bare new-issue URL when the body was too long to carry. */
  url: string
  /** True when the body must be pasted by hand because it exceeded the URL budget. */
  needsPaste: boolean
}

export function buildIssueLink(title: string, body: string): IssueLink {
  const base = `${REPO_URL}/issues/new`
  const full = `${base}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
  if (full.length <= URL_BUDGET) return { url: full, needsPaste: false }
  return {
    url: `${base}?title=${encodeURIComponent(title)}`,
    needsPaste: true,
  }
}
