import BackButton from '../../../components/molecules/BackButton/BackButton'
import { PageShell } from '../../../templates/PageShell/PageShell'
import LegalValue from '../components/LegalValue'
import { LEGAL_INFO } from '../legalInfo'
import styles from './LegalPage.module.css'

const Fact = ({ label, children }) => (
  <>
    <dt>{label}</dt>
    <dd>
      <LegalValue>{children}</LegalValue>
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

          <section aria-labelledby="controller-heading">
            <h3 id="controller-heading" className={styles.subheading}>
              Responsable du traitement
            </h3>
            <dl className={styles.facts}>
              <Fact label="Association">
                {info.name}, {info.address}
              </Fact>
              <Fact label="Contact pour vos données personnelles">{info.privacyContact}</Fact>
              <Fact label="Base légale">{info.legalBasis}</Fact>
            </dl>
          </section>

          <h3 className={styles.subheading}>Finalités</h3>
          <ul className={styles.list}>
            <li>Gérer les formations, les inscriptions et le suivi des stagiaires.</li>
            <li>Recevoir et conserver les documents demandés pour les formations.</li>
            <li>Permettre les échanges sur le portail : messagerie et notifications.</li>
            <li>
              Envoyer les e-mails du portail (activation du compte, réinitialisation du mot de passe, notifications). Ils
              font partie du suivi des formations et ne peuvent pas être désactivés.
            </li>
          </ul>

          <h3 className={styles.subheading}>Données traitées</h3>
          <ul className={styles.list}>
            <li>Votre compte : nom, prénom, adresse e-mail et rôle.</li>
            <li>Vos inscriptions aux formations.</li>
            <li>Les documents que vous déposez.</li>
            <li>Vos messages et vos notifications.</li>
          </ul>

          <h3 className={styles.subheading}>Destinataires</h3>
          <p className={styles.text}>
            Seules les personnes qui en ont besoin accèdent à vos données : l’équipe de l’ADAC et les formateurs
            concernés. Les prestataires techniques du portail (hébergement, stockage des documents, envoi des e-mails)
            les traitent pour le compte de l’ADAC. Vos données ne sont ni vendues ni cédées.
          </p>

          <h3 className={styles.subheading}>Durée de conservation</h3>
          <p className={styles.text}>
            Durée de conservation des données : <LegalValue>{info.retention}</LegalValue>
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
            Conformément au règlement général sur la protection des données (RGPD) et à la loi « Informatique et
            libertés », vous disposez d’un droit d’accès, de rectification et d’effacement de vos données, d’un droit à
            la limitation de leur traitement, d’un droit d’opposition et d’un droit à la portabilité. Vous pouvez aussi
            définir des directives sur le sort de vos données après votre décès. Pour exercer ces droits, écrivez au
            contact pour vos données personnelles (voir « Responsable du traitement »).
          </p>

          <h3 className={styles.subheading}>Réclamation</h3>
          <p className={styles.text}>
            Si vous estimez, après avoir contacté l’ADAC, que vos droits ne sont pas respectés, vous pouvez adresser une
            réclamation à la CNIL, en ligne sur{' '}
            <a className={styles.link} href="https://www.cnil.fr/plaintes">
              www.cnil.fr/plaintes
            </a>{' '}
            ou par courrier : CNIL, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
          </p>
        </section>
      </div>
    </PageShell>
  )
}

export default LegalPage
