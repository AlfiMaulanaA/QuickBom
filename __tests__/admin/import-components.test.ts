import { describe, it, expect, vi } from 'vitest'
import { importComponentRows } from '@/lib/configurator/import-components'

describe('importComponentRows', () => {
  it('validates rows and calls upsert for valid ones, reports errors', async () => {
    const prismaMock: any = {
      productCategory: {
        findMany: vi.fn().mockResolvedValue([
          { id: 1, code: 'MECH' },
          { id: 2, code: 'ELEC' },
        ]),
      },
      component: {
        findMany: vi.fn().mockResolvedValue([{ itemCode: 'EXIST-1' }]),
        upsert: vi.fn().mockResolvedValue({ id: 99 }),
      },
    }
    const rows = [
      { itemCode: 'A-1', name: 'A', uom: 'EA', categoryCode: 'MECH', currentUnitCost: 100, currentListPrice: 150 },
      { itemCode: 'EXIST-1', name: 'Existing', uom: 'EA', categoryCode: 'MECH' },
      { itemCode: '', name: 'bad', uom: 'EA', categoryCode: 'MECH' },
      { itemCode: 'A-2', name: 'B', uom: 'EA', categoryCode: 'UNKNOWN' },
    ]
    const result = await importComponentRows(prismaMock, rows)
    expect(result.inserted).toBe(1)
    expect(result.updated).toBe(1)
    expect(result.errors).toHaveLength(2)
    expect(prismaMock.component.upsert).toHaveBeenCalledTimes(2)
  })
})
