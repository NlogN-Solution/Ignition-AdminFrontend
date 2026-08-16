import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  pinnedPaths: string[];
  togglePinned: (path: string) => void;
  recentPaths: string[];
  pushRecent: (path: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      pinnedPaths: [],
      togglePinned: (path) =>
        set((s) => ({
          pinnedPaths: s.pinnedPaths.includes(path) ? s.pinnedPaths.filter((p) => p !== path) : [...s.pinnedPaths, path],
        })),
      recentPaths: [],
      pushRecent: (path) =>
        set((s) => ({
          recentPaths: [path, ...s.recentPaths.filter((p) => p !== path)].slice(0, 5),
        })),
    }),
    {
      name: "ignition-ui",
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, pinnedPaths: s.pinnedPaths, recentPaths: s.recentPaths }),
    },
  ),
);
