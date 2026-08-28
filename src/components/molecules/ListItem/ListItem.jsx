import { Link } from "react-router";
import styles from "./ListItem.module.css";
import categories from "../../../utils/categories";

const ListItem = ({ title, category, details, to }) => {
  const categoryItem = categories.find(
    (item) => item.name === category
  );

  return (
    <Link to={to} className={styles.item}>
      <div
        className={styles.categoryBar}
        style={{
          backgroundColor: categoryItem?.color,
        }}
      />

      <div className={styles.content}>
        {category && (
          <span
            className={styles.category}
            style={{
              color: categoryItem?.color,
            }}
          >
            {category}
          </span>
        )}

        <div className={styles.title}>
          <h2>{title}</h2>
        </div>

        <div className={styles.details}>
          {details.map(({ icon: Icon, value }, index) => (
            <div key={index} className={styles.detail}>
              <Icon size={18} />
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <span className={styles.arrow}>→</span>
    </Link>
  );
};

export default ListItem;