/**
 * Type-level tests for the `output` overloads of every parser (task 0.8-3).
 *
 * The overloads are part of the 1.0 contract: `{ output: 'bigint' }` must give
 * `bigint`, no `output` (or `'number'`) must give `number`, and an `output`
 * whose value is only known as `ParseOutput` must give the union. `attw`
 * checks packaging, not inference, so only these assertions catch a broken
 * overload. They are checked by `bun run check:type` (`bun check`); at run
 * time `expectTypeOf` does nothing; the calls do run, so every input here is
 * valid.
 */
import { describe, expect, it } from 'bun:test'
import { expectTypeOf } from 'expect-type'
import {
  fromBase,
  type ParseOutput,
  parseByteSize,
  parseLongNotation,
  parseMoney,
  parseNumber,
  parsePercentage,
  parseShortNotation,
} from './index'

// Typed as the union, so overload resolution cannot pick a single member.
const output = 'number' as ParseOutput

describe('parser output overloads', () => {
  it('parseNumber', () => {
    expectTypeOf(parseNumber('1')).toEqualTypeOf<number>()
    expectTypeOf(parseNumber('1', {})).toEqualTypeOf<number>()
    expectTypeOf(parseNumber('1', { output: 'number' })).toEqualTypeOf<number>()
    expectTypeOf(parseNumber('1', { output: 'bigint' })).toEqualTypeOf<bigint>()
    expectTypeOf(parseNumber('1', { output })).toEqualTypeOf<number | bigint>()
    expect(parseNumber('1', { output: 'bigint' })).toBe(BigInt(1))
  })

  it('parseMoney', () => {
    expectTypeOf(parseMoney('$1')).toEqualTypeOf<number>()
    expectTypeOf(parseMoney('$1', { output: 'number' })).toEqualTypeOf<number>()
    expectTypeOf(parseMoney('$1', { output: 'bigint' })).toEqualTypeOf<bigint>()
    expectTypeOf(parseMoney('$1', { output })).toEqualTypeOf<number | bigint>()
  })

  it('parsePercentage', () => {
    expectTypeOf(parsePercentage('5%')).toEqualTypeOf<number>()
    expectTypeOf(parsePercentage('5%', { output: 'number' })).toEqualTypeOf<number>()
    expectTypeOf(parsePercentage('5%', { output: 'bigint' })).toEqualTypeOf<bigint>()
    expectTypeOf(parsePercentage('5%', { output })).toEqualTypeOf<number | bigint>()
  })

  it('parseShortNotation', () => {
    expectTypeOf(parseShortNotation('1K')).toEqualTypeOf<number>()
    expectTypeOf(parseShortNotation('1K', { output: 'number' })).toEqualTypeOf<number>()
    expectTypeOf(parseShortNotation('1K', { output: 'bigint' })).toEqualTypeOf<bigint>()
    expectTypeOf(parseShortNotation('1K', { output })).toEqualTypeOf<number | bigint>()
  })

  it('parseLongNotation', () => {
    expectTypeOf(parseLongNotation('1 thousand')).toEqualTypeOf<number>()
    expectTypeOf(parseLongNotation('1 thousand', { output: 'number' })).toEqualTypeOf<number>()
    expectTypeOf(parseLongNotation('1 thousand', { output: 'bigint' })).toEqualTypeOf<bigint>()
    expectTypeOf(parseLongNotation('1 thousand', { output })).toEqualTypeOf<number | bigint>()
  })

  it('parseByteSize', () => {
    expectTypeOf(parseByteSize('1 KB')).toEqualTypeOf<number>()
    expectTypeOf(parseByteSize('1 KB', { output: 'number' })).toEqualTypeOf<number>()
    expectTypeOf(parseByteSize('1 KB', { output: 'bigint' })).toEqualTypeOf<bigint>()
    expectTypeOf(parseByteSize('1 KB', { output })).toEqualTypeOf<number | bigint>()
  })

  it('fromBase', () => {
    expectTypeOf(fromBase('ff', 16)).toEqualTypeOf<number>()
    expectTypeOf(fromBase('ff', 16, { output: 'number' })).toEqualTypeOf<number>()
    expectTypeOf(fromBase('ff', 16, { output: 'bigint' })).toEqualTypeOf<bigint>()
    expectTypeOf(fromBase('ff', 16, { output })).toEqualTypeOf<number | bigint>()
  })

  it('rejects an output value that is not a ParseOutput', () => {
    // Wrapped in a function so the invalid call is type checked but not run.
    // @ts-expect-error 'string' is not a ParseOutput.
    expectTypeOf(() => parseNumber('1', { output: 'string' })).toBeFunction()
    // The bigint overload must not widen to the union.
    expectTypeOf(parseNumber('1', { output: 'bigint' })).not.toEqualTypeOf<number | bigint>()
  })
})
