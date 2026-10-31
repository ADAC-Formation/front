import styles from "./PageShell.module.css";

// Gabarit unique des pages : dégagement sous le logo (--page-top), marges latérales et largeur de
// contenu communes. Le seul <main> de la page est celui du Layout, d'où le <div>.
// `center` centre le contenu dans l'espace restant (accueil, menu Gestion, authentification).
export function PageShell({ children, center = false, className = "" }) {
  return (
    <div
      className={[styles.shell, center && styles.center, className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
