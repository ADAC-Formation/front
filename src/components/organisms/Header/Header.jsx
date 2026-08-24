import { AuthToggle } from "../../atoms/LoginButton/LoginButton";
import { ThemeToggle } from "../../molecules/DarkMode/DarkMode";
import { AccessibilityMenu } from "../../molecules/Accessibility/Accessibility";
import styles from "./Header.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <AuthToggle />
        <ThemeToggle />
        <AccessibilityMenu />
      </div>
    </header>
  );
}
