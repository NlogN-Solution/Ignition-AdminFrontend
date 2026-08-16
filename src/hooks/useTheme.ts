import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect } from "react";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: "system",
      setPreference: (preference) => set({ preference }),
    }),
    { name: "ignition-theme" },
  ),
);

function applyTheme(preference: ThemePreference) {
  const isDark =
    preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

/** Mounted once at the app root — keeps the `dark` class on <html> in sync with the stored preference and OS changes. */
export function useThemeEffect() {
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    applyTheme(preference);
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [preference]);
}
