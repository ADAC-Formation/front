import {
  CalendarDays,
  UserRound,
  MapPin,
  UsersRound,
} from "lucide-react";
import { useParams } from "react-router";
import categories from "../../../utils/categories";
import formations from "../../../utils/simFormations";
import BackButton from "../../molecules/BackButton/BackButton";
import styles from "./FormationDetails.module.css";
import { PageShell } from "../../../templates/PageShell/PageShell";

const FormationDetails = () => {
  const { formationId } = useParams();

  const formation = formations.find(
    (formation) => formation.id === Number(formationId)
  );

  if (!formation) {
    return (
      <PageShell>
        <h1>Formation introuvable</h1>
      </PageShell>
    );
  }

const category = categories.find(
  (item) => item.name === formation.category
);

  return (
    <PageShell>
      <BackButton to="/formations">Retour aux formations</BackButton>

      <article
        className={styles.card}
        style={{
            "--category-color": category?.color,
        }}
        >
        <div className={styles.category}>
          {formation.category}
        </div>

        <h1 className={styles.title}>
          {formation.nom}
        </h1>

        <p className={styles.reference}>
          Référence : {formation.ref}
        </p>

        <div className={styles.divider} />

        <div className={styles.details}>
          <div className={styles.detail}>
            <CalendarDays size={22} />

            <div>
              <span>Date</span>
              <strong>{formation.date}</strong>
            </div>
          </div>

          <div className={styles.detail}>
            <UserRound size={22} />

            <div>
              <span>Formateur</span>
              <strong>{formation.formateur}</strong>
            </div>
          </div>

          <div className={styles.detail}>
            <MapPin size={22} />

            <div>
              <span>Lieu</span>
              <strong>{formation.lieu}</strong>
            </div>
          </div>

          <div className={styles.detail}>
            <UsersRound size={22} />

            <div>
              <span>Public</span>
              <strong>{formation.public}</strong>
            </div>
          </div>
        </div>
      </article>
    </PageShell>
  );
};

export default FormationDetails;