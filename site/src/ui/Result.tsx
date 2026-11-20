import type { ReactNode } from 'react'
import { describeValue, formatScalar, type RunResult, typeName } from '../engine'

function cell(value: unknown): string {
  // Schedules carry long binary fractions; two places are enough to read a row.
  return typeof value === 'number' && !Number.isInteger(value)
    ? String(Math.round(value * 100) / 100)
    : formatScalar(value)
}

function RowsTable({
  rows,
  caption,
}: {
  rows: Record<string, unknown>[]
  caption: string
}): ReactNode {
  const keys = rows[0] ? Object.keys(rows[0]) : []
  return (
    <div className="table-wrap result-table">
      <table>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {keys.map((key) => (
              <th key={key} scope="col">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rows have no identity besides their order.
            <tr key={index}>
              {keys.map((key) => (
                <td key={key}>{cell(row[key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** A call's value (with its JavaScript type) or the error it threw. */
export function ResultView({
  result,
  caption = 'Result',
}: {
  result: RunResult
  caption?: string
}): ReactNode {
  if (!result.ok) {
    return (
      <div className="result result-is-error">
        <span className="result-type">throws</span>
        <code className="result-error">{result.error}</code>
      </div>
    )
  }
  const { value } = result
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
    return <RowsTable rows={value as Record<string, unknown>[]} caption={caption} />
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return <RowsTable rows={[value as Record<string, unknown>]} caption={caption} />
  }
  const empty = value === '' || (typeof value === 'number' && Number.isNaN(value))
  return (
    <div className="result">
      <span className="result-type">{typeName(value)}</span>
      <code className="result-value">{describeValue(value)}</code>
      {empty && <span className="result-note">empty value (noThrow)</span>}
    </div>
  )
}

/** A result as one line of text, for tables and code comments. */
export function resultText(result: RunResult): string {
  return result.ok ? describeValue(result.value) : `throws ${result.error ?? ''}`
}
