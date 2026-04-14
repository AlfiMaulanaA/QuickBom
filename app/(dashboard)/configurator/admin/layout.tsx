import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { isAdminRole } from '@/lib/auth/admin'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieHeader = cookies().toString()
  const auth = await requireAuth(
    new Request('http://local/', { headers: { cookie: cookieHeader } }),
  )
  if (!auth || !isAdminRole(auth.role)) redirect('/configurator')

  return (
    <div className="flex gap-6 p-6">
      <nav className="w-52 shrink-0 space-y-1 text-sm">
        <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Admin</div>
        <Link href="/configurator/admin" className="block rounded px-2 py-1 hover:bg-muted">
          Dashboard
        </Link>
        <Link href="/configurator/admin/taxonomy" className="block rounded px-2 py-1 hover:bg-muted">
          Taxonomy
        </Link>
        <Link href="/configurator/admin/products" className="block rounded px-2 py-1 hover:bg-muted">
          Products
        </Link>
        <Link href="/configurator/admin/components" className="block rounded px-2 py-1 hover:bg-muted">
          Components
        </Link>
        <div className="pt-4">
          <Link href="/configurator" className="block rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted">
            ← Back to configurator
          </Link>
        </div>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  )
}
