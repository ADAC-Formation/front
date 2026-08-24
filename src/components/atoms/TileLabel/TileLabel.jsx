import styles from "./TileLabel.module.css";
import React from 'react'

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
