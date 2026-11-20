import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../ui/theme.css'
import '../pages.css'
import { Page } from '../../ui/Layout'
import { Docs } from './Docs'

const root = document.getElementById('app')
if (!root) throw new Error('docs: #app root element not found')

createRoot(root).render(
  <StrictMode>
    <Page current="docs" mainClassName="docs-main">
      <Docs />
    </Page>
  </StrictMode>,
)
