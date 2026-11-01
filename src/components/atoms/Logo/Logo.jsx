import logoLight from "../../../assets/Logo/Logo-Blanc.webp";
import logoDark from "../../../assets/Logo/Logo-Dark.webp";
import { useThemeContext } from "../../../hooks/use-theme-context";
import styles from "./Logo.module.css";

const Logo = () => {
  const { isDark } = useThemeContext();

  return (
    <img
      src={isDark ? logoDark : logoLight}
      alt="ADAC Formation"
      className={styles.logo}
    />
  );
};

export default Logo;