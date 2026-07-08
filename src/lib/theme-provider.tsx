import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { themeQuery } from "@/lib/queries";
import { applyTheme, mergeTheme, type ThemeConfig } from "@/lib/theme-config";

interface ThemeContextValue {
  mode: "light" | "dark";
  toggleMode: () => void;
  setMode: (m: "light" | "dark") => void;
  config: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const MODE_KEY = "menu-color-mode";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<"light" | "dark">("light");
  const { data: themeRow } = useQuery(themeQuery);

  const config = useMemo(
    () => mergeTheme((themeRow?.config as Partial<ThemeConfig>) ?? null),
    [themeRow],
  );

  // Hydrate mode preference.
  useEffect(() => {
    const stored = localStorage.getItem(MODE_KEY) as "light" | "dark" | null;
    if (stored === "light" || stored === "dark") {
      setModeState(stored);
    } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      setModeState("dark");
    }
  }, []);

  // Apply dark class.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  // Apply live theme tokens.
  useEffect(() => {
    applyTheme(config);
  }, [config]);

  const setMode = useCallback((m: "light" | "dark") => {
    setModeState(m);
    localStorage.setItem(MODE_KEY, m);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(MODE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ mode, toggleMode, setMode, config }),
    [mode, toggleMode, setMode, config],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
