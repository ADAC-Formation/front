import styles from "./PageShell.module.css";

export function PageShell({ children, center = false, className = "" }) {
  return (
    <main
      className={[styles.shell, center && styles.center, className].filter(Boolean).join(" ")}
    >
      {children}
    </main>
  );
}
