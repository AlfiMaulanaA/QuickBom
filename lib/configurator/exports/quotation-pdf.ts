import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Branding } from './branding'
import { formatMoney } from './branding'

export interface QuoteInput {
  configurationId: number
  productCode: string
  productName: string
  draftName: string | null
  inputsSummary: string
  lines: Array<{
    itemCode: string
    name: string
    categoryCode: string
    qty: number
    uom: string
    unitListPrice: number
    lineTotal: number
    source: string
  }>
  subtotalList: number
  branding: Branding
}

export async function buildQuotationPdf(q: QuoteInput): Promise<Buffer> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const { branding: b } = q
  const quoteNo = `Q-${q.configurationId}`
  const dateStr = new Date().toISOString().slice(0, 10)

  doc.setFontSize(14)
  doc.text(b.companyName, 40, 50)
  doc.setFontSize(9)
  if (b.companyAddress) doc.text(b.companyAddress, 40, 66)
  if (b.companyEmail) doc.text(b.companyEmail, 40, 80)
  doc.setFontSize(10)
  doc.text(`Quote: ${quoteNo}`, 400, 50)
  doc.text(`Date: ${dateStr}`, 400, 64)

  doc.setLineWidth(0.5)
  doc.line(40, 92, 555, 92)

  doc.setFontSize(11)
  doc.text(`Product: ${q.productName} (${q.productCode})`, 40, 110)
  doc.setFontSize(9)
  doc.text(`Prepared for: ${q.draftName ?? '—'}`, 40, 124)
  doc.text(`Inputs: ${q.inputsSummary}`, 40, 138)

  const rows = q.lines.map((l, i) => [
    String(i + 1),
    l.name + (l.source === 'RULE-ADDED' ? '  (auto)' : ''),
    String(l.qty),
    l.uom,
    formatMoney(l.unitListPrice, b.currency),
    formatMoney(l.lineTotal, b.currency),
  ])

  autoTable(doc, {
    head: [['#', 'Description', 'Qty', 'UoM', 'Unit', 'Total']],
    body: rows,
    startY: 152,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [50, 50, 50] },
    columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' } },
  })

  const endY = (doc as any).lastAutoTable?.finalY ?? 200
  const taxAmount = b.taxPct > 0 ? q.subtotalList * (b.taxPct / 100) : 0
  const grand = q.subtotalList + taxAmount

  doc.setFontSize(10)
  const rightCol = 400
  doc.text(`Subtotal: ${formatMoney(q.subtotalList, b.currency)}`, rightCol, endY + 20)
  if (b.taxPct > 0) {
    doc.text(`Tax ${b.taxPct}%: ${formatMoney(taxAmount, b.currency)}`, rightCol, endY + 36)
  }
  doc.setFont('helvetica', 'bold')
  doc.text(`Grand Total: ${formatMoney(grand, b.currency)}`, rightCol, endY + 54)
  doc.setFont('helvetica', 'normal')

  if (b.terms) {
    doc.setFontSize(8)
    doc.text('Terms:', 40, endY + 90)
    const wrapped = doc.splitTextToSize(b.terms, 500)
    doc.text(wrapped, 40, endY + 102)
  }

  const out = doc.output('arraybuffer')
  return Buffer.from(out)
}
