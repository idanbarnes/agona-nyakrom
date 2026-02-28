import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_DEBOUNCE_MS = 800

function readDraft(key) {
  if (typeof window === 'undefined' || !key) {
    return null
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function useDraftAutosave({
  key,
  data,
  enabled = true,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}) {
  const [snapshotVersion, setSnapshotVersion] = useState(0)
  const hydratedRef = useRef(false)
  const saveTimerRef = useRef(null)

  useEffect(() => {
    hydratedRef.current = false
  }, [key])

  const savedSnapshot = useMemo(() => {
    void snapshotVersion
    if (!enabled || !key) {
      return null
    }
    return readDraft(key)
  }, [enabled, key, snapshotVersion])

  useEffect(() => {
    if (!enabled || !key || typeof window === 'undefined') {
      return undefined
    }

    if (!hydratedRef.current) {
      hydratedRef.current = true
      return undefined
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          key,
          JSON.stringify({
            data,
            savedAt: new Date().toISOString(),
          }),
        )
      } catch {
        // Ignore storage quota and serialization failures.
      }
    }, debounceMs)

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [data, debounceMs, enabled, key])

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined' || !key) {
      return
    }
    window.localStorage.removeItem(key)
    setSnapshotVersion((current) => current + 1)
  }, [key])

  return {
    restoredDraft: savedSnapshot?.data || null,
    restoredAt: savedSnapshot?.savedAt || null,
    clearDraft,
  }
}
