import styles from "./TileLabel.module.css";

const TileLabel = ({ children, variant = "default", className }) => {
  return (
  <span
      className={[styles.label, variant === "hero" && styles.hero, className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

export default TileLabel
