import { type LocaleInfo, localeInfo } from './locales'

function buildStatusTable(): HTMLElement {
  const table = document.createElement('table')
  table.className = 'locale-status-table'

  const thead = document.createElement('thead')
  const headRow = document.createElement('tr')
  for (const label of ['Locale', 'Code', 'fractionToWords']) {
    const th = document.createElement('th')
    th.textContent = label
    headRow.appendChild(th)
  }
  thead.appendChild(headRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  for (const row of localeInfo) {
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
    badge.className = `locale-badge ${row.fractionWordsSupported ? 'is-live' : 'is-planned'}`
    badge.textContent = row.fractionWordsSupported ? 'Implemented' : 'Throws (see todo.md §2)'
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
  for (const row of localeInfo) {
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
    const row: LocaleInfo =
      localeInfo.find((entry) => entry.code === select.value) ?? (localeInfo[0] as LocaleInfo)
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
      [
        'notation.scales (short)',
        locale.notation.scales.map((scale: { short: string }) => scale.short).join(', '),
      ],
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
    'Every function above takes a locale option (default en) and reads from one of these four Locale objects — az, en, ru, es. This reference browser shows the raw vocabulary, currency, and notation data each one carries; try the locale selector on any function card above to see it drive real output. The one gap: fractionToWords only has real fraction-noun vocabulary for az and en (see the table below and its function card for why ru/es throw instead of guessing).'
  section.appendChild(description)

  section.appendChild(buildStatusTable())
  section.appendChild(buildPreview())

  return section
}
