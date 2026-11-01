import { List, Plus, Tags } from "lucide-react";
import { Link } from "react-router";
import styles from "./ManagementTiles.module.css";

const ManagementTile = ({
  label,
  icon,
  color,
  createLabel,
  listLabel,
  createPath,
  listPath,
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

      <div className={styles.title}>
        {label}
      </div>

      <div className={styles.actions}>
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