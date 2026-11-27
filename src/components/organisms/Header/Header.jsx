import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { LoginButton } from "../../atoms/LoginButton/LoginButton";
import { ThemeToggle } from "../../molecules/DarkMode/DarkMode";
import { AccessibilityMenu } from "../../molecules/Accessibility/Accessibility";
import { NotificationBell } from "../../../features/notifications/components/NotificationBell";
import { useCurrentUser } from "../../../features/auth/hooks";
import { useUnreadNotifications } from "../../../features/notifications/hooks";
import { useHeaderCollapse } from "./useHeaderCollapse";
import styles from "./Header.module.css";

const MAX_BADGE = 99;

function bubbleLabel(unread) {
  if (unread === 0) return "Menu de l'en-tête";
  return `Menu de l'en-tête, ${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}`;
}

// Un panneau ouvert depuis la rangée gère lui-même Échap : la rangée attend qu'ils soient fermés.
const hasOpenChild = (row) => Boolean(row?.querySelector('[aria-expanded="true"], [role="dialog"]'));

// Bulle ≡ affichée une fois la page défilée sur ordinateur (D67) : elle porte la pastille des non lues et
// déroule ou replie la rangée, qu'elle contrôle.
function HeaderBubble({ isExpanded, rowId, onToggle, buttonRef }) {
  const { user } = useCurrentUser();
  const { data } = useUnreadNotifications({ enabled: Boolean(user) });
  const unread = data?.count ?? 0;

  return (
    <button
      ref={buttonRef}
      type="button"
      className={styles.bubble}
      aria-label={bubbleLabel(unread)}
      aria-expanded={isExpanded}
      aria-controls={rowId}
      onClick={onToggle}
    >
      {isExpanded ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      {unread > 0 && !isExpanded && (
        <span className={styles.badge} aria-hidden="true">
          {unread > MAX_BADGE ? `${MAX_BADGE}+` : unread}
        </span>
      )}
    </button>
  );
}

// En-tête du site : déconnexion, cloche, mode sombre, accessibilité. Le nom de la personne est sur l'accueil et
// « Envoyer un retour » en bas à droite (gabarit). Téléphone et tablette : en haut de la page, il défile avec elle. Ordinateur : fixé en haut
// à droite ; dès que la page a défilé, la rangée se rassemble dans une bulle qui la déroule au clic. Elle se
// replie sur Échap, au clic ailleurs ou en revenant en haut ; elle reste déroulée tant que le focus y est
// (un panneau ouvert depuis la rangée ne doit jamais devenir inerte).
export function SiteHeader() {
  const collapsed = useHeaderCollapse();
  const [isOpen, setIsOpen] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const [wasCollapsed, setWasCollapsed] = useState(collapsed);
  const headerRef = useRef(null);
  const rowRef = useRef(null);
  const bubbleRef = useRef(null);
  const rowId = useId();

  // Revenir en haut de page oublie l'ouverture : la prochaine fois, la bulle repart fermée.
  if (wasCollapsed !== collapsed) {
    setWasCollapsed(collapsed);
    if (!collapsed) setIsOpen(false);
  }

  const isExpanded = collapsed && (isOpen || hasFocusWithin);
  const isFolded = collapsed && !isExpanded;

  useEffect(() => {
    if (!isExpanded) return undefined;
    const close = () => {
      setIsOpen(false);
      setHasFocusWithin(false);
    };
    const onKey = (event) => {
      if (event.key !== "Escape" || hasOpenChild(rowRef.current)) return;
      close();
      bubbleRef.current?.focus();
    };
    const onPointer = (event) => {
      if (!headerRef.current?.contains(event.target)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [isExpanded]);

  // Le focus qui passe de la rangée à la bulle ne compte pas : c'est le clic sur la bulle qui décide.
  const onRowBlur = (event) => {
    const next = event.relatedTarget;
    if (!event.currentTarget.contains(next) && next !== bubbleRef.current) setHasFocusWithin(false);
  };

  const toggle = () => {
    if (isExpanded) {
      setIsOpen(false);
      setHasFocusWithin(false);
    } else {
      setIsOpen(true);
    }
  };

  return (
    <header ref={headerRef} className={styles.header}>
      <div
        ref={rowRef}
        id={rowId}
        className={styles.row}
        data-header-row=""
        data-folded={isFolded ? "" : undefined}
        inert={isFolded}
        onFocus={() => setHasFocusWithin(true)}
        onBlur={onRowBlur}
      >
        <LoginButton />
        <NotificationBell />
        <ThemeToggle />
        <AccessibilityMenu />
      </div>
      {collapsed && (
        <HeaderBubble
          isExpanded={isExpanded}
          rowId={rowId}
          buttonRef={bubbleRef}
          onToggle={toggle}
        />
      )}
    </header>
  );
}
