export interface Branding {
  companyName: string
  companyAddress: string
  companyEmail: string
  logoUrl: string | null
  currency: string
  taxPct: number
  terms: string
}

export function readBrandingFromEnv(): Branding {
  return {
    companyName: process.env.CONFIGURATOR_COMPANY_NAME ?? 'Your Company',
    companyAddress: process.env.CONFIGURATOR_COMPANY_ADDRESS ?? '',
    companyEmail: process.env.CONFIGURATOR_COMPANY_EMAIL ?? '',
    logoUrl: process.env.CONFIGURATOR_LOGO_URL || null,
    currency: process.env.CONFIGURATOR_CURRENCY ?? 'IDR',
    taxPct: Number(process.env.CONFIGURATOR_TAX_PCT ?? '0'),
    terms: process.env.CONFIGURATOR_QUOTE_TERMS ?? '',
  }
}

export function formatMoney(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return n.toLocaleString() + ' ' + currency
  }
}
