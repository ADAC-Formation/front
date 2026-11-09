import BackButton from '../../../components/molecules/BackButton/BackButton'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { LEGAL_INFO } from '../legalInfo'
import styles from './LegalPage.module.css'

const PENDING = 'À renseigner par l’ADAC'

// Valeur fournie par l'ADAC, ou mention visible tant qu'elle manque (jamais de texte inventé).
const Value = ({ children }) => (children ? children : <span className={styles.pending}>{PENDING}</span>)

const Fact = ({ label, children }) => (
  <>
    <dt>{label}</dt>
    <dd>
      <Value>{children}</Value>
    </dd>
  </>
)

// Page publique : lisible sans session (un visiteur de la page de connexion doit pouvoir la lire).
const LegalPage = () => {
  const info = LEGAL_INFO
  return (
    <PageShell>
      <div className={styles.content}>
        <BackButton to="/" />
        <h1 className={styles.title}>Mentions légales et confidentialité</h1>

        <section className={styles.section} aria-labelledby="legal-heading">
          <h2 id="legal-heading" className={styles.heading}>
            Mentions légales
          </h2>

          <section aria-labelledby="publisher-heading">
            <h3 id="publisher-heading" className={styles.subheading}>
              Éditeur du portail
            </h3>
            <dl className={styles.facts}>
              <Fact label="Association">{info.name}</Fact>
              <Fact label="Adresse">{info.address}</Fact>
              <Fact label="E-mail">
                {info.email && (
                  <a className={styles.link} href={`mailto:${info.email}`}>
                    {info.email}
                  </a>
                )}
              </Fact>
              <Fact label="Téléphone">{info.phone}</Fact>
              <Fact label="SIRET">{info.siret}</Fact>
              <Fact label="Numéro de déclaration d’activité">{info.activityDeclaration}</Fact>
              <Fact label="Directeur ou directrice de la publication">{info.publicationDirector}</Fact>
            </dl>
          </section>

          <h3 className={styles.subheading}>Hébergement</h3>
          <dl className={styles.facts}>
            <Fact label="Hébergeur">{info.host}</Fact>
          </dl>
        </section>

        <section className={styles.section} aria-labelledby="privacy-heading">
          <h2 id="privacy-heading" className={styles.heading}>
            Confidentialité
          </h2>

          <p className={styles.text}>
            Ce portail sert à publier les formations de l’ADAC, à déposer des documents et à échanger entre la chargée
            de formation, les formateurs et les stagiaires. Il ne collecte que ce dont ce service a besoin.
          </p>

          <h3 className={styles.subheading}>Données traitées</h3>
          <ul className={styles.list}>
            <li>Votre compte : nom, prénom, adresse e-mail et rôle.</li>
            <li>Vos inscriptions aux formations.</li>
            <li>Les documents que vous déposez.</li>
            <li>Vos messages et vos notifications.</li>
          </ul>

          <h3 className={styles.subheading}>Durée de conservation</h3>
          <p className={styles.text}>
            Durée de conservation des données : <Value>{info.retention}</Value>
          </p>

          <h3 className={styles.subheading}>Ce qui est enregistré dans votre navigateur</h3>
          <ul className={styles.list}>
            <li>
              Un cookie de session, nécessaire à la connexion. Il est inaccessible au code de la page et disparaît à la
              déconnexion.
            </li>
            <li>
              Vos préférences d’affichage (thème, taille du texte, contraste). Elles ne contiennent aucune donnée
              personnelle.
            </li>
            <li>
              Aucun outil d’analyse, aucun traceur publicitaire. Les polices sont hébergées sur le portail : aucune
              adresse IP n’est transmise à un service tiers pour les afficher.
            </li>
          </ul>

          <h3 className={styles.subheading}>Vos droits</h3>
          <p className={styles.text}>
            Vous pouvez demander l’accès à vos données, leur rectification ou leur effacement en écrivant à l’ADAC
            (voir les coordonnées ci-dessus). Vous pouvez aussi saisir la CNIL.
          </p>
        </section>
      </div>
    </PageShell>
  )
}

export default LegalPage
