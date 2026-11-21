import { BookOpen, FileText, Users } from "lucide-react";
import { useCurrentUser } from "../../../features/auth/hooks";
import { canManageAccounts } from "../../../features/accounts/accountKinds";
import BackButton from "../../molecules/BackButton/BackButton";
import ManagementTile from "../../molecules/ManagementTiles/ManagementTiles";
import { PageShell } from "../../../templates/PageShell/PageShell";
import styles from "./ManagementMenu.module.css";

const formationsTile = {
  label: "Formations",
  icon: <BookOpen />,
  color: "var(--color-red)",
  createLabel: "Créer une nouvelle formation",
  listLabel: "Consulter formations existantes",
  createPath: "/formations/creer",
  listPath: "/admin/formations",
  manageLabel: "Gérer les catégories",
  managePath: "/formations/categories",
};

// Catalogue des types de document : chargée de formation seulement (la tuile entière, G32).
const documentsTile = {
  label: "Documents",
  icon: <FileText />,
  color: "var(--color-pink)",
  createLabel: "Créer un type de document",
  listLabel: "Consulter les types existants",
  createPath: "/admin/documents/nouveau",
  listPath: "/admin/documents",
};

const profilesSections = [
  {
    label: "Formateurs",
    createLabel: "Créer un nouveau profil",
    listLabel: "Consulter profils existants",
    createPath: "/admin/formateurs/nouveau",
    listPath: "/admin/formateurs",
  },
  {
    label: "Stagiaires",
    createLabel: "Créer un nouveau profil",
    listLabel: "Consulter profils existants",
    createPath: "/admin/stagiaires/nouveau",
    listPath: "/admin/stagiaires",
  },
];

const profilesTile = {
  label: "Profils",
  icon: <Users />,
  color: "var(--color-amber)",
  sections: profilesSections,
};

// Création, import et catalogue des documents : chargée de formation seulement (le formateur consulte,
// D46/D54). Le formateur ne voit donc aucune action menant à « Accès refusé ».
const ManagementMenu = () => {
  const { user } = useCurrentUser();
  const isSuperAdmin = canManageAccounts(user);

  const tiles = isSuperAdmin
    ? [formationsTile, documentsTile, profilesTile]
    : [
        { ...formationsTile, createPath: undefined, managePath: undefined },
        {
          ...profilesTile,
          sections: profilesSections.map((section) => ({ ...section, createPath: undefined })),
        },
      ];

  return (
    <PageShell center className={styles.gestionPage}>
      <BackButton to="/" />

      <h1 className={styles.title}>Gestion</h1>

      <div className={styles.gridHost}>
        <div className={styles.tileContainer}>
          {tiles.map((tile) => (
            <ManagementTile key={tile.label} {...tile} />
          ))}
        </div>
      </div>
    </PageShell>
  );
};

export default ManagementMenu;
