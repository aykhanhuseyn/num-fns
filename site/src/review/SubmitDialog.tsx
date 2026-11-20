import { type ReactNode, useEffect, useRef, useState } from 'react'
import { buildIssueBody, buildIssueLink, buildIssueTitle, buildPatch } from './report'
import type { LocaleReview, Verdicts } from './types'
import { reviewFileName, type UiStrings } from './ui'

function downloadPatch(json: string, fileName: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * "Finish and send". A native `<dialog>` opened with `showModal()`, so focus
 * is trapped inside and returns to the opener. Every way out closes it: the ×
 * in the corner, the Close button, Escape, and a click on the dimmed backdrop
 * (the old dialog had only a Close button between the long preview and the
 * actions, which phone users could not find).
 */
export function SubmitDialog({
  open,
  onClose,
  review,
  verdicts,
  reviewer,
  ui,
  onClear,
}: {
  open: boolean
  onClose: () => void
  review: LocaleReview
  verdicts: Verdicts
  reviewer: string
  ui: UiStrings
  onClear: () => void
}): ReactNode {
  const ref = useRef<HTMLDialogElement>(null)
  const [copied, setCopied] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setCopied(false)
      setConfirmClear(false)
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const text = ui.dialog
  const patch = buildPatch(review, verdicts, reviewer)
  const title = buildIssueTitle(review, patch.counts.corrections)
  const body = buildIssueBody(patch, review)
  const link = buildIssueLink(title, body)
  const fileName = reviewFileName(review.code, reviewer, new Date())

  const copy = (): void => {
    void navigator.clipboard?.writeText(body).then(() => setCopied(true))
  }

  return (
    // The dialog handles Escape itself (the `cancel` event); the click
    // handler only catches clicks on the backdrop, outside `.dialog-frame`.
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape closes the dialog natively.
    <dialog
      ref={ref}
      className="dialog rv-dialog"
      aria-labelledby="rv-dialog-title"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="dialog-frame">
          <div className="dialog-head">
            <div>
              <h2 id="rv-dialog-title">{text.heading(patch.counts.corrections, review.name)}</h2>
              <p className="rv-dialog-summary">
                {text.summary(patch.counts.reviewed, patch.counts.total, patch.counts.approved)}
              </p>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label={ui.frame.closeDialog}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="dialog-body">
            <p className="callout">{text.howToSend}</p>
            <p className="rv-send-file">
              <code>{fileName}</code>
            </p>
            <div className="rv-dialog-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => downloadPatch(JSON.stringify(patch, null, 2), fileName)}
              >
                {text.download}
              </button>
              <button type="button" className="btn" onClick={copy}>
                <span aria-live="polite">{copied ? text.copied : text.copy}</span>
              </button>
            </div>

            <p className="rv-send-github">
              <a
                href={link.url}
                target="_blank"
                rel="noopener"
                onClick={() => {
                  if (link.needsPaste) void navigator.clipboard?.writeText(body)
                }}
              >
                {text.github}
              </a>{' '}
              — {text.githubHint}
              {link.needsPaste && ` ${text.tooLong}`}
            </p>

            <details className="rv-preview-wrap">
              <summary>{text.preview}</summary>
              {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be reachable by keyboard. */}
              <pre className="rv-preview" tabIndex={0}>
                {body}
              </pre>
            </details>
          </div>

          <div className="dialog-foot">
            <button
              type="button"
              className={confirmClear ? 'btn rv-danger is-armed' : 'btn rv-danger'}
              onClick={() => {
                if (!confirmClear) {
                  setConfirmClear(true)
                  return
                }
                onClear()
              }}
            >
              {confirmClear ? `${text.clear(review.name)}?` : text.clear(review.name)}
            </button>
            <button type="button" className="btn" onClick={onClose}>
              {text.close}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
