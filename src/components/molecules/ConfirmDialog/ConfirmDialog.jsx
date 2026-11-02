import { useId, useRef } from "react";
import { useModalFocus } from "../../../hooks/useModalFocus";
import styles from "./ConfirmDialog.module.css";

// Boîte de dialogue modale de confirmation : nommée par son titre, focus initial sur
// « Annuler » (action sûre), Échap annule, Tab reste dans la boîte, le focus revient à
// l'élément précédent à la fermeture (hook partagé `useModalFocus`). `children` est rendu en texte.
const ConfirmDialog = ({
  title,
  confirmLabel,
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  disabled = false,
  children,
}) => {
  const titleId = useId();
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  const handleKeyDown = useModalFocus({ dialogRef, initialFocusRef: cancelRef, onCancel });

  return (
    <div className={styles.backdrop}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children && <p className={styles.message}>{children}</p>}
        <div className={styles.actions}>
          <button ref={cancelRef} type="button" className={styles.cancel} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={styles.confirm}
            onClick={onConfirm}
            disabled={disabled}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
