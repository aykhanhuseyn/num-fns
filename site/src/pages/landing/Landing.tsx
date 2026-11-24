import { type ReactNode, useState } from 'react'
import {
  formatMoney,
  moneyToWords,
  numberToWords,
  ordinalToWords,
  toShortNotation,
} from '../../../../src/index'
import { categories, entries } from '../../catalog'
import { badges, hero, install, usageSnippet } from '../../content'
import { localeInfo } from '../../locales'
import { CodeBlock, CopyButton } from '../../ui/CodeBlock'
import { asset } from '../../ui/Layout'

type Locale = (typeof localeInfo)[number]['locale']

const DEMOS: readonly {
  id: string
  label: string
  run: (value: number, locale: Locale) => string
}[] = [
  { id: 'words', label: 'numberToWords', run: (value, locale) => numberToWords(value, { locale }) },
  { id: 'money', label: 'formatMoney', run: (value, locale) => formatMoney(value, { locale }) },
  {
    id: 'money-words',
    label: 'moneyToWords',
    run: (value, locale) => moneyToWords(value, { locale }),
  },
  {
    id: 'ordinal',
    label: 'ordinalToWords',
    run: (value, locale) => ordinalToWords(value, { locale }),
  },
  {
    id: 'short',
    label: 'toShortNotation',
    run: (value, locale) => toShortNotation(value, { locale }),
  },
]

function attempt(run: () => string): { ok: boolean; text: string } {
  try {
    return { ok: true, text: run() }
  } catch (error) {
    return { ok: false, text: error instanceof Error ? error.message : String(error) }
  }
}

function LiveDemo(): ReactNode {
  const [raw, setRaw] = useState('2021')
  const [demoId, setDemoId] = useState('words')
  const demo = DEMOS.find((entry) => entry.id === demoId) ?? DEMOS[0]
  const value = Number(raw)
  return (
    <section className="demo" aria-labelledby="demo-title">
      <h2 id="demo-title" className="demo-title">
        Try it
      </h2>
      <div className="demo-controls">
        <div className="field">
          <label className="field-label" htmlFor="demo-value">
            value
          </label>
          <input
            id="demo-value"
            type="text"
            inputMode="decimal"
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="demo-fn">
            function
          </label>
          <select id="demo-fn" value={demoId} onChange={(event) => setDemoId(event.target.value)}>
            {DEMOS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ul className="demo-results" aria-live="polite">
        {localeInfo.map((info) => {
          const result = demo
            ? attempt(() => demo.run(value, info.locale))
            : { ok: false, text: '' }
          return (
            <li key={info.code}>
              <span className="demo-locale">
                {info.name} <code>{info.code}</code>
              </span>
              <span
                className={result.ok ? 'demo-value' : 'demo-value result-error'}
                lang={info.locale.code}
              >
                {result.text}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const FEATURES: readonly { title: string; text: string; fns: string[] }[] = [
  {
    title: 'Format and parse',
    text: 'Format numbers, money and percentages with the separators and symbols of the locale. Parse the text back to a number.',
    fns: ['formatNumber', 'formatMoney', 'parsePercentage'],
  },
  {
    title: 'Numbers in words',
    text: 'Write cardinals, ordinals, money and fractions in words. The words agree in gender if the language has gender.',
    fns: ['numberToWords', 'moneyToWords', 'ordinalToWords'],
  },
  {
    title: 'Notation',
    text: 'Short (2.5M) and long (2.5 million) notation, roman numerals, byte sizes and bases from 2 to 36.',
    fns: ['toShortNotation', 'toRoman', 'toByteSize'],
  },
  {
    title: 'Exact arithmetic',
    text: '0.1 + 0.2 gives 0.3. Add, subtract, multiply, divide and round without floating-point errors.',
    fns: ['add', 'round', 'clamp'],
  },
  {
    title: 'Statistics',
    text: 'Sum, mean, median, mode, variance and percentiles. The library calculates them exactly in decimal.',
    fns: ['mean', 'median', 'percentile'],
  },
  {
    title: 'Finance',
    text: 'Simple and compound interest, loan payments and full amortization schedules.',
    fns: ['compoundInterest', 'loanPayment', 'amortizationSchedule'],
  },
]

export function Landing(): ReactNode {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <img className="hero-mark" src={asset('logo.png')} alt="" width={72} height={72} />
            <h1>{hero.title}</h1>
            <p className="hero-tagline">{hero.tagline}</p>
            <p className="hero-description">{hero.description}</p>
            <div className="hero-install">
              <code>{install.npm}</code>
              <CopyButton text={install.npm} label="Copy command" />
            </div>
            <div className="hero-cta">
              <a className="btn btn-primary" href="./docs.html">
                Read the documentation
              </a>
              <a className="btn" href="./playground.html">
                Open the playground
              </a>
            </div>
            <ul className="badge-row" aria-label="Highlights">
              {badges.map((badge) => (
                <li key={badge} className="badge">
                  {badge}
                </li>
              ))}
            </ul>
          </div>
          <LiveDemo />
        </div>
      </section>

      <section className="container section" aria-labelledby="features-title">
        <h2 id="features-title">
          {entries.length} functions in {categories.length} groups
        </h2>
        <ul className="feature-grid">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="feature">
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <p className="feature-fns">
                {feature.fns.map((name) => (
                  <a key={name} href={`./docs.html#${name}`}>
                    <code>{name}</code>
                  </a>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container section two-col" aria-labelledby="start-title">
        <div>
          <h2 id="start-title">Quick start</h2>
          <p>
            Import each function by name. Pass a locale object when the output depends on the
            language. The library does not use <code>Intl</code>, so the output is the same in Node,
            Bun, Deno and all browsers.
          </p>
          <ul className="check-list">
            <li>
              Bad input throws an error. With <code>noThrow</code>, you get an empty value.
            </li>
            <li>Each integer function accepts a bigint. Each parser can return a bigint.</li>
            <li>Import only the locales that you use. This keeps the bundle small.</li>
          </ul>
          <p>
            <a className="btn" href="./docs.html#quick-start">
              Read the quick start
            </a>
          </p>
        </div>
        <CodeBlock code={usageSnippet} title="example.ts" />
      </section>

      <section className="container section" aria-labelledby="locales-title">
        <h2 id="locales-title">Five hand-written locales</h2>
        <ul className="locale-grid">
          {localeInfo.map((info) => (
            <li key={info.code} className="locale-card">
              <span className="locale-name">{info.name}</span>
              <code>{info.code}</code>
              <span className="locale-sample" lang={info.locale.code}>
                {numberToWords(21, { locale: info.locale })}
              </span>
            </li>
          ))}
        </ul>
        <div className="callout review-callout">
          <p>
            <strong>Do you speak one of these languages?</strong> Please review its words on the
            review page. Examine the words, gender, case and plural forms. This takes approximately
            ten minutes.
          </p>
          <a className="btn btn-primary" href="./review.html">
            Review the words
          </a>
        </div>
      </section>
    </>
  )
}
