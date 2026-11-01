import { Link } from "react-router";
import styles from "./ListItem.module.css";

// Carte de liste cliquable : barre et libellé de catégorie (la couleur est fournie par l'appelant),
// badge de statut optionnel (en texte : la couleur ne porte jamais seule l'information), détails.
const ListItem = ({ title, category, categoryColor, badge, details, to }) => (
  <Link to={to} className={styles.item}>
    <div
      className={styles.categoryBar}
      style={{
        backgroundColor: categoryColor,
      }}
    />

    <div className={styles.content}>
      <div className={styles.labels}>
        {category && (
          <span
            className={styles.category}
            style={{
              "--category-color": categoryColor,
            }}
          >
            {category}
          </span>
        )}

        {badge && <span className={styles.badge}>{badge}</span>}
      </div>

      <div className={styles.title}>
        <h2>{title}</h2>
      </div>

      <div className={styles.details}>
        {details.map(({ icon: Icon, value }, index) => (
          <div key={index} className={styles.detail}>
            <Icon size={18} aria-hidden="true" />
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>

    <span className={styles.arrow} aria-hidden="true">→</span>
  </Link>
);

export default ListItem;
