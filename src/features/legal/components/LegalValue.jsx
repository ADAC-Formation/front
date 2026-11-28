import styles from './LegalValue.module.css'

export const PENDING = 'À renseigner par l’ADAC'

// Valeur fournie par l'ADAC (`LEGAL_INFO`), ou mention visible tant qu'elle manque : jamais de texte inventé (D65).
// Partagée par la page des mentions légales et le profil (« Mes données personnelles », NOTES-04).
const LegalValue = ({ children }) => (children ? children : <span className={styles.pending}>{PENDING}</span>)

export default LegalValue
