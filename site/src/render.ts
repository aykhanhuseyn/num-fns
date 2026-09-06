import { formatScalar, type RunResult } from './engine'

export function renderResult(container: HTMLElement, result: RunResult): void {
  container.replaceChildren()

  if (!result.ok) {
    const box = document.createElement('div')
    box.className = 'playground-error'
    box.textContent = result.error ?? 'Unknown error'
    container.appendChild(box)
    return
  }

  container.appendChild(renderValue(result.value))
}

function renderValue(value: unknown): HTMLElement {
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      return renderTable(value as Record<string, unknown>[])
    }
    const el = document.createElement('code')
    el.className = 'playground-value'
    el.textContent = `[${value.map(formatScalar).join(', ')}]`
    return el
  }

  if (typeof value === 'boolean') {
    const el = document.createElement('span')
    el.className = `playground-bool ${value ? 'is-true' : 'is-false'}`
    el.textContent = String(value)
    return el
  }

  // `formatScalar` keeps a bigint's `n` suffix (`1234n`), so a parser card
  // with `output: 'bigint'` visibly returns a different type than `1234`.
  // Never `JSON.stringify` here — it throws on bigint.
  const el = document.createElement('code')
  el.className = 'playground-value'
  el.textContent = formatScalar(value)
  return el
}

function renderTable(rows: Record<string, unknown>[]): HTMLElement {
  const table = document.createElement('table')
  table.className = 'playground-table'

  const firstRow = rows[0]
  const keys = firstRow ? Object.keys(firstRow) : []

  const thead = document.createElement('thead')
  const headRow = document.createElement('tr')
  for (const key of keys) {
    const th = document.createElement('th')
    th.textContent = key
    headRow.appendChild(th)
  }
  thead.appendChild(headRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  for (const row of rows) {
    const tr = document.createElement('tr')
    for (const key of keys) {
      const td = document.createElement('td')
      const cell = row[key]
      td.textContent =
        typeof cell === 'number' && !Number.isInteger(cell) ? cell.toFixed(2) : formatScalar(cell)
      tr.appendChild(td)
    }
    tbody.appendChild(tr)
  }
  table.appendChild(tbody)

  return table
}
