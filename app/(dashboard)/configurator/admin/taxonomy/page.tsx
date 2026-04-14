'use client'
import { useEffect, useState } from 'react'
import { EntityPanel } from '@/components/admin/EntityPanel'

export default function TaxonomyPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/configurator/admin/groups')
      .then(r => r.ok ? r.json() : [])
      .then(gs => {
        setGroups(gs)
        if (gs.length && !selectedGroup) setSelectedGroup(gs[0].id)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Taxonomy</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <EntityPanel
          title="Groups"
          listUrl="/api/configurator/admin/groups"
          createUrl="/api/configurator/admin/groups"
          deleteUrl={id => `/api/configurator/admin/groups/${id}`}
          fields={[
            { key: 'code', label: 'Code', placeholder: 'code (e.g. FREE_STANDING)' },
            { key: 'name', label: 'Name', placeholder: 'name' },
          ]}
          display={r => `${r.code} — ${r.name}`}
        />
        <div className="rounded border p-3">
          <h3 className="mb-2 font-medium">Sub Groups</h3>
          <label className="mb-2 block text-xs text-muted-foreground">
            Group:
            <select
              className="ml-2 rounded border px-2 py-1 text-sm"
              value={selectedGroup ?? ''}
              onChange={e => setSelectedGroup(Number(e.target.value))}
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </label>
          {selectedGroup && (
            <EntityPanel
              key={selectedGroup}
              title=""
              listUrl={`/api/configurator/admin/subgroups?groupId=${selectedGroup}`}
              createUrl="/api/configurator/admin/subgroups"
              deleteUrl={id => `/api/configurator/admin/subgroups/${id}`}
              fields={[
                { key: 'code', label: 'Code' },
                { key: 'name', label: 'Name' },
              ]}
              display={r => `${r.code} — ${r.name}`}
              extraCreatePayload={{ groupId: selectedGroup }}
            />
          )}
        </div>
        <EntityPanel
          title="Categories"
          listUrl="/api/configurator/admin/categories"
          createUrl="/api/configurator/admin/categories"
          deleteUrl={id => `/api/configurator/admin/categories/${id}`}
          fields={[
            { key: 'code', label: 'Code', placeholder: 'MECH / ELEC / ELX / SVC' },
            { key: 'name', label: 'Name' },
          ]}
          display={r => `${r.code} — ${r.name}`}
        />
      </div>
    </div>
  )
}
