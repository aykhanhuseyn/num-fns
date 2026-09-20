import { afterEach, describe, expect, it } from 'bun:test'
import { resetConfig, setConfig } from '../config'
import {
  guardBoolean,
  guardLazy,
  guardList,
  guardNumber,
  guardRecord,
  guardValue,
  resolveNoThrow,
} from './no-throw'

const boom = (): never => {
  throw new RangeError('boom')
}

afterEach(() => {
  resetConfig()
})

describe('resolveNoThrow', () => {
  it('follows the global setting when there is no per-call option', () => {
    expect(resolveNoThrow()).toBe(false)
    expect(resolveNoThrow({})).toBe(false)
    setConfig({ noThrow: true })
    expect(resolveNoThrow()).toBe(true)
    expect(resolveNoThrow({})).toBe(true)
  })

  it('lets the per-call option win in both directions', () => {
    expect(resolveNoThrow({ noThrow: true })).toBe(true)
    setConfig({ noThrow: true })
    expect(resolveNoThrow({ noThrow: false })).toBe(false)
  })
})

describe('guardValue', () => {
  it('rethrows when noThrow is off', () => {
    expect(() => guardValue(boom, 'empty')).toThrow(RangeError)
  })

  it('returns the value when nothing throws', () => {
    expect(guardValue(() => 'ok', 'empty', { noThrow: true })).toBe('ok')
  })

  it('returns the empty value when noThrow is on', () => {
    expect(guardValue(boom, 'empty', { noThrow: true })).toBe('empty')
  })
})

describe('guardLazy', () => {
  it('only builds the empty value when it is needed', () => {
    let built = 0
    const empty = () => {
      built += 1
      return 'empty'
    }
    expect(guardLazy(() => 'ok', empty, { noThrow: true })).toBe('ok')
    expect(built).toBe(0)
    expect(guardLazy(boom, empty, { noThrow: true })).toBe('empty')
    expect(built).toBe(1)
  })

  it('lets an inner guard rethrow, so only the outermost one catches', () => {
    setConfig({ noThrow: true })
    const inner = () => guardValue(boom, 'inner empty')
    expect(guardValue(() => `outer saw ${inner()}`, 'outer empty')).toBe('outer empty')
  })

  it('stops guarding again once the outer guard has returned', () => {
    setConfig({ noThrow: true })
    guardValue(boom, 'empty')
    expect(guardValue(boom, 'empty')).toBe('empty')
  })
})

describe('the per-type wrappers', () => {
  it('guardNumber falls back to NaN', () => {
    expect(guardNumber(boom, { noThrow: true })).toBeNaN()
    expect(guardNumber(() => 1, { noThrow: true })).toBe(1)
  })

  it('guardBoolean falls back to false', () => {
    expect(guardBoolean(boom, { noThrow: true })).toBe(false)
    expect(guardBoolean(() => true, { noThrow: true })).toBe(true)
  })

  it('guardList falls back to an empty array', () => {
    expect(guardList(boom, { noThrow: true })).toEqual([])
    expect(guardList(() => [1], { noThrow: true })).toEqual([1])
  })

  it('guardRecord falls back to undefined, which the signature does not admit', () => {
    expect(guardRecord(boom, { noThrow: true })).toBeUndefined()
    expect(guardRecord(() => ({ a: 1 }), { noThrow: true })).toEqual({ a: 1 })
  })
})
