import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LayoutEntry {
  order: string[];
  hidden: string[];
  pinned: string[];
}

interface DashboardLayoutState {
  layouts: Record<string, LayoutEntry>;
  setOrder: (key: string, order: string[]) => void;
  toggleHidden: (key: string, widgetId: string, defaultOrder: string[]) => void;
  togglePinned: (key: string, widgetId: string, defaultOrder: string[]) => void;
  reset: (key: string) => void;
}

function ensureEntry(layouts: Record<string, LayoutEntry>, key: string, defaultOrder: string[]): LayoutEntry {
  return layouts[key] ?? { order: defaultOrder, hidden: [], pinned: [] };
}

export const useDashboardLayoutStore = create<DashboardLayoutState>()(
  persist(
    (set) => ({
      layouts: {},
      setOrder: (key, order) =>
        set((s) => ({ layouts: { ...s.layouts, [key]: { ...ensureEntry(s.layouts, key, order), order } } })),
      toggleHidden: (key, widgetId, defaultOrder) =>
        set((s) => {
          const entry = ensureEntry(s.layouts, key, defaultOrder);
          const hidden = entry.hidden.includes(widgetId) ? entry.hidden.filter((id) => id !== widgetId) : [...entry.hidden, widgetId];
          return { layouts: { ...s.layouts, [key]: { ...entry, hidden } } };
        }),
      togglePinned: (key, widgetId, defaultOrder) =>
        set((s) => {
          const entry = ensureEntry(s.layouts, key, defaultOrder);
          const pinned = entry.pinned.includes(widgetId) ? entry.pinned.filter((id) => id !== widgetId) : [...entry.pinned, widgetId];
          return { layouts: { ...s.layouts, [key]: { ...entry, pinned } } };
        }),
      reset: (key) =>
        set((s) => {
          const next = { ...s.layouts };
          delete next[key];
          return { layouts: next };
        }),
    }),
    { name: "ignition-dashboard-layout" },
  ),
);
