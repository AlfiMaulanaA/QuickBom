import { describe, it, expect } from 'vitest'
import { evaluateNumber, evaluateBool, FormulaError } from '@/lib/configurator/formula'

describe('formula.evaluateNumber', () => {
  it('evaluates simple arithmetic', () => {
    expect(evaluateNumber('1 + 2 * 3', {})).toBe(7)
  })

  it('resolves variables from scope', () => {
    expect(evaluateNumber('rackU / 6', { rackU: 42 })).toBe(7)
  })

  it('supports ceil/floor/round/max/min/abs', () => {
    expect(evaluateNumber('ceil(kW / 4)', { kW: 6 })).toBe(2)
    expect(evaluateNumber('floor(kW / 4)', { kW: 6 })).toBe(1)
    expect(evaluateNumber('round(2.5)', {})).toBe(3)
    expect(evaluateNumber('max(1, 2, 3)', {})).toBe(3)
    expect(evaluateNumber('min(1, 2, 3)', {})).toBe(1)
    expect(evaluateNumber('abs(-5)', {})).toBe(5)
  })

  it('supports ternary via if()', () => {
    expect(evaluateNumber('if(kW > 4, 2, 1)', { kW: 6 })).toBe(2)
    expect(evaluateNumber('if(kW > 4, 2, 1)', { kW: 2 })).toBe(1)
  })

  it('throws FormulaError on unknown variable', () => {
    expect(() => evaluateNumber('missing + 1', {})).toThrow(FormulaError)
  })

  it('throws FormulaError on syntax error', () => {
    expect(() => evaluateNumber('1 +', {})).toThrow(FormulaError)
  })

  it('rejects disallowed function (sin)', () => {
    expect(() => evaluateNumber('sin(0)', {})).toThrow(FormulaError)
  })
})

describe('formula.evaluateBool', () => {
  it('evaluates comparison expressions', () => {
    expect(evaluateBool('kW > 4', { kW: 6 })).toBe(true)
    expect(evaluateBool('kW > 4', { kW: 2 })).toBe(false)
  })

  it('evaluates boolean variables', () => {
    expect(evaluateBool('offshore == true', { offshore: true })).toBe(true)
    expect(evaluateBool('offshore == true', { offshore: false })).toBe(false)
  })

  it('coerces numeric result to bool (0 = false, nonzero = true)', () => {
    expect(evaluateBool('1', {})).toBe(true)
    expect(evaluateBool('0', {})).toBe(false)
  })
})
