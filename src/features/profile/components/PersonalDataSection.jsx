import { Link } from 'react-router'
import LegalValue from '../../legal/components/LegalValue'
import { LEGAL_INFO } from '../../legal/legalInfo'
import styles from './ProfileSections.module.css'

// « Mes données personnelles » (NOTES-04, P7) : résumé RGPD pour tous les rôles. Le texte complet est sur la page
// publique des mentions légales (D65) ; le contact vient de `LEGAL_INFO` et n'est jamais inventé.
const PersonalDataSection = ({ className }) => (
  <section className={className} aria-labelledby="profile-data-title">
    <h2 id="profile-data-title">Mes données personnelles</h2>
    <p className={styles.text}>
      Les e-mails du portail (formations, documents, messages) vous sont toujours envoyés : ils font partie du suivi
      des formations.
    </p>
    <p className={styles.text}>
      Vous pouvez demander l’accès à vos données, leur rectification, leur effacement ou la limitation de leur
      traitement, vous opposer à ce traitement et demander la portabilité de vos données.
    </p>
    <dl className={styles.info}>
      <dt>Contact pour vos données personnelles</dt>
      <dd>
        <LegalValue>{LEGAL_INFO.privacyContact}</LegalValue>
      </dd>
    </dl>
    <p className={styles.text}>
      <Link to="/mentions-legales" className={styles.link}>
        Tout savoir sur vos données personnelles
      </Link>
    </p>
  </section>
)

export default PersonalDataSection
