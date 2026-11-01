import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "app-theme-preferences";

export const MAX_FONT_STEP = 3;

// Options du menu Accessibilité (D60) → classe posée sur <html>.
const TOGGLE_CLASSES = {
  highContrast: "high-contrast",
  grayscale: "grayscale",
  negativeContrast: "negative-contrast",
  lightBackground: "light-background",
  underlineLinks: "underline-links",
  readableFont: "readable-font",
};

const DEFAULT_STATE = {
  isDark: false,
  fontStep: 0,
  highContrast: false,
  grayscale: false,
  negativeContrast: false,
  lightBackground: false,
  underlineLinks: false,
  readableFont: false,
};

const clampStep = (step) => Math.min(MAX_FONT_STEP, Math.max(0, step));

function readFontStep(parsed) {
  if (Number.isInteger(parsed.fontStep)) return clampStep(parsed.fontStep);
  // Ancienne préférence « grand texte » (125 %) → palier 2.
  return parsed.fontSize === "large" ? 2 : 0;
}

function getInitialState() {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const state = { ...DEFAULT_STATE, fontStep: readFontStep(parsed) };
      for (const key of ["isDark", ...Object.keys(TOGGLE_CLASSES)]) {
        state[key] = parsed[key] === true;
      }
      return state;
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_STATE };
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // stockage indisponible : la préférence ne survit pas au rechargement
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialState);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme.isDark);
    for (let step = 1; step <= MAX_FONT_STEP; step += 1) {
      root.classList.toggle(`text-step-${step}`, theme.fontStep === step);
    }
    for (const [key, className] of Object.entries(TOGGLE_CLASSES)) {
      root.classList.toggle(className, theme[key]);
    }
  }, [theme]);

  const update = useCallback((change) => {
    setThemeState((prev) => {
      const next = { ...prev, ...change(prev) };
      persist(next);
      return next;
    });
  }, []);

  const toggleDarkMode = useCallback(() => update((p) => ({ isDark: !p.isDark })), [update]);
  const toggleOption = useCallback((key) => update((p) => ({ [key]: !p[key] })), [update]);
  const increaseFontSize = useCallback(
    () => update((p) => ({ fontStep: clampStep(p.fontStep + 1) })),
    [update],
  );
  const decreaseFontSize = useCallback(
    () => update((p) => ({ fontStep: clampStep(p.fontStep - 1) })),
    [update],
  );
  // Le mode sombre est un choix à part (D60) : il survit à la réinitialisation.
  const resetAccessibility = useCallback(
    () => update((p) => ({ ...DEFAULT_STATE, isDark: p.isDark })),
    [update],
  );

  return {
    ...theme,
    toggleDarkMode,
    toggleOption,
    increaseFontSize,
    decreaseFontSize,
    resetAccessibility,
  };
}
