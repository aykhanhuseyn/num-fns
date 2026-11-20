import { type ReactNode, useState } from 'react'

/** Comments, strings and a few keywords: enough colour to read a snippet, not a full grammar. */
const TOKEN =
  /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|\b(import|from|const|let|export)\b/g

function highlight(code: string): ReactNode[] {
  const parts: ReactNode[] = []
  let last = 0
  for (const match of code.matchAll(TOKEN)) {
    const index = match.index ?? 0
    if (index > last) parts.push(code.slice(last, index))
    const [text, comment, string] = match
    const className = comment ? 'tok-comment' : string ? 'tok-string' : 'tok-keyword'
    parts.push(
      <span key={index} className={className}>
        {text}
      </span>,
    )
    last = index + text.length
  }
  if (last < code.length) parts.push(code.slice(last))
  return parts
}

export function CopyButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied',
}: {
  text: string
  label?: string
  copiedLabel?: string
}): ReactNode {
  const [copied, setCopied] = useState(false)
  const copy = (): void => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    })
  }
  return (
    <button type="button" className="btn btn-sm btn-ghost" onClick={copy}>
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  )
}

export function CodeBlock({
  code,
  title,
  copy = true,
  wrap = false,
}: {
  code: string
  title?: string
  copy?: boolean
  /** Wrap long lines instead of scrolling: for short programs whose last line carries a result. */
  wrap?: boolean
}): ReactNode {
  return (
    <div className={wrap ? 'code code-wrap' : 'code'}>
      {(title || copy) && (
        <div className="code-head">
          <span>{title}</span>
          {copy && <CopyButton text={code} />}
        </div>
      )}
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be reachable by keyboard. */}
      <pre tabIndex={0}>
        <code>{highlight(code)}</code>
      </pre>
    </div>
  )
}
