import { renderExampleCard } from './card'
import { badges, brand, hero, install, usageSnippet } from './content'
import { renderLocaleSection } from './locale-section'
import { categories, exampleCount } from './registry'
import './style.css'

const REPO_URL = 'https://github.com/aykhanhuseyn/num-fns'
const NPM_URL = 'https://www.npmjs.com/package/num-fns'

function buildHeader(): HTMLElement {
  const header = document.createElement('header')
  header.className = 'site-header'

  const brandLink = document.createElement('a')
  brandLink.className = 'brand'
  brandLink.href = '#top'

  // Decorative: the wordmark right next to it already carries the name, so an
  // alt text here would just make screen readers say "num-fns" twice.
  const brandMark = document.createElement('img')
  brandMark.className = 'brand-mark'
  brandMark.src = brand.mark
  brandMark.alt = ''
  brandMark.width = 28
  brandMark.height = 28
  brandLink.appendChild(brandMark)

  const brandName = document.createElement('span')
  brandName.textContent = 'num-fns'
  brandLink.appendChild(brandName)

  header.appendChild(brandLink)

  const nav = document.createElement('nav')
  nav.className = 'site-nav'

  const links: [string, string][] = [
    ['Docs', '#playground'],
    ['Locales', '#locales'],
    ['GitHub', REPO_URL],
    ['npm', NPM_URL],
  ]
  for (const [label, href] of links) {
    const a = document.createElement('a')
    a.href = href
    a.textContent = label
    if (href.startsWith('http')) {
      a.target = '_blank'
      a.rel = 'noreferrer'
    }
    nav.appendChild(a)
  }
  header.appendChild(nav)

  return header
}

function buildHero(): HTMLElement {
  const section = document.createElement('section')
  section.className = 'hero'
  section.id = 'top'

  // The lockup is the page's h1: the image carries the name as its alt text, so
  // the heading still reads as "num-fns" to screen readers and to crawlers. It
  // is the transparent crop, not the social banner — the banner's own navy
  // field would read as a card floating on the page's near-identical navy.
  const title = document.createElement('h1')
  title.className = 'hero-logo'
  const logo = document.createElement('img')
  logo.src = brand.lockup
  logo.alt = hero.title
  logo.width = 959
  logo.height = 427
  logo.decoding = 'async'
  title.appendChild(logo)
  section.appendChild(title)

  const tagline = document.createElement('p')
  tagline.className = 'hero-tagline'
  tagline.textContent = hero.tagline
  section.appendChild(tagline)

  const description = document.createElement('p')
  description.className = 'hero-description'
  description.textContent = hero.description
  section.appendChild(description)

  const badgeRow = document.createElement('div')
  badgeRow.className = 'badge-row'
  for (const badge of badges) {
    const span = document.createElement('span')
    span.className = 'badge'
    span.textContent = badge
    badgeRow.appendChild(span)
  }
  section.appendChild(badgeRow)

  const cta = document.createElement('div')
  cta.className = 'hero-cta'

  const tryLink = document.createElement('a')
  tryLink.className = 'button button-primary'
  tryLink.href = '#playground'
  tryLink.textContent = `Try all ${exampleCount} functions live`
  cta.appendChild(tryLink)

  const repoLink = document.createElement('a')
  repoLink.className = 'button button-secondary'
  repoLink.href = REPO_URL
  repoLink.target = '_blank'
  repoLink.rel = 'noreferrer'
  repoLink.textContent = 'View on GitHub'
  cta.appendChild(repoLink)

  section.appendChild(cta)

  const status = document.createElement('p')
  status.className = 'hero-status'
  status.textContent = hero.statusNote
  section.appendChild(status)

  return section
}

function buildInstallBlock(): HTMLElement {
  const section = document.createElement('section')
  section.className = 'getting-started'
  section.id = 'getting-started'

  const heading = document.createElement('h2')
  heading.textContent = 'Getting started'
  section.appendChild(heading)

  const installRow = document.createElement('div')
  installRow.className = 'install-row'
  for (const [label, command] of Object.entries(install)) {
    const block = document.createElement('div')
    block.className = 'install-block'
    const tag = document.createElement('span')
    tag.className = 'install-tag'
    tag.textContent = label
    block.appendChild(tag)
    const code = document.createElement('code')
    code.textContent = command
    block.appendChild(code)
    installRow.appendChild(block)
  }
  section.appendChild(installRow)

  const pre = document.createElement('pre')
  pre.className = 'snippet snippet-large'
  const code = document.createElement('code')
  code.textContent = usageSnippet
  pre.appendChild(code)
  section.appendChild(pre)

  return section
}

function buildNavIndex(): HTMLElement {
  const nav = document.createElement('nav')
  nav.className = 'toc'

  const heading = document.createElement('span')
  heading.className = 'toc-heading'
  heading.textContent = 'Jump to'
  nav.appendChild(heading)

  for (const category of categories) {
    const a = document.createElement('a')
    a.href = `#${category.id}`
    a.textContent = category.title
    nav.appendChild(a)
  }

  const localesLink = document.createElement('a')
  localesLink.href = '#locales'
  localesLink.textContent = 'Locales'
  nav.appendChild(localesLink)

  return nav
}

function buildPlaygroundSection(): HTMLElement {
  const wrapper = document.createElement('section')
  wrapper.id = 'playground'

  const intro = document.createElement('div')
  intro.className = 'playground-intro'
  const heading = document.createElement('h2')
  heading.textContent = 'Docs & playground'
  intro.appendChild(heading)
  const description = document.createElement('p')
  description.textContent = `Every one of the ${exampleCount} public functions below is live — change any input and the result updates immediately, calling the actual function from src/. Invalid input shows the real thrown error instead of a fake message.`
  intro.appendChild(description)
  wrapper.appendChild(intro)

  wrapper.appendChild(buildNavIndex())

  for (const category of categories) {
    const section = document.createElement('section')
    section.className = 'category-section'
    section.id = category.id

    const heading = document.createElement('h2')
    heading.textContent = category.title
    section.appendChild(heading)

    const description = document.createElement('p')
    description.className = 'category-desc'
    description.textContent = category.description
    section.appendChild(description)

    const grid = document.createElement('div')
    grid.className = 'card-grid'
    for (const example of category.examples) {
      grid.appendChild(renderExampleCard(example))
    }
    section.appendChild(grid)

    wrapper.appendChild(section)
  }

  wrapper.appendChild(renderLocaleSection())

  return wrapper
}

function buildFooter(): HTMLElement {
  const footer = document.createElement('footer')
  footer.className = 'site-footer'

  const text = document.createElement('p')
  text.append('MIT licensed. ')

  const links: [string, string][] = [
    ['Source', REPO_URL],
    ['Contributing', `${REPO_URL}/blob/main/CONTRIBUTING.md`],
    ['Roadmap', `${REPO_URL}/blob/main/todo.md`],
  ]
  links.forEach(([label, href], index) => {
    if (index > 0) text.append(' · ')
    const a = document.createElement('a')
    a.href = href
    a.target = '_blank'
    a.rel = 'noreferrer'
    a.textContent = label
    text.appendChild(a)
  })

  footer.appendChild(text)

  return footer
}

function mount(): void {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) throw new Error('main: #app root element not found')

  app.appendChild(buildHeader())
  app.appendChild(buildHero())
  app.appendChild(buildInstallBlock())
  app.appendChild(buildPlaygroundSection())
  app.appendChild(buildFooter())
}

mount()
