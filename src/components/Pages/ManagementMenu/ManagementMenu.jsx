import { BookOpen, UserRound,GraduationCap} from "lucide-react";
import { useCurrentUser } from "../../../features/auth/hooks";
import { canManageAccounts } from "../../../features/accounts/accountKinds";
import ManagementTile from "../../molecules/ManagementTiles/ManagementTiles";
import { PageShell } from "../../../templates/PageShell/PageShell";
import styles from "./ManagementMenu.module.css";

const managementTiles = [
  {
    label: "Formations",
    icon: <BookOpen />,
    color: "var(--color-red)",
    createLabel: "Créer une nouvelle formation",
    listLabel: "Consulter formations existantes",
    createPath: "/formations/creer",
    listPath: "/admin/formations",
  },
  {
    label: "Formateurs",
    icon: <UserRound />,
    color: "var(--color-pink)",
    createLabel: "Créer un nouveau profil",
    listLabel: "Consulter profils existants",
    createPath: "/admin/formateurs/nouveau",
    listPath: "/admin/formateurs",
  },
  {
    label: "Stagiaires",
    icon: <GraduationCap />,
    color: "var(--color-orange)",
    createLabel: "Créer un nouveau profil",
    listLabel: "Consulter profils existants",
    createPath: "/admin/stagiaires/nouveau",
    listPath: "/admin/stagiaires",
  },
];

// Seule la chargée de formation crée des comptes ; le formateur les consulte (D54).
const ACCOUNT_TILES = ["Formateurs", "Stagiaires"];

const ManagementMenu = () => {
  const { user } = useCurrentUser();
  const canCreateAccounts = canManageAccounts(user);

  return (
    <PageShell center className={styles.gestionPage}>
      <h1 className={styles.title}> Gestion</h1>

      <div className={styles.tileContainer}>
        {managementTiles.map((tile) => (
          <ManagementTile
            key={tile.label}
            {...tile}
            createPath={
              ACCOUNT_TILES.includes(tile.label) && !canCreateAccounts ? undefined : tile.createPath
            }
          />
        ))}
      </div>
    </PageShell>
  );
};

export default ManagementMenu;