import * as XLSX from 'xlsx'

export interface BoqInput {
  configurationId: number
  productCode: string
  productName: string
  lines: Array<{
    itemCode: string
    name: string
    categoryCode: string
    qty: number
    uom: string
    unitCost: number
    unitListPrice: number
    lineTotal: number
    source: string
    remarks: string | null
  }>
  subtotalCost: number
  subtotalList: number
  marginPct: number
  currency: string
}

const HEADER = [
  '#', 'Item Code', 'Description', 'Category', 'Qty', 'UoM',
  'Unit Cost', 'Unit List', 'Total Cost', 'Total List', 'Margin %', 'Source', 'Remarks',
]

export function buildBoqXlsx(input: BoqInput): Buffer {
  const rows: any[][] = [HEADER]
  input.lines.forEach((l, i) => {
    const totalCost = l.qty * l.unitCost
    const marginPct =
      l.lineTotal === 0 ? 0 : ((l.lineTotal - totalCost) / l.lineTotal) * 100
    rows.push([
      i + 1,
      l.itemCode,
      l.name,
      l.categoryCode,
      l.qty,
      l.uom,
      l.unitCost,
      l.unitListPrice,
      totalCost,
      l.lineTotal,
      Number(marginPct.toFixed(1)),
      l.source,
      l.remarks ?? '',
    ])
  })
  rows.push([])
  rows.push([
    '', '', '', '', '', '', '', 'Subtotal',
    input.subtotalCost, input.subtotalList,
    Number(input.marginPct.toFixed(1)),
    '', '',
  ])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [
    { wch: 4 }, { wch: 16 }, { wch: 40 }, { wch: 10 }, { wch: 6 },
    { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 10 }, { wch: 16 }, { wch: 24 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'BOQ')

  const meta = XLSX.utils.aoa_to_sheet([
    ['configId', input.configurationId],
    ['product', `${input.productCode} — ${input.productName}`],
    ['currency', input.currency],
    ['generatedAt', new Date().toISOString()],
  ])
  XLSX.utils.book_append_sheet(wb, meta, 'Meta')
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}
