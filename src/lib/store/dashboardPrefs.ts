import { useEffect, useState } from 'react'

export type DashboardPrefs = {
  showNews: boolean
  showArbitration: boolean
  showAlerts: boolean
  showEvents: boolean
  showFissures: boolean
  showBounties: boolean
  showSortie: boolean
  showArchon: boolean
  showInvasions: boolean
  showCycles: boolean
  showOmniFirst: boolean
}

const defaultPrefs: DashboardPrefs = {
  showNews: true,
  showArbitration: true,
  showAlerts: true,
  showEvents: true,
  showFissures: true,
  showBounties: true,
  showSortie: true,
  showArchon: true,
  showInvasions: true,
  showCycles: true,
  showOmniFirst: false,
}

// Global state and force update mechanism
let globalPrefs: DashboardPrefs = defaultPrefs
let forceUpdateCounter = 0
let forceUpdateCallbacks: Set<() => void> = new Set()

function loadPrefsFromStorage(): DashboardPrefs {
  if (typeof window === 'undefined') {
    return defaultPrefs
  }

  try {
    const raw = localStorage.getItem('dashboard_prefs')
    if (raw) {
      const savedPrefs = JSON.parse(raw)
      if (savedPrefs && typeof savedPrefs === 'object') {
        const mergedPrefs = { ...defaultPrefs, ...savedPrefs }
        return mergedPrefs
      }
    }
  } catch (error) {
    console.warn(
      'Failed to load dashboard preferences from localStorage:',
      error,
    )
  }

  return defaultPrefs
}

function savePrefsToStorage(prefs: DashboardPrefs) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const prefsString = JSON.stringify(prefs)
    localStorage.setItem('dashboard_prefs', prefsString)
  } catch (error) {
    console.warn('Failed to save dashboard preferences to localStorage:', error)
  }
}

function forceUpdate() {
  forceUpdateCounter++
  forceUpdateCallbacks.forEach((callback) => callback())
}

export function useDashboardPrefs() {
  const [isClient, setIsClient] = useState(false)
  const [prefs, setPrefs] = useState<DashboardPrefs>(defaultPrefs)
  const [, setUpdateCounter] = useState(0)

  useEffect(() => {
    setIsClient(true)

    if (typeof window !== 'undefined') {
      // Load initial preferences
      globalPrefs = loadPrefsFromStorage()
      setPrefs(globalPrefs)

      // Add force update callback
      const callback = () => {
        setPrefs({ ...globalPrefs })
        setUpdateCounter((prev) => prev + 1)
      }
      forceUpdateCallbacks.add(callback)

      return () => {
        forceUpdateCallbacks.delete(callback)
      }
    }
  }, [])

  return isClient ? prefs : defaultPrefs
}

export function togglePref(key: keyof DashboardPrefs) {
  if (typeof window === 'undefined') {
    console.warn('Cannot toggle preferences on server side')
    return
  }

  const currentValue = globalPrefs[key]
  const newValue = !currentValue
  globalPrefs = { ...globalPrefs, [key]: newValue }

  savePrefsToStorage(globalPrefs)
  forceUpdate()
}

