import { NextRequest, NextResponse } from 'next/server'
import { price } from '@/lib/configurator'
import { requireAuth } from '@/lib/auth'
import type { PriceRequest } from '@/lib/configurator/types'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: PriceRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body?.productId !== 'number') {
    return NextResponse.json({ error: 'productId required' }, { status: 400 })
  }
  body.inputs = body.inputs ?? {}
  body.selections = body.selections ?? []
  body.adjustments = body.adjustments ?? []

  try {
    const result = await price(body)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
