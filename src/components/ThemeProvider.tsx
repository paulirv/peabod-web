"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Theme, themes, defaultTheme, getThemeById } from "@/lib/themes";

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  // Set data attribute for potential CSS selectors
  root.setAttribute("data-theme", theme.id);
  root.setAttribute("data-dark", theme.isDark ? "true" : "false");

  // Apply CSS custom properties
  const colors = theme.colors;
  root.style.setProperty("--background", colors.background);
  root.style.setProperty("--foreground", colors.foreground);
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--primary-foreground", colors.primaryForeground);
  root.style.setProperty("--secondary", colors.secondary);
  root.style.setProperty("--secondary-foreground", colors.secondaryForeground);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-foreground", colors.accentForeground);
  root.style.setProperty("--muted", colors.muted);
  root.style.setProperty("--muted-foreground", colors.mutedForeground);
  root.style.setProperty("--border", colors.border);
  root.style.setProperty("--card", colors.card);
  root.style.setProperty("--card-foreground", colors.cardForeground);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Can't access localStorage during SSR
    if (typeof window === "undefined") {
      return defaultTheme;
    }
    const savedThemeId = localStorage.getItem("peabod-theme");
    return savedThemeId ? getThemeById(savedThemeId) : defaultTheme;
  });
  const [mounted, setMounted] = useState(false);

  // Set mounted state - intentionally setting state on mount for hydration
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- required for SSR hydration
    setMounted(true);
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (themeId: string) => {
    const newTheme = getThemeById(themeId);
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("peabod-theme", themeId);
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <div style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  // Return default values during SSR or when outside provider (for static generation)
  if (context === undefined) {
    return {
      theme: defaultTheme,
      setTheme: () => {},
      themes,
    };
  }
  return context;
}
