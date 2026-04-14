import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { buildBoqXlsx, type BoqInput } from '@/lib/configurator/exports/boq-xlsx'

const sample: BoqInput = {
  configurationId: 42,
  productCode: 'RCP-SCH-42U',
  productName: 'RCP Schneider NetShelter 42U',
  lines: [
    {
      itemCode: 'MEC-FRM-42U', name: 'Frame', categoryCode: 'MECH',
      qty: 1, uom: 'EA', unitCost: 18000, unitListPrice: 24000,
      lineTotal: 24000, source: 'DEFAULT-LOCKED', remarks: null,
    },
    {
      itemCode: 'ELE-PDU-32A', name: 'PDU', categoryCode: 'ELEC',
      qty: 2, uom: 'EA', unitCost: 8500, unitListPrice: 12500,
      lineTotal: 25000, source: 'DEFAULT-LOCKED', remarks: null,
    },
  ],
  subtotalCost: 35000,
  subtotalList: 49000,
  marginPct: 28.6,
  currency: 'IDR',
}

describe('buildBoqXlsx', () => {
  it('produces a valid xlsx buffer parseable by SheetJS', () => {
    const buf = buildBoqXlsx(sample)
    expect(buf.length).toBeGreaterThan(500)
    const wb = XLSX.read(buf, { type: 'buffer' })
    expect(wb.SheetNames).toContain('BOQ')
    expect(wb.SheetNames).toContain('Meta')
    const rows = XLSX.utils.sheet_to_json(wb.Sheets['BOQ'], { header: 1 }) as any[][]
    expect(rows[0]).toEqual([
      '#', 'Item Code', 'Description', 'Category', 'Qty', 'UoM',
      'Unit Cost', 'Unit List', 'Total Cost', 'Total List', 'Margin %', 'Source', 'Remarks',
    ])
    expect(rows.length).toBeGreaterThanOrEqual(4)
  })
})
