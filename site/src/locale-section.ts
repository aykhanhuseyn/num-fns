import { localeStatus } from './locales'

function buildStatusTable(): HTMLElement {
  const table = document.createElement('table')
  table.className = 'locale-status-table'

  const thead = document.createElement('thead')
  const headRow = document.createElement('tr')
  for (const label of ['Locale', 'Code', 'Status']) {
    const th = document.createElement('th')
    th.textContent = label
    headRow.appendChild(th)
  }
  thead.appendChild(headRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  for (const row of localeStatus) {
    const tr = document.createElement('tr')

    const nameCell = document.createElement('td')
    nameCell.textContent = row.name
    tr.appendChild(nameCell)

    const codeCell = document.createElement('td')
    const code = document.createElement('code')
    code.textContent = row.code
    codeCell.appendChild(code)
    tr.appendChild(codeCell)

    const statusCell = document.createElement('td')
    const badge = document.createElement('span')
    badge.className = `locale-badge ${row.status === 'Implemented' ? 'is-live' : 'is-planned'}`
    badge.textContent = row.status
    statusCell.appendChild(badge)
    tr.appendChild(statusCell)

    tbody.appendChild(tr)
  }
  table.appendChild(tbody)

  return table
}

function buildPreview(): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'locale-preview'

  const select = document.createElement('select')
  select.className = 'locale-preview-select'
  for (const row of localeStatus) {
    const option = document.createElement('option')
    option.value = row.code
    option.textContent = `${row.name} (${row.code})`
    select.appendChild(option)
  }
  wrapper.appendChild(select)

  const dataBox = document.createElement('dl')
  dataBox.className = 'locale-data'
  wrapper.appendChild(dataBox)

  function update(): void {
    const row = localeStatus.find((entry) => entry.code === select.value) ?? localeStatus[0]
    if (!row) return
    const { locale } = row

    const entries: [string, string][] = [
      ['code', locale.code],
      ['name', locale.name ?? '—'],
      ['words.zero', locale.words.zero],
      ['words.ones[1..5]', locale.words.ones.slice(1, 6).join(', ')],
      ['words.negative', locale.words.negative],
      ['currency.code', locale.currency.code],
      ['currency.symbol', locale.currency.symbol],
      ['currency.major.word', locale.currency.major.word],
      ['currency.minor.word', locale.currency.minor.word],
      ['notation.scales (short)', locale.notation.scales.map((scale) => scale.short).join(', ')],
    ]

    dataBox.replaceChildren()
    for (const [key, value] of entries) {
      const dt = document.createElement('dt')
      dt.textContent = key
      const dd = document.createElement('dd')
      dd.textContent = value
      dataBox.appendChild(dt)
      dataBox.appendChild(dd)
    }
  }

  select.addEventListener('change', update)
  update()

  return wrapper
}

export function renderLocaleSection(): HTMLElement {
  const section = document.createElement('section')
  section.className = 'category-section'
  section.id = 'locales'

  const heading = document.createElement('h2')
  heading.textContent = 'Locales'
  section.appendChild(heading)

  const description = document.createElement('p')
  description.className = 'category-desc'
  description.textContent =
    'Every function above is Azerbaijani-only today. The Locale objects below already exist under src/locale/ with the full data date-fns-style locale support will read from, but numberToWords, formatNumber, formatMoney, and friends do not accept a locale option yet — that wiring is tracked in todo.md §1.'
  section.appendChild(description)

  section.appendChild(buildStatusTable())
  section.appendChild(buildPreview())

  return section
}
