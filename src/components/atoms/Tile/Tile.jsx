import styles from "./Tile.module.css";
import TileLabel from "../TileLabel/TileLabel";
import { Link } from "react-router";

const Tile = ({
  to,
  size = "small",
  color,
  icon,
  label,
  labelVariant = "default",
  onClick,
  badge = 0,
  badgeLabel,
}) => {
  return (
    <Link
      to={to}
      className={`${styles.tile} ${styles[size]}`}
      style={{ "--tile-color": color }}
      onClick={onClick}
      aria-label={badge > 0 ? `${label}, ${badgeLabel}` : undefined}
    >
      <div className={styles.icon}>
        {icon}
      </div>

      <TileLabel variant={labelVariant}>
        {label}
      </TileLabel>

      {/* Pastille : le nom accessible de la tuile porte déjà le total (aria-label). */}
      {badge > 0 && (
        <span className={styles.badge} aria-hidden="true">
          {badge}
        </span>
      )}
    </Link>
  );
};

export default Tile;