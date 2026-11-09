import { Link } from "react-router";
import { useCurrentUser } from "../../../features/auth/hooks";
import { roleLabels } from "../../../utils/roles";
import styles from "./CurrentUser.module.css";

// Nom et rôle de la personne connectée, sous le bandeau en haut à droite. Mène au profil.
// Rien pour un visiteur ni tant que la session n'est pas connue.
export function CurrentUser() {
  const { user } = useCurrentUser();
  if (!user) return null;

  return (
    <Link to="/profile" className={styles.user}>
      <span className={styles.name}>
        {user.prenom} {user.nom}
      </span>
      <span className={styles.role}>{roleLabels[user.role] ?? user.role}</span>
    </Link>
  );
}
