import { Parser } from 'expr-eval'
import type { InputScope } from './types'

export class FormulaError extends Error {
  constructor(message: string, public expression: string, public cause?: unknown) {
    super(message)
    this.name = 'FormulaError'
  }
}

// Functions exposed via parser.functions (variadic / multi-arg)
const ALLOWED_FUNCTIONS = new Set([
  'ceil', 'floor', 'round', 'max', 'min', 'abs', 'if',
])

// Unary operators exposed via parser.unaryOps — includes math functions like
// sin, cos, ceil, floor, round, abs, sqrt, log, etc.
// We keep only the safe arithmetic/rounding subset plus sign operators.
const ALLOWED_UNARY_OPS = new Set([
  'ceil', 'floor', 'round', 'abs', '-', '+', 'not', '!',
])

function buildParser(): Parser {
  const parser = new Parser({
    operators: {
      logical: true,
      comparison: true,
      conditional: true,
    },
  })

  // Remove any multi-arg functions not on the allowlist.
  for (const fnName of Object.keys(parser.functions)) {
    if (!ALLOWED_FUNCTIONS.has(fnName)) {
      delete parser.functions[fnName]
    }
  }

  // Remove any unary operators (which include trig, log, sqrt, etc.)
  // that are not on the allowlist. This is what actually blocks sin(), cos(), etc.
  for (const opName of Object.keys(parser.unaryOps)) {
    if (!ALLOWED_UNARY_OPS.has(opName)) {
      delete parser.unaryOps[opName]
    }
  }

  return parser
}

export function evaluateNumber(expression: string, scope: InputScope): number {
  const parser = buildParser()
  let expr
  try {
    expr = parser.parse(expression)
  } catch (err) {
    throw new FormulaError(`Parse error: ${(err as Error).message}`, expression, err)
  }
  try {
    const result = expr.evaluate(scope)
    if (typeof result !== 'number' || Number.isNaN(result)) {
      throw new Error(`Expected number, got ${typeof result}`)
    }
    return result
  } catch (err) {
    if (err instanceof FormulaError) throw err
    throw new FormulaError(`Eval error: ${(err as Error).message}`, expression, err)
  }
}

export function evaluateBool(expression: string, scope: InputScope): boolean {
  const parser = buildParser()
  let expr
  try {
    expr = parser.parse(expression)
  } catch (err) {
    throw new FormulaError(`Parse error: ${(err as Error).message}`, expression, err)
  }
  try {
    const result = expr.evaluate(scope)
    return Boolean(result)
  } catch (err) {
    if (err instanceof FormulaError) throw err
    throw new FormulaError(`Eval error: ${(err as Error).message}`, expression, err)
  }
}
