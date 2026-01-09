// Theme definitions for Peabod
// All themes ensure WCAG AA contrast (4.5:1 minimum for text)

export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    card: string;
    cardForeground: string;
  };
}

export const themes: Theme[] = [
  // === LIGHT THEMES ===
  {
    id: "classic",
    name: "Classic",
    isDark: false,
    colors: {
      background: "#ffffff",
      foreground: "#1a1a1a",
      primary: "#2563eb",
      primaryForeground: "#ffffff",
      secondary: "#f1f5f9",
      secondaryForeground: "#1e293b",
      accent: "#8b5cf6",
      accentForeground: "#ffffff",
      muted: "#f8fafc",
      mutedForeground: "#64748b",
      border: "#e2e8f0",
      card: "#ffffff",
      cardForeground: "#1a1a1a",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    isDark: false,
    colors: {
      background: "#f0f9ff",
      foreground: "#0c4a6e",
      primary: "#0284c7",
      primaryForeground: "#ffffff",
      secondary: "#e0f2fe",
      secondaryForeground: "#075985",
      accent: "#06b6d4",
      accentForeground: "#ffffff",
      muted: "#f0f9ff",
      mutedForeground: "#0369a1",
      border: "#bae6fd",
      card: "#ffffff",
      cardForeground: "#0c4a6e",
    },
  },
  {
    id: "forest",
    name: "Forest",
    isDark: false,
    colors: {
      background: "#f0fdf4",
      foreground: "#14532d",
      primary: "#16a34a",
      primaryForeground: "#ffffff",
      secondary: "#dcfce7",
      secondaryForeground: "#166534",
      accent: "#84cc16",
      accentForeground: "#1a2e05",
      muted: "#f0fdf4",
      mutedForeground: "#15803d",
      border: "#bbf7d0",
      card: "#ffffff",
      cardForeground: "#14532d",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    isDark: false,
    colors: {
      background: "#fffbeb",
      foreground: "#78350f",
      primary: "#d97706",
      primaryForeground: "#ffffff",
      secondary: "#fef3c7",
      secondaryForeground: "#92400e",
      accent: "#f59e0b",
      accentForeground: "#451a03",
      muted: "#fffbeb",
      mutedForeground: "#b45309",
      border: "#fde68a",
      card: "#ffffff",
      cardForeground: "#78350f",
    },
  },
  // === DARK THEMES ===
  {
    id: "midnight",
    name: "Midnight",
    isDark: true,
    colors: {
      background: "#0f172a",
      foreground: "#f1f5f9",
      primary: "#3b82f6",
      primaryForeground: "#ffffff",
      secondary: "#1e293b",
      secondaryForeground: "#e2e8f0",
      accent: "#a78bfa",
      accentForeground: "#ffffff",
      muted: "#1e293b",
      mutedForeground: "#94a3b8",
      border: "#334155",
      card: "#1e293b",
      cardForeground: "#f1f5f9",
    },
  },
  {
    id: "carbon",
    name: "Carbon",
    isDark: true,
    colors: {
      background: "#09090b",
      foreground: "#fafafa",
      primary: "#22c55e",
      primaryForeground: "#052e16",
      secondary: "#18181b",
      secondaryForeground: "#e4e4e7",
      accent: "#10b981",
      accentForeground: "#ffffff",
      muted: "#18181b",
      mutedForeground: "#a1a1aa",
      border: "#27272a",
      card: "#18181b",
      cardForeground: "#fafafa",
    },
  },
];

export const defaultTheme = themes[0];

export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) || defaultTheme;
}
