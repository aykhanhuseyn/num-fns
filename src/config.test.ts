import { afterEach, describe, expect, it } from 'bun:test'
import { getConfig, resetConfig, setConfig } from './config'

afterEach(() => {
  resetConfig()
})

describe('getConfig', () => {
  it('starts at the shipped defaults', () => {
    expect(getConfig()).toEqual({ noThrow: false })
  })

  it('returns a copy, so mutating it changes nothing', () => {
    const config = getConfig()
    config.noThrow = true
    expect(getConfig().noThrow).toBe(false)
  })
})

describe('setConfig', () => {
  it('merges the partial and returns the result', () => {
    expect(setConfig({ noThrow: true })).toEqual({ noThrow: true })
    expect(getConfig().noThrow).toBe(true)
  })

  it('leaves untouched keys alone', () => {
    setConfig({ noThrow: true })
    expect(setConfig({})).toEqual({ noThrow: true })
  })

  it('throws TypeError for a non-boolean noThrow, even though noThrow is what it sets', () => {
    expect(() => setConfig({ noThrow: 'yes' as unknown as boolean })).toThrow(TypeError)
    expect(() => setConfig({ noThrow: 1 as unknown as boolean })).toThrow(
      'setConfig: noThrow must be a boolean, received number',
    )
    expect(getConfig().noThrow).toBe(false)
  })

  it('treats an explicit undefined as "leave it alone"', () => {
    setConfig({ noThrow: true })
    expect(setConfig({ noThrow: undefined }).noThrow).toBe(true)
  })
})

describe('resetConfig', () => {
  it('restores the defaults and returns them', () => {
    setConfig({ noThrow: true })
    expect(resetConfig()).toEqual({ noThrow: false })
    expect(getConfig().noThrow).toBe(false)
  })
})
