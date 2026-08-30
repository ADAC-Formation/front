
import { ArrowLeft, Upload } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import styles from "./CreateFormationPage.module.css";
import categories from "../../../utils/categories";

const CreateFormationPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: "",
    ref: "",
    category: "",
    public: "",
    dateValue: "",
    formateur: "",
    lieu: "",
    modalite: "",
    documents: [],
  });

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    console.log("Nouvelle formation :", formData);
  };

  return (
    <main className={styles.container}>
      <button
        type="button"
        className={styles.back}
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <header className={styles.header}>
        <h1 className={styles.title}>
          Créer une nouvelle formation
        </h1>

        <p className={styles.intro}>
          Renseignez les informations nécessaires pour créer une
          nouvelle formation.
        </p>
      </header>

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>

          {/* ---------- Informations générales ---------- */}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Informations générales
            </h2>

            <p className={styles.sectionDescription}>
              Les informations principales de la formation.
            </p>

            <div className={styles.formGrid}>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="nom">
                  Nom de la formation
                </label>

                <input
                  id="nom"
                  name="nom"
                  type="text"
                  placeholder="Ex. Développer l'estime et la confiance en soi"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="ref">
                  Référence
                </label>

                <input
                  id="ref"
                  name="ref"
                  type="text"
                  placeholder="Ex. ES01"
                  value={formData.ref}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="public">
                  Public
                </label>

                <input
                  id="public"
                  name="public"
                  type="text"
                  placeholder="Ex. Travailleurs sociaux"
                  value={formData.public}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="category">
                  Catégorie
                </label>

                <div className={styles.categoryRow}>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Sélectionner une catégorie
                    </option>
                    
                    {categories.map((category) => (
                      <option
                        key={category.name}
                        value={category.name}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setIsCreatingCategory(true)}
                  >
                    + Créer une catégorie
                  </button>
                </div>

                {isCreatingCategory && (
                  <div className={styles.newCategory}>
                    <div className={styles.field}>
                      <label htmlFor="newCategory">
                        Nom de la catégorie
                      </label>

                      <input
                        id="newCategory"
                        type="text"
                        placeholder="Nom de la nouvelle catégorie"
                      />
                    </div>

                    <div className={styles.colorField}>
                      <label htmlFor="categoryColor">
                        Couleur
                      </label>

                      <input
                        id="categoryColor"
                        className={styles.colorInput}
                        type="color"
                        defaultValue="#cc3d34"
                      />
                    </div>

                    <div className={styles.newCategoryActions}>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => setIsCreatingCategory(false)}
                      >
                        Annuler
                      </button>

                      <button
                        type="button"
                        className={styles.submitButton}
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>


          {/* ---------- Organisation ---------- */}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Organisation
            </h2>

            <p className={styles.sectionDescription}>
              Les informations pratiques concernant la formation.
            </p>

            <div className={styles.formGrid}>

              <div className={styles.field}>
                <label htmlFor="dateValue">
                  Date
                </label>

                <input
                  id="dateValue"
                  name="dateValue"
                  type="date"
                  value={formData.dateValue}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="formateur">
                  Formateur
                </label>

                <input
                  id="formateur"
                  name="formateur"
                  type="text"
                  placeholder="Ex. Marie Dupont"
                  value={formData.formateur}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="lieu">
                  Lieu
                </label>

                <input
                  id="lieu"
                  name="lieu"
                  type="text"
                  placeholder="Ex. Paris"
                  value={formData.lieu}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="modalite">
                  Modalité
                </label>

                <select
                  id="modalite"
                  name="modalite"
                  value={formData.modalite}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Sélectionner une modalité
                  </option>

                  <option value="Visio">
                    Visio
                  </option>

                  <option value="Présentiel">
                    Présentiel
                  </option>

                  <option value="Mixte">
                    Mixte
                  </option>
                </select>
              </div>
            </div>
          </section>


          {/* ---------- Documents ---------- */}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Documents
            </h2>

            <p className={styles.sectionDescription}>
              Ajoutez les documents associés à cette formation.
              Cette étape est facultative.
            </p>

            <div className={styles.documents}>
              <label
                htmlFor="documents"
                className={styles.dropZone}
              >
                <Upload size={28} />

                <p className={styles.dropZoneTitle}>
                  Déposer vos fichiers ici
                </p>

                <p className={styles.dropZoneDescription}>
                  ou cliquez pour parcourir vos fichiers
                </p>

                <input
                  id="documents"
                  className={styles.fileInput}
                  type="file"
                  multiple
                  onChange={(event) => {
                    setFormData((currentData) => ({
                      ...currentData,
                      documents: Array.from(event.target.files),
                    }));
                  }}
                />
              </label>
            </div>
          </section>


          {/* ---------- Actions ---------- */}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => navigate(-1)}
            >
              Annuler
            </button>

            <button
              type="submit"
              className={styles.submitButton}
            >
              Créer la formation
            </button>
          </div>

        </form>
      </div>
    </main>
  );
};

export default CreateFormationPage;

