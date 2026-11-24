import { type ReactNode, useEffect, useId, useState } from 'react'
import { useTheme } from './theme'

declare const __PKG_VERSION__: string

export const REPO_URL = 'https://github.com/aykhanhuseyn/num-fns'
const NPM_URL = 'https://www.npmjs.com/package/num-fns'
const VERSION = typeof __PKG_VERSION__ === 'string' ? __PKG_VERSION__ : ''

/** Every page `site/` builds. `api` is TypeDoc's output, written beside the site by `bun run docs:api`. */
export type PageId = 'home' | 'docs' | 'playground' | 'review' | 'api'

/** Assets in `public/` are copied as they are, so they are addressed by URL. `BASE_URL` is `./`. */
export const asset = (file: string): string => `${import.meta.env.BASE_URL}${file}`

export interface NavLabels {
  home: string
  docs: string
  playground: string
  api: string
  review: string
  menu: string
  skip: string
  toDark: string
  toLight: string
}

export const EN_NAV: NavLabels = {
  home: 'Home',
  docs: 'Docs',
  playground: 'Playground',
  api: 'API',
  review: 'Review',
  menu: 'Menu',
  skip: 'Skip to content',
  toDark: 'Switch to dark theme',
  toLight: 'Switch to light theme',
}

const PAGES: readonly { id: PageId; href: string; label: keyof NavLabels }[] = [
  { id: 'home', href: './index.html', label: 'home' },
  { id: 'docs', href: './docs.html', label: 'docs' },
  { id: 'playground', href: './playground.html', label: 'playground' },
  { id: 'api', href: './api/', label: 'api' },
  { id: 'review', href: './review.html', label: 'review' },
]

function SunIcon(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  )
}

function MoonIcon(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </svg>
  )
}

function MenuIcon(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function ThemeToggle({ labels }: { labels: NavLabels }): ReactNode {
  const { theme, toggle } = useTheme()
  const label = theme === 'dark' ? labels.toLight : labels.toDark
  return (
    <button type="button" className="icon-btn theme-toggle" onClick={toggle} title={label}>
      <span className="visually-hidden">{label}</span>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function SiteHeader({
  current,
  labels = EN_NAV,
}: {
  current: PageId
  labels?: NavLabels
}): ReactNode {
  const [open, setOpen] = useState(false)
  const navId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <a className="brand" href="./index.html">
          <img src={asset('logo.png')} alt="" width={30} height={30} />
          <span>num-fns</span>
          {VERSION && <span className="brand-version">v{VERSION}</span>}
        </a>
        <button
          type="button"
          className="icon-btn nav-toggle"
          aria-expanded={open}
          aria-controls={navId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="visually-hidden">{labels.menu}</span>
          <MenuIcon />
        </button>
        <nav id={navId} className={open ? 'site-nav is-open' : 'site-nav'} aria-label="Main">
          {PAGES.map((page) => (
            <a
              key={page.id}
              href={page.href}
              aria-current={page.id === current ? 'page' : undefined}
            >
              {labels[page.label]}
            </a>
          ))}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
        <ThemeToggle labels={labels} />
      </div>
    </header>
  )
}

const FOOTER_LINKS: readonly { label: string; href: string }[] = [
  { label: 'Source', href: REPO_URL },
  { label: 'npm', href: NPM_URL },
  { label: 'Changelog', href: `${REPO_URL}/blob/main/CHANGELOG.md` },
  { label: 'Roadmap', href: `${REPO_URL}/blob/main/ROADMAP.md` },
  { label: 'Contributing', href: `${REPO_URL}/blob/main/CONTRIBUTING.md` },
]

function SiteFooter(): ReactNode {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <p>num-fns {VERSION && `v${VERSION}`} · MIT license</p>
        <ul>
          {FOOTER_LINKS.map((link) => (
            <li key={link.label}>
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}

/** Skip link, header, `<main>` and footer: the frame every page shares. */
export function Page({
  current,
  labels = EN_NAV,
  children,
  mainClassName,
}: {
  current: PageId
  labels?: NavLabels
  children: ReactNode
  mainClassName?: string
}): ReactNode {
  return (
    <>
      <a className="skip-link" href="#main">
        {labels.skip}
      </a>
      <SiteHeader current={current} labels={labels} />
      <main id="main" tabIndex={-1} className={mainClassName}>
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
