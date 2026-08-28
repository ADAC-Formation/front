import { BookOpen, UserRound,GraduationCap} from "lucide-react";
import ManagementTile from "../../molecules/ManagementTiles/ManagementTiles";
import styles from "./ManagementMenu.module.css";

const managementTiles = [
  {
    label: "Formations",
    icon: <BookOpen />,
    color: "var(--color-red)",
    createLabel: "Créer une nouvelle formation",
    listLabel: "Consulter formations existantes",
    createPath: "/admin/formations/nouvelle",
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

const ManagementMenu = () => {
  return (
    <main className={styles.gestionPage}>
      <h1 className={styles.title}>Gestion</h1>

      <div className={styles.tileContainer}>
        {managementTiles.map((tile) => (
          <ManagementTile key={tile.label} {...tile} />
        ))}
      </div>
    </main>
  );
};

export default ManagementMenu;