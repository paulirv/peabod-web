"use client";

import { useState } from "react";
import { useTheme } from "./ThemeProvider";

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const lightThemes = themes.filter((t) => !t.isDark);
  const darkThemes = themes.filter((t) => t.isDark);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
        style={{
          backgroundColor: "var(--secondary)",
          color: "var(--secondary-foreground)",
        }}
        aria-label="Choose theme"
      >
        <span
          className="w-4 h-4 rounded-full border-2"
          style={{
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.border,
          }}
        />
        <span className="text-sm font-medium hidden sm:inline">{theme.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg z-50 p-4"
            style={{
              backgroundColor: "var(--card)",
              color: "var(--card-foreground)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
                Light Themes
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {lightThemes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 p-2 rounded-md transition-all"
                    style={{
                      backgroundColor: t.colors.secondary,
                      color: t.colors.secondaryForeground,
                      outline: theme.id === t.id ? `2px solid ${t.colors.primary}` : "none",
                      outlineOffset: "1px",
                    }}
                  >
                    <div className="flex -space-x-1">
                      <span
                        className="w-4 h-4 rounded-full border"
                        style={{
                          backgroundColor: t.colors.background,
                          borderColor: t.colors.border,
                        }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border"
                        style={{
                          backgroundColor: t.colors.primary,
                          borderColor: t.colors.border,
                        }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border"
                        style={{
                          backgroundColor: t.colors.accent,
                          borderColor: t.colors.border,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
                Dark Themes
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {darkThemes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 p-2 rounded-md transition-all"
                    style={{
                      backgroundColor: t.colors.secondary,
                      color: t.colors.secondaryForeground,
                      outline: theme.id === t.id ? `2px solid ${t.colors.primary}` : "none",
                      outlineOffset: "1px",
                    }}
                  >
                    <div className="flex -space-x-1">
                      <span
                        className="w-4 h-4 rounded-full border"
                        style={{
                          backgroundColor: t.colors.background,
                          borderColor: t.colors.border,
                        }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border"
                        style={{
                          backgroundColor: t.colors.primary,
                          borderColor: t.colors.border,
                        }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border"
                        style={{
                          backgroundColor: t.colors.accent,
                          borderColor: t.colors.border,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
