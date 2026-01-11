"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeProvider";

interface FooterProps {
  siteName?: string;
}

export default function Footer({ siteName = "Site Name" }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme, themes } = useTheme();
  const lightThemes = themes.filter((t) => !t.isDark);
  const darkThemes = themes.filter((t) => t.isDark);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowThemePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <footer
      className="border-t mt-auto"
      style={{
        backgroundColor: "var(--muted)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <p
            className="text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            &copy; {currentYear} {siteName}. All rights reserved.
          </p>

          {/* Theme Picker Chip */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: "var(--secondary)",
                color: "var(--secondary-foreground)",
              }}
              aria-label="Change theme"
              aria-expanded={showThemePicker}
            >
              <div className="flex -space-x-1">
                <span
                  className="w-3 h-3 rounded-full border"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  }}
                />
                <span
                  className="w-3 h-3 rounded-full border"
                  style={{
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.border,
                  }}
                />
                <span
                  className="w-3 h-3 rounded-full border"
                  style={{
                    backgroundColor: theme.colors.accent,
                    borderColor: theme.colors.border,
                  }}
                />
              </div>
              {theme.name}
              <svg
                className={`w-3 h-3 transition-transform ${showThemePicker ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>

            {/* Theme Picker Dropdown */}
            {showThemePicker && (
              <div
                className="absolute bottom-full right-0 mb-2 w-72 rounded-lg shadow-lg z-50 overflow-hidden"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="p-4">
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Theme
                  </h3>

                  <div className="mb-3">
                    <h4
                      className="text-xs font-medium mb-2"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Light
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {lightThemes.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTheme(t.id);
                            setShowThemePicker(false);
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
                              className="w-3 h-3 rounded-full border"
                              style={{
                                backgroundColor: t.colors.background,
                                borderColor: t.colors.border,
                              }}
                            />
                            <span
                              className="w-3 h-3 rounded-full border"
                              style={{
                                backgroundColor: t.colors.primary,
                                borderColor: t.colors.border,
                              }}
                            />
                            <span
                              className="w-3 h-3 rounded-full border"
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
                    <h4
                      className="text-xs font-medium mb-2"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Dark
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {darkThemes.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTheme(t.id);
                            setShowThemePicker(false);
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
                              className="w-3 h-3 rounded-full border"
                              style={{
                                backgroundColor: t.colors.background,
                                borderColor: t.colors.border,
                              }}
                            />
                            <span
                              className="w-3 h-3 rounded-full border"
                              style={{
                                backgroundColor: t.colors.primary,
                                borderColor: t.colors.border,
                              }}
                            />
                            <span
                              className="w-3 h-3 rounded-full border"
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
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
