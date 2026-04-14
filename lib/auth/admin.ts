import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])

export async function requireAdmin(req: NextRequest | Request) {
  const auth = await requireAuth(req)
  if (!auth) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  if (!ADMIN_ROLES.has(auth.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }
  return { ok: true as const, auth }
}

export function isAdminRole(role: string | undefined): boolean {
  return !!role && ADMIN_ROLES.has(role)
}
