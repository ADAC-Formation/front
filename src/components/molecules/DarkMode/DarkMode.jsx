import { Sun, Moon } from "lucide-react";
import { IconButton } from "../../atoms/IconButton/IconButton";
import { useThemeContext } from "../../../hooks/use-theme-context";

export function ThemeToggle() {
  const { isDark, toggleDarkMode } = useThemeContext();
  return (
    <IconButton
      onClick={toggleDarkMode}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </IconButton>
  );
}
