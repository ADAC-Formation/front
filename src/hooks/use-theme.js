import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "app-theme-preferences";

const DEFAULT_STATE = {
  isDark: false,
  fontSize: "normal",
  highContrast: false,
  isAuthenticated: false,
};

function getInitialState() {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        isDark: parsed.isDark ?? false,
        fontSize: parsed.fontSize ?? "normal",
        highContrast: parsed.highContrast ?? false,
        isAuthenticated: parsed.isAuthenticated ?? false,
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_STATE };
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialState);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme.isDark);
    root.classList.toggle("text-large", theme.fontSize === "large");
    root.classList.toggle("high-contrast", theme.highContrast);
  }, [theme.isDark, theme.fontSize, theme.highContrast]);

  const setTheme = useCallback((updates) => {
    setThemeState((prev) => {
      const next = { ...prev, ...updates };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const toggleDarkMode = useCallback(() => {
  setThemeState((prev) => {
    const next = { ...prev, isDark: !prev.isDark };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    return next;
  });
}, []);

  const toggleFontSize = useCallback(() => {
    setTheme({ fontSize: theme.fontSize === "normal" ? "large" : "normal" });
  }, [theme.fontSize, setTheme]);

  const toggleHighContrast = useCallback(() => {
    setTheme({ highContrast: !theme.highContrast });
  }, [theme.highContrast, setTheme]);

  const toggleAuth = useCallback(() => {
    setTheme({ isAuthenticated: !theme.isAuthenticated });
  }, [theme.isAuthenticated, setTheme]);

  return {
    ...theme,
    setTheme,
    toggleDarkMode,
    toggleFontSize,
    toggleHighContrast,
    toggleAuth,
  };
}
