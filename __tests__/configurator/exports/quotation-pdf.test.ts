import { describe, it, expect } from 'vitest'
import { buildQuotationPdf, type QuoteInput } from '@/lib/configurator/exports/quotation-pdf'

const sample: QuoteInput = {
  configurationId: 42,
  productCode: 'RCP-SCH-42U',
  productName: 'RCP Schneider NetShelter 42U',
  draftName: null,
  inputsSummary: 'rackU=42, kW=6, offshore=false',
  lines: [
    {
      itemCode: 'MEC-FRM-42U', name: 'Schneider NetShelter 42U frame', categoryCode: 'MECH',
      qty: 1, uom: 'EA', unitListPrice: 24000, lineTotal: 24000, source: 'DEFAULT-LOCKED',
    },
    {
      itemCode: 'ELE-PDU-32A', name: 'PDU 32A metered', categoryCode: 'ELEC',
      qty: 2, uom: 'EA', unitListPrice: 12500, lineTotal: 25000, source: 'DEFAULT-LOCKED',
    },
  ],
  subtotalList: 49000,
  branding: {
    companyName: 'Test Co',
    companyAddress: 'Addr',
    companyEmail: 'e@e.com',
    logoUrl: null,
    currency: 'IDR',
    taxPct: 11,
    terms: 'Test terms',
  },
}

describe('buildQuotationPdf', () => {
  it('produces a non-empty PDF buffer starting with %PDF-', async () => {
    const buf = await buildQuotationPdf(sample)
    expect(buf.length).toBeGreaterThan(1000)
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-')
  })
})
