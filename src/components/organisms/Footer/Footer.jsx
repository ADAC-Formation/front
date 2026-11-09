import { Link } from 'react-router'
import styles from './Footer.module.css'

// Pied de page de toute l'application, connexion comprise : les mentions légales doivent être
// lisibles avant de se connecter.
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Link to="/mentions-legales" className={styles.link}>
        Mentions légales et confidentialité
      </Link>
    </footer>
  )
}
