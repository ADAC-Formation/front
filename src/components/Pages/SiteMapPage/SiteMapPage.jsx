import { Link } from "react-router";
import { useCurrentUser } from "../../../features/auth/hooks";
import { MANAGEMENT_ROLES } from "../../../utils/roles";
import { PageShell } from "../../../templates/PageShell/PageShell";
import styles from "./SiteMapPage.module.css";

const COMMON_PAGES = [
  { label: "Formations", to: "/formations" },
  { label: "Messages", to: "/messages" },
  { label: "Notifications", to: "/notifications" },
  { label: "Profil", to: "/profile" },
];

// Gestion, comptes et catalogue : chargée de formation et formateur (lecture seule pour ce dernier, D54).
const MANAGEMENT_PAGES = [
  { label: "Gestion", to: "/admin/gestion" },
  { label: "Formateurs", to: "/admin/formateurs" },
  { label: "Stagiaires", to: "/admin/stagiaires" },
];

const SiteMapPage = () => {
  const { user } = useCurrentUser();
  const pages = MANAGEMENT_ROLES.includes(user?.role)
    ? [...COMMON_PAGES, ...MANAGEMENT_PAGES]
    : COMMON_PAGES;

  return (
    <PageShell>
      <h1 className={styles.title}>Plan de site</h1>
      <ul className={styles.list}>
        {pages.map(({ label, to }) => (
          <li key={to}>
            <Link to={to} className={styles.link}>{label}</Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
};

export default SiteMapPage;
