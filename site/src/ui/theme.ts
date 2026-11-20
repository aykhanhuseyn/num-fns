import { useCallback, useEffect, useState } from 'react'

/**
 * Light/dark theme. The reader's explicit choice is stored; without one the
 * page follows the system setting (`prefers-color-scheme`). The inline script
 * in every page's `<head>` applies a stored choice before first paint, so this
 * hook only has to keep React and `<html data-theme>` in step afterwards.
 */
export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'num-fns.theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function stored(): Theme | undefined {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : undefined
  } catch {
    return undefined
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light'
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [choice, setChoice] = useState<Theme | undefined>(stored)
  const [system, setSystem] = useState<Theme>(systemTheme)

  useEffect(() => {
    const query = window.matchMedia?.(DARK_QUERY)
    if (!query) return
    const onChange = (): void => setSystem(query.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const theme = choice ?? system

  useEffect(() => {
    if (choice) document.documentElement.dataset.theme = choice
    else delete document.documentElement.dataset.theme
  }, [choice])

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setChoice(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked: the choice still holds for this page view.
    }
  }, [theme])

  return { theme, toggle }
}
