import { evaluateBool, FormulaError } from './formula'
import type { ComponentLike } from './defaults'
import type { InputScope, PricedLine, Recommendation, RuleViolation } from './types'

export interface RuleLike {
  id: number
  ruleType: 'REQUIRES' | 'EXCLUDES' | 'REPLACES' | 'SUGGESTS'
  sourceComponentId: number
  targetComponentId: number
  condition: string | null
}

const MAX_ITERATIONS = 10

function conditionHolds(condition: string | null, inputs: InputScope): boolean {
  if (!condition) return true
  try {
    return evaluateBool(condition, inputs)
  } catch (err) {
    if (err instanceof FormulaError) return false
    throw err
  }
}

function makeLine(component: ComponentLike, source: PricedLine['source']): PricedLine {
  return {
    componentId: component.id,
    itemCode: component.itemCode,
    name: component.name,
    categoryCode: component.category.code,
    uom: component.uom,
    qty: 1,
    unitCost: component.currentUnitCost,
    unitListPrice: component.currentListPrice,
    lineTotal: 0,
    source,
    isService: component.isService,
  }
}

const USER_SOURCES: ReadonlySet<PricedLine['source']> = new Set([
  'DEFAULT-LOCKED',
  'DEFAULT',
  'OPTIONAL',
  'ADDED',
])

export function applyRules(
  initial: PricedLine[],
  rules: RuleLike[],
  inputs: InputScope,
  components: ComponentLike[],
): { lines: PricedLine[]; violations: RuleViolation[]; recommendations: Recommendation[] } {
  const componentById = new Map(components.map(c => [c.id, c]))
  let lines = [...initial]
  const violations: RuleViolation[] = []
  const recommendations: Recommendation[] = []

  let changed = true
  let iterations = 0

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false
    iterations++
    const hasComponent = (cid: number) => lines.some(l => l.componentId === cid)

    for (const r of rules) {
      if (r.ruleType === 'SUGGESTS') continue
      if (!hasComponent(r.sourceComponentId)) continue
      if (!conditionHolds(r.condition, inputs)) continue

      if (r.ruleType === 'EXCLUDES') {
        const targetLine = lines.find(l => l.componentId === r.targetComponentId)
        if (!targetLine) continue
        if (USER_SOURCES.has(targetLine.source)) {
          if (!violations.some(v => v.ruleId === r.id)) {
            violations.push({
              ruleId: r.id,
              ruleType: 'EXCLUDES',
              sourceComponentId: r.sourceComponentId,
              targetComponentId: r.targetComponentId,
              message: `Component ${r.targetComponentId} conflicts with ${r.sourceComponentId}`,
            })
          }
        } else {
          // Rule-added target: silently remove and mark changed so loop re-evaluates
          lines = lines.filter(l => l.componentId !== r.targetComponentId)
          changed = true
        }
      } else if (r.ruleType === 'REPLACES') {
        const target = componentById.get(r.targetComponentId)
        if (!target) continue
        if (!hasComponent(r.targetComponentId)) {
          lines = lines.filter(l => l.componentId !== r.sourceComponentId)
          lines.push(makeLine(target, 'RULE-REPLACED'))
          changed = true
        }
      } else if (r.ruleType === 'REQUIRES') {
        if (!hasComponent(r.targetComponentId)) {
          const target = componentById.get(r.targetComponentId)
          if (!target) continue
          lines.push(makeLine(target, 'RULE-ADDED'))
          changed = true
        }
      }
    }
  }

  if (changed && iterations >= MAX_ITERATIONS) {
    violations.push({
      ruleId: 0,
      ruleType: 'CYCLE',
      sourceComponentId: 0,
      targetComponentId: 0,
      message: `Rule evaluation did not converge after ${MAX_ITERATIONS} iterations (possible cycle)`,
    })
  }

  // Detect logical contradictions: a RULE-ADDED component that is itself the source
  // of an EXCLUDES violation against a user-included component indicates a semantic cycle
  // (e.g. REQUIRES A→B combined with EXCLUDES B→A where A is user-included).
  const ruleAddedIds = new Set(lines.filter(l => l.source === 'RULE-ADDED').map(l => l.componentId))
  const hasLogicalCycle = violations.some(
    v =>
      v.ruleType === 'EXCLUDES' &&
      ruleAddedIds.has(v.sourceComponentId),
  )
  if (hasLogicalCycle && !violations.some(v => v.ruleType === 'CYCLE')) {
    violations.push({
      ruleId: 0,
      ruleType: 'CYCLE',
      sourceComponentId: 0,
      targetComponentId: 0,
      message: 'Rule cycle detected: a RULE-ADDED component excludes its own prerequisite (possible cycle)',
    })
  }

  // SUGGESTS pass — non-mutating, runs after stable lines are known
  for (const r of rules) {
    if (r.ruleType !== 'SUGGESTS') continue
    if (!lines.some(l => l.componentId === r.sourceComponentId)) continue
    if (!conditionHolds(r.condition, inputs)) continue
    if (lines.some(l => l.componentId === r.targetComponentId)) continue
    recommendations.push({
      componentId: r.targetComponentId,
      reason: `Suggested by component ${r.sourceComponentId}`,
    })
  }

  return { lines, violations, recommendations }
}
