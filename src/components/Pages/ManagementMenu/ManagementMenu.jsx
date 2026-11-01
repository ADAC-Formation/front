import { BookOpen, GraduationCap, Tags, UserRound } from "lucide-react";
import { useCurrentUser } from "../../../features/auth/hooks";
import { canManageAccounts } from "../../../features/accounts/accountKinds";
import BackButton from "../../molecules/BackButton/BackButton";
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
  {
    label: "Catégories",
    icon: <Tags />,
    color: "var(--color-yellow)",
    textColor: "var(--color-on-yellow)",
    listLabel: "Gérer les catégories",
    listPath: "/formations/categories",
    superAdminOnly: true,
  },
];

// Création et catégories : chargée de formation seulement (le formateur consulte, D46/D54).
// Le formateur ne voit donc aucune action menant à « Accès refusé ».
const ManagementMenu = () => {
  const { user } = useCurrentUser();
  const isSuperAdmin = canManageAccounts(user);

  const tiles = managementTiles
    .filter((tile) => !tile.superAdminOnly || isSuperAdmin)
    .map((tile) => ({ ...tile, createPath: isSuperAdmin ? tile.createPath : undefined }));

  return (
    <PageShell center className={styles.gestionPage}>
      <BackButton to="/" />

      <h1 className={styles.title}>Gestion</h1>

      <div className={styles.tileContainer}>
        {tiles.map((tile) => (
          <ManagementTile key={tile.label} {...tile} />
        ))}
      </div>
    </PageShell>
  );
};

export default ManagementMenu;