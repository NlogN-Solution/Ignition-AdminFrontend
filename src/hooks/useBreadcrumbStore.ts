import { create } from "zustand";

interface BreadcrumbState {
  label: string | null;
  setLabel: (label: string | null) => void;
}

/** Detail pages call setLabel(record display name) so the trailing crumb shows a real name instead of "Detail". */
export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  label: null,
  setLabel: (label) => set({ label }),
}));
