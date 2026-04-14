export function StatusPill({ status }: { status: string }) {
  const color =
    status === 'DRAFT'
      ? 'bg-slate-200 text-slate-800'
      : status === 'QUOTED'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'APPROVED'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-zinc-200 text-zinc-800'
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${color}`}>{status}</span>
}
