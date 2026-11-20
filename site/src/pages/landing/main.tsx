import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../ui/theme.css'
import '../pages.css'
import { Page } from '../../ui/Layout'
import { Landing } from './Landing'

const root = document.getElementById('app')
if (!root) throw new Error('landing: #app root element not found')

createRoot(root).render(
  <StrictMode>
    <Page current="home" mainClassName="landing-main">
      <Landing />
    </Page>
  </StrictMode>,
)
