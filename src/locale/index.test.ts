import { describe, expect, it } from 'bun:test'
import * as locales from './index'

/**
 * `num-fns/locale` is its own package subpath (and its own Vite entry), so the
 * set of locales it re-exports is public surface in the same way the package
 * root's function list is. Adding a locale means adding it here, plus a
 * `./locale/<code>` entry in both `package.json`'s `exports` and
 * `vite.config.ts`'s `build.lib.entry`.
 */
const LAUNCH_LOCALES = ['az', 'en', 'es', 'ru'] as const

describe('locale barrel', () => {
  it('exports exactly the launch locales', () => {
    expect(Object.keys(locales).sort()).toEqual([...LAUNCH_LOCALES])
  })

  it('gives every locale a code matching its export name and a display name', () => {
    for (const [name, locale] of Object.entries(locales)) {
      expect(locale.code).toBe(name)
      // `Locale.name` is optional in the interface; every launch locale sets it.
      expect(typeof locale.name).toBe('string')
      expect(locale.name).not.toBe('')
    }
  })
})
