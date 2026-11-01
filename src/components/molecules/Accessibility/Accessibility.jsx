import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  ZoomIn, ZoomOut, Contrast, Eye, Lightbulb, Link2, Type, RotateCcw,
  Network, MessageSquare, Palette, Accessibility as AccessibilityIcon, X,
} from "lucide-react";
import { IconButton } from "../../atoms/IconButton/IconButton";
import { useThemeContext } from "../../../hooks/use-theme-context";
import { MAX_FONT_STEP } from "../../../hooks/use-theme";
import styles from "./Accessibility.module.css";

const FEEDBACK_URL = "https://www.adac.asso.fr/contact-nouvelle-version/";

// Options à bascule, dans l'ordre du menu du site ADAC (D60).
const TOGGLES = [
  { key: "grayscale", label: "Niveau de gris", Icon: Palette },
  { key: "highContrast", label: "Haut contraste", Icon: Contrast },
  { key: "negativeContrast", label: "Contraste négatif", Icon: Eye },
  { key: "lightBackground", label: "Arrière-plan clair", Icon: Lightbulb },
  { key: "underlineLinks", label: "Liens soulignés", Icon: Link2 },
  { key: "readableFont", label: "Police lisible", Icon: Type },
];

export function AccessibilityMenu() {
  const theme = useThemeContext();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={styles.wrapper}>
      <IconButton
        onClick={() => setOpen((o) => !o)}
        aria-label="Options d'accessibilité"
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <AccessibilityIcon size={20} />}
      </IconButton>

      {open && (
        <div className={styles.panel}>
          <h3 className={styles.title}>Accessibilité</h3>
          <div className={styles.list}>
            <button
              type="button"
              onClick={theme.increaseFontSize}
              disabled={theme.fontStep >= MAX_FONT_STEP}
              className={styles.item}
            >
              <ZoomIn size={16} aria-hidden="true" />
              Augmenter le texte
            </button>
            <button
              type="button"
              onClick={theme.decreaseFontSize}
              disabled={theme.fontStep <= 0}
              className={styles.item}
            >
              <ZoomOut size={16} aria-hidden="true" />
              Diminuer le texte
            </button>
            {TOGGLES.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => theme.toggleOption(key)}
                aria-pressed={theme[key]}
                className={styles.item}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
            <button type="button" onClick={theme.resetAccessibility} className={styles.item}>
              <RotateCcw size={16} aria-hidden="true" />
              Réinitialiser
            </button>
          </div>
          <div className={`${styles.list} ${styles.footer}`}>
            <Link to="/plan-du-site" className={styles.item} onClick={() => setOpen(false)}>
              <Network size={16} aria-hidden="true" />
              Plan de site
            </Link>
            <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className={styles.item}>
              <MessageSquare size={16} aria-hidden="true" />
              Retour d'expérience
              <span className={styles.srOnly}> (nouvelle fenêtre)</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
