import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedLeadFilter {
  id: string;
  name: string;
  status?: string;
  priority?: string;
  source?: string;
  assignedTo?: string;
}

interface SavedLeadFiltersState {
  filters: SavedLeadFilter[];
  save: (filter: Omit<SavedLeadFilter, "id">) => void;
  remove: (id: string) => void;
}

export const useSavedLeadFilters = create<SavedLeadFiltersState>()(
  persist(
    (set) => ({
      filters: [],
      save: (filter) => set((s) => ({ filters: [...s.filters, { ...filter, id: crypto.randomUUID() }] })),
      remove: (id) => set((s) => ({ filters: s.filters.filter((f) => f.id !== id) })),
    }),
    { name: "ignition-lead-saved-filters" },
  ),
);
