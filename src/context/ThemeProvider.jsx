import { useTheme } from "../hooks/use-theme";
import { ThemeContext } from "./theme-context";

export function ThemeProvider({ children }) {
  const theme = useTheme();
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
