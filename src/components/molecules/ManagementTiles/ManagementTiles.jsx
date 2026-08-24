import { List, Plus } from "lucide-react";
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
        <Link to={createPath} className={styles.action}>
          <Plus size={24} />
          <span>{createLabel}</span>
        </Link>

        <Link to={listPath} className={styles.action}>
          <List size={24} />
          <span>{listLabel}</span>
        </Link>
      </div>
    </article>
  );
};

export default ManagementTile;