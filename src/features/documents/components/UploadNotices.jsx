import Alert from '../../../components/atoms/Alert/Alert'
import styles from './Documents.module.css'

const sentLabel = (count) => `${count} document${count > 1 ? 's' : ''} envoyé${count > 1 ? 's' : ''}`

// Résultat d'un dépôt (G4) : succès annoncé (`role="status"`) et fichiers refusés listés avec leur nom
// (`role="alert"`). `result` : { uploaded, rejections: [{ name, message }] } de `useUploadDocuments`.
// Commun à la section de la formation (027) et à celle du stagiaire (028) ; tout est rendu en texte.
const UploadNotices = ({ result }) => (
  <>
    {result?.uploaded > 0 && <Alert variant="success">{sentLabel(result.uploaded)}</Alert>}
    {result?.rejections.length > 0 && (
      <div role="alert" className={styles.rejections}>
        <p>Fichiers non envoyés :</p>
        <ul>
          {result.rejections.map(({ name, message }, index) => (
            <li key={`${index}-${name}`}>{`${name} : ${message}`}</li>
          ))}
        </ul>
      </div>
    )}
  </>
)

export default UploadNotices
