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
}) => {
  return (
    <Link to={to} className={`${styles.tile} ${styles[size]}`} style={{ "--tile-color": color }} onClick={onClick}>
      <div className={styles.icon}>
        {icon}
      </div>

      <TileLabel variant={labelVariant}>
        {label}
      </TileLabel>
    </Link>
  );
};

export default Tile;