import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { categories, type Entry, entries, entryById } from '../../catalog'
import {
  buildProgram,
  buildSnippet,
  type FieldValue,
  type FieldValues,
  runExample,
} from '../../engine'
import { localeInfo } from '../../locales'
import { CodeBlock } from '../../ui/CodeBlock'
import { FieldControl } from '../../ui/FieldControl'
import { REPO_URL } from '../../ui/Layout'
import { ResultView, resultText } from '../../ui/Result'
import {
  DEFAULT_GLOBALS,
  effectiveValues,
  type Globals,
  genderVariants,
  hasOptionSet,
  localeVariants,
  type Variant,
} from '../../values'

const GLOBALS_KEY = 'num-fns.playground.globals'

function loadGlobals(): Globals {
  try {
    const raw = localStorage.getItem(GLOBALS_KEY)
    if (!raw) return DEFAULT_GLOBALS
    const parsed = JSON.parse(raw) as Partial<Globals>
    const locale = localeInfo.some((info) => info.code === parsed.locale) ? parsed.locale : 'en'
    return { locale: locale ?? 'en', noThrow: parsed.noThrow === true }
  } catch {
    return DEFAULT_GLOBALS
  }
}

function saveGlobals(globals: Globals): void {
  try {
    localStorage.setItem(GLOBALS_KEY, JSON.stringify(globals))
  } catch {
    // Not saved: the settings still apply to this visit.
  }
}

function idFromHash(): string {
  const id = decodeURIComponent(window.location.hash.slice(1))
  return entryById.has(id) ? id : (entries[0]?.id ?? '')
}

// --- defaults bar -------------------------------------------------------------

function DefaultsBar({
  globals,
  onChange,
}: {
  globals: Globals
  onChange: (next: Globals) => void
}): ReactNode {
  return (
    <section className="pg-defaults" aria-labelledby="pg-defaults-title">
      <h2 id="pg-defaults-title" className="pg-defaults-title">
        Defaults for every function
      </h2>
      <div className="pg-defaults-controls">
        <div className="field">
          <label className="field-label" htmlFor="pg-global-locale">
            locale
          </label>
          <select
            id="pg-global-locale"
            value={globals.locale}
            onChange={(event) => onChange({ ...globals, locale: event.target.value })}
            aria-describedby="pg-global-locale-hint"
          >
            {localeInfo.map((info) => (
              <option key={info.code} value={info.code}>
                {info.name} ({info.code})
              </option>
            ))}
          </select>
          <span id="pg-global-locale-hint" className="field-hint">
            Used by every function that takes a locale, until you change it there.
          </span>
        </div>
        <div className="field field-check">
          <label className="check" htmlFor="pg-global-nothrow">
            <input
              id="pg-global-nothrow"
              type="checkbox"
              checked={globals.noThrow}
              onChange={(event) => onChange({ ...globals, noThrow: event.target.checked })}
              aria-describedby="pg-global-nothrow-hint"
            />
            setConfig({'{'} noThrow: true {'}'})
          </label>
          <span id="pg-global-nothrow-hint" className="field-hint">
            Bad input returns an empty value instead of an error, for every function.
          </span>
        </div>
      </div>
    </section>
  )
}

// --- sidebar ------------------------------------------------------------------

