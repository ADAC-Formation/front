import {
  Search,
  CalendarDays,
  UserRound,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router";
import { useMemo, useState } from "react";
import ListItem from "../../../components/molecules/ListItem/ListItem";
import formations from "../../../utils/simFormations";
import categories from "../../../utils/categories";
import styles from "./FormationsPage.module.css";
import { PageShell } from "../../../templates/PageShell/PageShell";

const FormationsPage = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");

const filteredAndSortedFormations = useMemo(() => {
  const searchTerm = search.toLowerCase().trim();

  const filtered = formations.filter((formation) => {
    const matchesSearch =
      formation.nom.toLowerCase().includes(searchTerm) ||
      formation.formateur.toLowerCase().includes(searchTerm) ||
      formation.lieu.toLowerCase().includes(searchTerm) ||
      formation.category.toLowerCase().includes(searchTerm);

    const matchesCategory =
      selectedCategory === "Toutes" ||
      formation.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return [...filtered].sort((a, b) => {
    if (sortBy === "date") {
      return a.dateValue.localeCompare(b.dateValue);
    }

    if (sortBy === "nom") {
      return a.nom.localeCompare(b.nom);
    }

    if (sortBy === "formateur") {
      return a.formateur.localeCompare(b.formateur);
    }

    return 0;
  });
}, [search, sortBy, selectedCategory]);

  return (
    <PageShell>
      <div className={styles.container}>

        <Link to="/" className={styles.back}>
          <ArrowLeft size={16} />
          Retour
        </Link>

        <h1 className={styles.title}>Formations</h1>

        <p className={styles.intro}>
          Consultez les formations disponibles et retrouvez toutes
          les informations nécessaires.
        </p>

        <section className={styles.toolbar}>
          <div className={styles.searchContainer}>
            <Search size={18} />

            <input
              type="text"
              placeholder="Rechercher une formation..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className={styles.sortContainer}>
            <label htmlFor="sort">
              Organiser par :
            </label>

            <select
              id="sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="date">Date</option>
              <option value="nom">Nom A-Z</option>
              <option value="formateur">Formateur A-Z</option>
            </select>
          </div>
        </section>

        <div className={styles.categories}>
  {categories.map((category) => {
    const isSelected = selectedCategory === category.name;

    return (
      <button
        key={category.name}
        type="button"
        className={`${styles.category} ${
          isSelected ? styles.categorySelected : ""
        }`}
        onClick={() => setSelectedCategory(category.name)}
        style={{
          "--category-color": category.color,
        }}
      >
        <span className={styles.categoryDot} />
        {category.name}
      </button>
    );
  })}
</div>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Formations disponibles</h2>
              <p>
                {filteredAndSortedFormations.length} formation
                {filteredAndSortedFormations.length !== 1 && "s"}
              </p>
            </div>
          </div>

          <div className={styles.list}>
            {filteredAndSortedFormations.length > 0 ? (
              filteredAndSortedFormations.map((formation) => (
              <ListItem
                key={formation.id}
                title={formation.nom}
                category={formation.category}
                details={[
                    {
                      icon: CalendarDays,
                      value: formation.date,
                    },
                    {
                      icon: UserRound,
                      value: formation.formateur,
                    },
                    {
                      icon: MapPin,
                      value: formation.lieu,
                    },
                  ]}
                  to={`/formations/${formation.id}`}
                />
              ))
            ) : (
              <div className={styles.emptyState}>
                <Search size={28} />

                <h2>Aucune formation trouvée</h2>

                <p>
                  Essayez avec un autre terme de recherche.
                </p>
              </div>
            )}
          </div>
        </section>

      </div>
    </PageShell>
  );
};

export default FormationsPage;