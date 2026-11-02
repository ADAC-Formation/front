import { LoginButton } from "../../atoms/LoginButton/LoginButton";
import { ThemeToggle } from "../../molecules/DarkMode/DarkMode";
import { AccessibilityMenu } from "../../molecules/Accessibility/Accessibility";
import { NotificationBell } from "../../../features/notifications/components/NotificationBell";
import styles from "./Header.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <LoginButton />
        <NotificationBell />
        <ThemeToggle />
        <AccessibilityMenu />
      </div>
    </header>
  );
}
