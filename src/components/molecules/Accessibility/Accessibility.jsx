import { useEffect, useRef, useState } from "react";
import { Settings, X, Type, Eye } from "lucide-react";
import { IconButton } from "../../atoms/IconButton/IconButton";
import { useThemeContext } from "../../../context/ThemeProvider";
import styles from "./Accessibility.module.css";

export function AccessibilityMenu() {
  const { fontSize, highContrast, toggleFontSize, toggleHighContrast } = useThemeContext();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className={styles.wrapper}>
      <IconButton
        onClick={() => setOpen((o) => !o)}
        aria-label="Options d'accessibilité"
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <Settings size={20} />}
      </IconButton>

      {open && (
        <div className={styles.panel}>
          <h3 className={styles.title}>Accessibilité</h3>
          <div className={styles.list}>
            <button onClick={toggleFontSize} className={styles.item}>
              <span className={styles.itemLabel}>
                <Type size={16} />
                Taille du texte
              </span>
              <span className={styles.itemValue}>
                {fontSize === "large" ? "Grand" : "Normal"}
              </span>
            </button>
            <button onClick={toggleHighContrast} className={styles.item}>
              <span className={styles.itemLabel}>
                <Eye size={16} />
                Contraste élevé
              </span>
              <span className={styles.itemValue}>
                {highContrast ? "Activé" : "Désactivé"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
