'use client'
import { useState } from 'react'
import { useConfiguratorStore } from '@/lib/configurator/store'

export function AddCustomLineModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const add = useConfiguratorStore(s => s.addCustomLine)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-80 space-y-3 rounded bg-background p-4 shadow-lg">
        <div className="text-sm font-medium">Add custom line</div>
        <input
          className="w-full rounded border px-2 py-1"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="w-full rounded border px-2 py-1"
          type="number"
          placeholder="Price"
          value={price}
          onChange={e => setPrice(Number(e.target.value))}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded border px-3 py-1 text-sm">
            Cancel
          </button>
          <button
            disabled={!name || !price}
            onClick={() => {
              add(name, price)
              onClose()
            }}
            className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
