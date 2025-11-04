import { useStore } from "@tanstack/react-store";
import { Store } from "@tanstack/store";

export type DashboardPrefs = {
  showNews: boolean;
  showArbitration: boolean;
  showAlerts: boolean;
  showEvents: boolean;
  showFissures: boolean;
  showBounties: boolean;
  showSortie: boolean;
  showArchon: boolean;
  showInvasions: boolean;
  showCycles: boolean;
  showOmniFirst: boolean;
};

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
};

/**
 * Loads preferences from localStorage
 * Safe to call on server (returns defaults)
 */
function loadPrefsFromStorage(): DashboardPrefs {
  if (typeof window === "undefined") {
    return defaultPrefs;
  }

  try {
    const raw = localStorage.getItem("dashboard_prefs");
    if (raw) {
      const savedPrefs = JSON.parse(raw);
      if (savedPrefs && typeof savedPrefs === "object") {
        // Merge with defaults to ensure all keys exist
        const mergedPrefs = { ...defaultPrefs, ...savedPrefs };
        return mergedPrefs;
      }
    }
  } catch (error) {
    console.warn(
      "Failed to load dashboard preferences from localStorage:",
      error
    );
  }

  return defaultPrefs;
}

/**
 * Saves preferences to localStorage
 * Safe to call on server (no-op)
 */
function savePrefsToStorage(prefs: DashboardPrefs): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const prefsString = JSON.stringify(prefs);
    localStorage.setItem("dashboard_prefs", prefsString);
  } catch (error) {
    console.warn("Failed to save dashboard preferences to localStorage:", error);
  }
}

// Initialize store with loaded preferences
const initialPrefs = loadPrefsFromStorage();

/**
 * TanStack Store for dashboard preferences
 * Automatically handles reactivity and updates
 */
export const dashboardPrefsStore = new Store<DashboardPrefs>(initialPrefs);

// Subscribe to store changes to persist to localStorage
dashboardPrefsStore.subscribe((state) => {
  if (typeof window !== "undefined") {
    savePrefsToStorage(state);
  }
});

/**
 * React hook to access dashboard preferences
 * Automatically subscribes to store changes
 * @returns Current dashboard preferences
 */
export function useDashboardPrefs(): DashboardPrefs {
  return useStore(dashboardPrefsStore);
}

/**
 * Toggles a dashboard preference
 * @param key - The preference key to toggle
 */
export function togglePref(key: keyof DashboardPrefs): void {
  if (typeof window === "undefined") {
    console.warn("Cannot toggle preferences on server side");
    return;
  }

  dashboardPrefsStore.setState((prev) => ({
    ...prev,
    [key]: !prev[key],
  }));
}

/**
 * Sets a dashboard preference to a specific value
 * @param key - The preference key to set
 * @param value - The value to set
 */
export function setPref(key: keyof DashboardPrefs, value: boolean): void {
  if (typeof window === "undefined") {
    console.warn("Cannot set preferences on server side");
    return;
  }

  dashboardPrefsStore.setState((prev) => ({
    ...prev,
    [key]: value,
  }));
}

/**
 * Resets all preferences to defaults
 */
export function resetPrefs(): void {
  if (typeof window === "undefined") {
    return;
  }

  dashboardPrefsStore.setState(defaultPrefs);
}

