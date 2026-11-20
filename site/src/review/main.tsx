import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../ui/theme.css'
import './review.css'
import { EN_NAV, type NavLabels, Page } from '../ui/Layout'
import { reviews } from './items'
import { ReviewApp } from './ReviewApp'
import { resolveMode } from './ui'

/** `?lang=ru` locks the page to one locale and speaks its language (`ui.ts`). */
const mode = resolveMode(window.location.search, reviews)
const { ui } = mode

document.documentElement.lang = ui.htmlLang
document.title = ui.docTitle

const labels: NavLabels = {
  ...EN_NAV,
  home: ui.frame.home,
  docs: ui.navDocs,
  playground: ui.frame.playground,
  review: ui.frame.review,
  menu: ui.frame.menu,
  skip: ui.frame.skip,
  toDark: ui.frame.toDark,
  toLight: ui.frame.toLight,
}

const root = document.getElementById('app')
if (!root) throw new Error('review: #app root element not found')

createRoot(root).render(
  <StrictMode>
    <Page current="review" labels={labels}>
      <ReviewApp mode={mode} />
    </Page>
  </StrictMode>,
)
