import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import styles from "./BackButton.module.css";

// Lien « Retour » en haut de page, même présentation que les pages formations et catégories.
// La destination est explicite (pas d'historique) pour rester correcte sur un lien direct.
const BackButton = ({ to, children = "Retour" }) => (
  <Link to={to} className={styles.back}>
    <ArrowLeft size={16} aria-hidden="true" />
    {children}
  </Link>
);

export default BackButton;
