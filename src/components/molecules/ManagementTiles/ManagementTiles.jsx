import { List, Plus, Tags } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router";
import styles from "./ManagementTiles.module.css";

// Liens de création et de consultation d'une même série (une tuile simple, ou une section de tuile).
const ActionLinks = ({ createLabel, listLabel, createPath, listPath }) => (
  <>
    {createPath && (
      <Link to={createPath} className={styles.action}>
        <Plus size={24} />
        <span>{createLabel}</span>
      </Link>
    )}

    <Link to={listPath} className={styles.action}>
      <List size={24} />
      <span>{listLabel}</span>
    </Link>
  </>
);

// Section d'une tuile (ex. « Formateurs » dans « Profils ») : un groupe nommé par son titre.
const TileSection = ({ label, ...links }) => {
  const titleId = useId();
  return (
    <div role="group" aria-labelledby={titleId} className={styles.section}>
      <h3 id={titleId} className={styles.sectionTitle}>
        {label}
      </h3>
      <ActionLinks {...links} />
    </div>
  );
};

// `sections` (liste de { label, createLabel, listLabel, createPath, listPath }) remplace les
// liens de création et de consultation de la tuile ; `manageLabel` / `managePath` restent en dessous.
const ManagementTile = ({
  label,
  icon,
  color,
  createLabel,
  listLabel,
  createPath,
  listPath,
  sections,
  manageLabel,
  managePath,
}) => {
  return (
    <article
      className={styles.tile}
      style={{ "--tile-color": color }}
    >
      <div className={styles.icon}>
        {icon}
      </div>

      <h2 className={styles.title}>
        {label}
      </h2>

      <div className={styles.actions}>
        {sections ? (
          sections.map((section) => <TileSection key={section.label} {...section} />)
        ) : (
          <ActionLinks
            createLabel={createLabel}
            listLabel={listLabel}
            createPath={createPath}
            listPath={listPath}
          />
        )}

        {managePath && (
          <Link to={managePath} className={styles.action}>
            <Tags size={24} />
            <span>{manageLabel}</span>
          </Link>
        )}
      </div>
    </article>
  );
};

export default ManagementTile;
