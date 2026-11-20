import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../ui/theme.css'
import '../pages.css'
import { Page } from '../../ui/Layout'
import { Playground } from './Playground'

const root = document.getElementById('app')
if (!root) throw new Error('playground: #app root element not found')

createRoot(root).render(
  <StrictMode>
    <Page current="playground" mainClassName="pg-main">
      <Playground />
    </Page>
  </StrictMode>,
)
