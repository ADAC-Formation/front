import { ArrowLeft, Pencil } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import categories from "../../../utils/categories";
import styles from "./CategoryManagement.module.css";
import { PageShell } from "../../../templates/PageShell/PageShell";

const CategoryManagement = () => {
  const navigate = useNavigate();

  const [categoryList, setCategoryList] = useState(
    categories.filter((category) => category.name !== "Toutes")
  );

  const handleToggle = (id) => {
    setCategoryList((currentCategories) =>
      currentCategories.map((category) =>
        category.id === id
          ? { ...category, active: !category.active }
          : category
      )
    );
  };

  return (
    <PageShell>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.back}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
          Retour
        </button>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Catégories</h1>

            <p className={styles.intro}>
              Gérez les catégories utilisées pour classer les formations.
            </p>
          </div>

          <button type="button" className={styles.createButton}>
            Créer une catégorie
          </button>
        </div>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Catégories disponibles</h2>

              <p>
                {categoryList.length} catégorie
                {categoryList.length !== 1 && "s"}
              </p>
            </div>
          </div>

          <div className={styles.list}>
            {categoryList.map((category) => (
              <div className={styles.category} key={category.id}>
                <div className={styles.categoryInfo}>
                  <span
                    className={styles.categoryDot}
                    style={{
                      backgroundColor: category.color,
                    }}
                  />

                  <div>
                    <h3>{category.name}</h3>

                    <span
                      className={
                        category.active
                          ? styles.activeLabel
                          : styles.inactiveLabel
                      }
                    >
                      {category.active ? "Active" : "Désactivée"}
                    </span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.editButton}
                    aria-label={`Modifier ${category.name}`}
                  >
                    <Pencil size={16} />
                    Modifier
                  </button>

                  <button
                    type="button"
                    className={`${styles.toggle} ${
                      category.active ? styles.toggleActive : ""
                    }`}
                    onClick={() => handleToggle(category.id)}
                    aria-label={
                      category.active
                        ? `Désactiver ${category.name}`
                        : `Activer ${category.name}`
                    }
                    aria-pressed={category.active}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
};

export default CategoryManagement;