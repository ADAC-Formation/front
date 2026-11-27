import TileGroup from "../../molecules/TileGroup/TileGroup";
import { PageShell } from "../../../templates/PageShell/PageShell";
import { BookOpen, MonitorCog } from "lucide-react";
import { ROLES, roleLabels } from "../../../utils/roles";
import styles from "./HomePage.module.css";

// Accueil : salutation (le nom de la personne quitte l'en-tête, D67) puis les tuiles du rôle.
const HomePage = ({ role, prenom }) => {
  const isStagiaire = role === ROLES.STAGIAIRE;

  const label = isStagiaire ? "Formations" : "Gestion";
  const icon = isStagiaire ? <BookOpen /> : <MonitorCog />;
  const path = isStagiaire ? "/formations" : "/admin/gestion";

  return (
    <PageShell center>
      <div className={styles.greeting}>
        <h1 className={styles.title}>{prenom ? `Bonjour ${prenom}` : "Bonjour"}</h1>
        {roleLabels[role] && <p className={styles.role}>{roleLabels[role]}</p>}
      </div>
      <TileGroup label={label} icon={icon} largeTilePath={path} />
    </PageShell>
  );
};

export default HomePage;
