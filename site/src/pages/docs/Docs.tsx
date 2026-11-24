import { type ReactNode, useEffect, useState } from 'react'
import { categories, type Entry, entries } from '../../catalog'
import { install, usageSnippet } from '../../content'
import { buildProgram, runExample } from '../../engine'
import { localeInfo } from '../../locales'
import { CodeBlock } from '../../ui/CodeBlock'
import { REPO_URL } from '../../ui/Layout'
import { resultText } from '../../ui/Result'
import { DEFAULT_GLOBALS, effectiveValues, localeVariants } from '../../values'

const GUIDES: readonly { id: string; title: string }[] = [
  { id: 'install', title: 'Install' },
  { id: 'quick-start', title: 'Quick start' },
  { id: 'locales', title: 'Locales' },
  { id: 'errors', title: 'Errors and noThrow' },
  { id: 'bigint', title: 'bigint' },
]

function Toc(): ReactNode {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  return (
    <aside className="side" aria-label="Contents">
      <div className="side-search">
        <label className="visually-hidden" htmlFor="docs-search">
          Find a function
        </label>
        <input
          id="docs-search"
          type="search"
          placeholder="Find a function"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <nav className="side-nav" aria-label="Documentation contents">
        {!needle && (
          <div className="side-group">
            <h2 className="side-heading">Guides</h2>
            <ul>
              {GUIDES.map((guide) => (
                <li key={guide.id}>
                  <a href={`#${guide.id}`}>{guide.title}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {categories.map((category) => {
          const items = entries.filter(
            (entry) =>
              entry.category.id === category.id &&
              (!needle || entry.name.toLowerCase().includes(needle)),
          )
          if (items.length === 0) return null
          return (
            <div key={category.id} className="side-group">
              <h2 className="side-heading">
                <a href={`#cat-${category.id}`}>{category.title}</a>
              </h2>
              <ul>
                {items.map((entry) => (
                  <li key={entry.id}>
                    <a href={`#${entry.id}`}>{entry.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

function OptionsTable({ entry }: { entry: Entry }): ReactNode {
  if (entry.options.length === 0) {
    return (
      <p className="muted">
        This function has no options object. Bad input throws an error. To get an empty value, use{' '}
        <code>
          setConfig({'{'} noThrow: true {'}'})
        </code>
        .
      </p>
    )
  }
  return (
    <div className="table-wrap">
      <table className="options-table">
        <caption className="visually-hidden">Options of {entry.name}</caption>
        <thead>
          <tr>
            <th scope="col">Option</th>
            <th scope="col">Type</th>
            <th scope="col">Default</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {entry.options.map((doc) => (
            <tr key={doc.key}>
              <th scope="row">
                <code>{doc.key}</code>
              </th>
              <td>
                <code>{doc.type}</code>
              </td>
              <td>
                <code>{doc.defaultValue}</code>
              </td>
              <td>{doc.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FunctionDoc({ entry }: { entry: Entry }): ReactNode {
  const values = effectiveValues(entry, {}, DEFAULT_GLOBALS)
  const result = runExample(entry, values)
  const program = buildProgram(entry, values, { result: resultText(result) })
  const locales = localeVariants(entry, values, DEFAULT_GLOBALS)
  return (
    <article id={entry.id} className="doc-fn" aria-labelledby={`${entry.id}-title`}>
      <h3 id={`${entry.id}-title`} className="doc-fn-title">
        <a href={`#${entry.id}`}>{entry.name}</a>
      </h3>
      <code className="fn-signature">
        {entry.name}
        {entry.signature}
      </code>
      <p>{entry.description}</p>
      <h4>Options</h4>
      <OptionsTable entry={entry} />
      <h4>Example</h4>
      <CodeBlock code={program} wrap />
      {locales.length > 0 && (
        <details className="doc-locales">
          <summary>The same call in each locale</summary>
          <div className="table-wrap">
            <table>
              <caption className="visually-hidden">{entry.name} in each locale</caption>
              <thead>
                <tr>
                  <th scope="col">Locale</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                {locales.map((variant) => (
                  <tr key={variant.key}>
                    <th scope="row">
                      {variant.label} <span className="variant-detail">{variant.detail}</span>
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
        </details>
      )}
      <p className="doc-fn-links">
        <a className="btn btn-sm" href={`./playground.html#${entry.id}`}>
          Open in the playground
        </a>
        <a href={`./api/functions/index.${entry.name}.html`}>API reference</a>
        <a href={`${REPO_URL}/blob/main/${entry.sourceFile}`} target="_blank" rel="noreferrer">
          Source
        </a>
      </p>
    </article>
  )
}

function Guides(): ReactNode {
  return (
    <>
      <section id="install" className="doc-guide" aria-labelledby="install-title">
        <h2 id="install-title">Install</h2>
        <p>
          num-fns has no runtime dependency. The package contains ESM, CommonJS and TypeScript
          types. Use Node 20 or newer, Bun, Deno or a modern browser.
        </p>
        <CodeBlock code={Object.values(install).join('\n')} title="Terminal" />
      </section>

      <section id="quick-start" className="doc-guide" aria-labelledby="quick-start-title">
        <h2 id="quick-start-title">Quick start</h2>
        <p>
          Import each function by name. When the output depends on the language, pass a{' '}
          <code>locale</code> object in the call. The default locale is <code>en</code>.
        </p>
        <CodeBlock code={usageSnippet} title="example.ts" />
      </section>

      <section id="locales" className="doc-guide" aria-labelledby="locales-title">
        <h2 id="locales-title">Locales</h2>
        <p>
          Import locales from <code>num-fns/locale</code>. To keep the bundle small, import each
          locale from its own path, for example <code>num-fns/locale/ru</code>.
        </p>
        <div className="table-wrap">
          <table>
            <caption className="visually-hidden">Supported locales</caption>
            <thead>
              <tr>
                <th scope="col">Locale</th>
                <th scope="col">Import</th>
                <th scope="col">Grammatical gender</th>
                <th scope="col">Fraction words</th>
              </tr>
            </thead>
            <tbody>
              {localeInfo.map((info) => (
                <tr key={info.code}>
                  <th scope="row">{info.name}</th>
                  <td>
                    <code>{info.code}</code>
                  </td>
                  <td>{info.locale.words.genders?.join(', ') ?? 'none'}</td>
                  <td>{info.fractionWordsSupported ? 'yes' : 'not yet (throws)'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Do you speak one of these languages?{' '}
          <a href="./review.html">Review the words for your language</a>.
        </p>
      </section>

      <section id="errors" className="doc-guide" aria-labelledby="errors-title">
        <h2 id="errors-title">Errors and noThrow</h2>
        <p>
          Bad input throws <code>RangeError</code>, <code>TypeError</code> or{' '}
          <code>SyntaxError</code>. The error message names the function. To get an empty value, use{' '}
          <code>noThrow: true</code>. The empty value is <code>""</code> for text and{' '}
          <code>NaN</code> for numbers. Set it for one call, or for all calls with{' '}
          <code>setConfig</code>.
        </p>
        <CodeBlock
          code={`import { formatNumber, setConfig } from 'num-fns'

formatNumber(Number.NaN, { noThrow: true }) // ""

setConfig({ noThrow: true }) // all calls after this line
formatNumber(Number.NaN) // ""`}
        />
      </section>

      <section id="bigint" className="doc-guide" aria-labelledby="bigint-title">
        <h2 id="bigint-title">bigint</h2>
        <p>
          Each integer function also accepts a <code>bigint</code>. Each parser can return a{' '}
          <code>bigint</code> with{' '}
          <code>
            {'{'} output: 'bigint' {'}'}
          </code>
          . The value stays exact above <code>Number.MAX_SAFE_INTEGER</code>.
        </p>
        <CodeBlock
          code={`import { formatNumber, parseNumber } from 'num-fns'

formatNumber(1234567890123456789n) // "1,234,567,890,123,456,789"
parseNumber('1,234,567,890,123,456,789', { output: 'bigint' }) // 1234567890123456789n`}
        />
      </section>
    </>
  )
}

export function Docs(): ReactNode {
  // The page renders after load, so the browser's own jump to `#formatMoney`
  // finds nothing yet: do it once the sections exist.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id) document.getElementById(id)?.scrollIntoView()
  }, [])

  return (
    <div className="container with-side">
      <Toc />
      <div className="side-main docs-content">
        <header className="docs-intro">
          <h1>Documentation</h1>
          <p className="lead">
            This page shows each function with its options, types and default values. The examples
            run the library in your browser. Each result is the output of the current source.
          </p>
        </header>
        <Guides />
        {categories.map((category) => (
          <section
            key={category.id}
            id={`cat-${category.id}`}
            className="doc-category"
            aria-labelledby={`cat-${category.id}-title`}
          >
            <h2 id={`cat-${category.id}-title`}>{category.title}</h2>
            <p className="muted">{category.description}</p>
            {entries
              .filter((entry) => entry.category.id === category.id)
              .map((entry) => (
                <FunctionDoc key={entry.id} entry={entry} />
              ))}
          </section>
        ))}
      </div>
    </div>
  )
}
