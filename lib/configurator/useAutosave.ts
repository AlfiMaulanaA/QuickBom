'use client'
import { useEffect, useRef } from 'react'
import { useConfiguratorStore, getConfiguratorStore } from './store'

const AUTOSAVE_INTERVAL_MS = 10_000

async function flush() {
  const s = getConfiguratorStore().getState()
  if (!s.isDirty || !s.configurationId) return
  try {
    const r = await fetch(`/api/configurator/configurations/${s.configurationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: s.name || null,
        inputs: s.inputs,
        selections: Array.from(s.selections.values()),
        adjustments: s.adjustments,
      }),
    })
    if (r.ok) getConfiguratorStore().getState().markSaved()
  } catch {
    // swallow — next autosave retry
  }
}

export function useAutosave() {
  const isDirty = useConfiguratorStore(s => s.isDirty)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(flush, AUTOSAVE_INTERVAL_MS)
    const onBlur = () => { void flush() }
    const onVis = () => { if (document.visibilityState === 'hidden') void flush() }
    window.addEventListener('beforeunload', onBlur)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      window.removeEventListener('beforeunload', onBlur)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return { isDirty, saveNow: flush }
}