function Sidebar({ current }: { current: string }): ReactNode {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const groups = categories
    .map((category) => ({
      category,
      items: entries.filter(
        (entry) =>
          entry.category.id === category.id &&
          (!needle || entry.name.toLowerCase().includes(needle)),
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <aside className="side" aria-label="Functions">
      <div className="side-search">
        <label className="visually-hidden" htmlFor="pg-search">
          Find a function
        </label>
        <input
          id="pg-search"
          type="search"
          placeholder={`Find among ${entries.length} functions`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <nav className="side-nav" aria-label="Function list">
        {groups.length === 0 && <p className="side-empty">No function matches “{query}”.</p>}
        {groups.map(({ category, items }) => (
          <div key={category.id} className="side-group">
            <h2 className="side-heading">{category.title}</h2>
            <ul>
              {items.map((entry) => (
                <li key={entry.id}>
                  <a href={`#${entry.id}`} aria-current={entry.id === current ? 'page' : undefined}>
                    {entry.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}

// --- function panel -----------------------------------------------------------

function VariantTable({
  caption,
  firstColumn,
  variants,
  current,
}: {
  caption: string
  firstColumn: string
  variants: Variant[]
  current?: string
}): ReactNode {
  return (
    <div className="table-wrap">
      <table className="variant-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{firstColumn}</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr key={variant.key} className={variant.key === current ? 'is-current' : undefined}>
              <th scope="row">
                {variant.label}
                {variant.detail && <span className="variant-detail"> {variant.detail}</span>}
                {variant.key === current && <span className="visually-hidden"> (current)</span>}
              </th>
              <td>
                <code className={variant.result.ok ? undefined : 'result-error'}>
                  {resultText(variant.result)}
                </code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FunctionPanel({
  entry,
  touched,
  globals,
  onChange,
  onReset,
}: {
  entry: Entry
  touched: FieldValues
  globals: Globals
  onChange: (id: string, value: FieldValue) => void
  onReset: () => void
}): ReactNode {
  const values = effectiveValues(entry, touched, globals)
  const settings = { noThrow: globals.noThrow }
  const result = runExample(entry, values, settings)
  const optionSet = hasOptionSet(entry, values)
  const defaultResult = runExample(entry, values, { ...settings, positionalOnly: true })
  const program = buildProgram(entry, values, { ...settings, result: resultText(result) })
  const locales = localeVariants(entry, values, globals)
  const genders = genderVariants(entry, values, globals)
  const docFor = (key: string) => entry.options.find((doc) => doc.key === key)

  const inputs = entry.fields.filter((field) => field.arg.kind !== 'option')
  const options = entry.fields.filter((field) => field.arg.kind === 'option')
  const currentLocale = String(values.locale ?? '')

  return (
    <article className="fn-panel" aria-labelledby="fn-title">
      <header className="fn-head">
        <p className="fn-category">{entry.category.title}</p>
        <h1 id="fn-title">{entry.name}</h1>
        <code className="fn-signature">
          {entry.name}
          {entry.signature}
        </code>
        <p className="fn-description">{entry.description}</p>
        <p className="fn-links">
          <a href={`./docs.html#${entry.id}`}>Documentation</a>
          <a href={`./api/functions/index.${entry.name}.html`}>API reference</a>
          <a href={`${REPO_URL}/blob/main/${entry.sourceFile}`} target="_blank" rel="noreferrer">
            Source
          </a>
        </p>
      </header>

      <div className="fn-grid">
        <form className="fn-inputs" onSubmit={(event) => event.preventDefault()}>
          <fieldset>
            <legend>Arguments</legend>
            <div className="field-grid">
              {inputs.map((field) => (
                <FieldControl
                  key={field.id}
                  field={field}
                  value={values[field.id] ?? field.default}
                  onChange={(value) => onChange(field.id, value)}
                />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Options</legend>
            {options.length === 0 ? (
              <p className="muted">
                No options object. Only the global{' '}
                <code>
                  setConfig({'{'} noThrow {'}'})
                </code>{' '}
                applies.
              </p>
            ) : (
              <div className="field-grid">
                {options.map((field) => (
                  <FieldControl
                    key={field.id}
                    field={field}
                    value={values[field.id] ?? field.default}
                    doc={docFor(field.arg.kind === 'option' ? field.arg.key : '')}
                    onChange={(value) => onChange(field.id, value)}
                  />
                ))}
              </div>
            )}
          </fieldset>
          <button type="button" className="btn btn-sm" onClick={onReset}>
            Reset {entry.name}
          </button>
        </form>

        <div className="fn-output">
          <section aria-labelledby="out-result">
            <h2 id="out-result" className="out-title">
              Result
            </h2>
            <div aria-live="polite">
              <ResultView result={result} />
            </div>
          </section>

          {entry.options.length > 0 && (
            <section aria-labelledby="out-default">
              <h2 id="out-default" className="out-title">
                Default result <span className="out-sub">every option at its default</span>
              </h2>
              {optionSet ? (
                <>
                  <ResultView result={defaultResult} caption="Default result" />
                  <code className="out-call">{buildSnippet(entry, values, true)}</code>
                </>
              ) : (
                <p className="muted">Same as the result: no option is set.</p>
              )}
            </section>
          )}

          <CodeBlock code={program} title="Code" wrap />
        </div>
      </div>

      {genders.length > 0 && (
        <section className="fn-section" aria-labelledby="out-gender">
          <h2 id="out-gender">By grammatical gender</h2>
          <p className="muted">
            The counted noun decides the form: masculine (рубль), feminine (копейка), neuter (окно).
            Same value, <code>gender</code> option set each way.
          </p>
          <VariantTable
            caption="Result for each gender"
            firstColumn="gender"
            variants={genders}
            current={String(values.gender ?? '')}
          />
        </section>
      )}

      {locales.length > 0 && (
        <section className="fn-section" aria-labelledby="out-locales">
          <h2 id="out-locales">Localization</h2>
          <p className="muted">The same call with each locale. Every other input stays as it is.</p>
          <VariantTable
            caption="Result in each locale"
            firstColumn="locale"
            variants={locales}
            current={currentLocale}
          />
        </section>
      )}
    </article>
  )
}

// --- page ---------------------------------------------------------------------

export function Playground(): ReactNode {
  const [currentId, setCurrentId] = useState(idFromHash)
  const [globals, setGlobals] = useState(loadGlobals)
  const [touched, setTouched] = useState<Record<string, FieldValues>>({})

  useEffect(() => {
    const onHash = (): void => {
      setCurrentId(idFromHash())
      document.getElementById('main')?.focus({ preventScroll: true })
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const entry = entryById.get(currentId)

  useEffect(() => {
    if (entry) document.title = `${entry.name} — Playground — num-fns`
  }, [entry])

  const updateGlobals = (next: Globals): void => {
    setGlobals(next)
    saveGlobals(next)
  }

  const panel = useMemo(() => {
    if (!entry) return null
    return (
      <FunctionPanel
        entry={entry}
        touched={touched[entry.id] ?? {}}
        globals={globals}
        onChange={(id, value) =>
          setTouched((all) => ({ ...all, [entry.id]: { ...all[entry.id], [id]: value } }))
        }
        onReset={() => setTouched(({ [entry.id]: _removed, ...rest }) => rest)}
      />
    )
  }, [entry, touched, globals])

  return (
    <div className="container with-side">
      <Sidebar current={currentId} />
      <div className="side-main">
        <DefaultsBar globals={globals} onChange={updateGlobals} />
        {panel}
      </div>
    </div>
  )
}
