import { Download, File, FileImage, FileText, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { documentKind, formatDocumentDate, formatFileSize } from '../documentFiles'
import styles from './Documents.module.css'

const ICONS = { PDF: FileText, Word: FileText, Image: FileImage }

const senderLabel = (uploadedBy) =>
  uploadedBy ? `Envoyé par ${uploadedBy.prenom} ${uploadedBy.nom}` : 'Expéditeur inconnu'

// Liste de documents (formation, 027 ; inscription du stagiaire, 028). `showSender` : nom de
// l'expéditeur (faux pour le stagiaire, qui ne voit que ses envois) ; sans `canDelete`, aucun
// « Supprimer » ; sans `onDownload`, aucun « Télécharger » (résumé du profil, G16). `locationOf(document)` :
// `{ to, label }` pour écrire « Déposé dans <lien> » sous le document, ou rien. Le nom du fichier est rendu en texte (jamais en HTML) ; le type est écrit en toutes
// lettres à côté de l'icône ; l'e-mail de l'expéditeur et `fileUrl` ne sont jamais affichés. Les
// boutons sont nommés avec le fichier (« Télécharger cours.pdf »).
const DocumentList = ({
  documents,
  canDelete = () => false,
  onDownload = null,
  onDelete,
  locationOf = () => null,
  downloadingId = null,
  showSender = true,
}) => (
  <ul className={styles.list}>
    {documents.map((document) => {
      const kind = documentKind(document.fileName)
      const Icon = ICONS[kind] ?? File
      const sender = showSender ? senderLabel(document.uploadedBy) : null
      const location = locationOf(document)
      return (
        <li key={document.id} className={styles.item}>
          <Icon className={styles.icon} size={22} aria-hidden="true" />
          <div className={styles.info}>
            <p className={styles.fileName}>{document.fileName}</p>
            <p className={styles.meta}>
              {[kind, formatFileSize(document.fileSize), formatDocumentDate(document.createdAt), sender]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {location && (
              <p className={styles.meta}>
                Déposé dans <Link to={location.to}>{location.label}</Link>
              </p>
            )}
          </div>
          <div className={styles.itemActions}>
            {onDownload && (
              <button
                type="button"
                className={styles.actionButton}
                aria-label={`Télécharger ${document.fileName}`}
                disabled={downloadingId === document.id}
                onClick={() => onDownload(document)}
              >
                <Download size={16} aria-hidden="true" />
                Télécharger
              </button>
            )}
            {canDelete(document) && (
              <button
                type="button"
                className={styles.actionButton}
                aria-label={`Supprimer ${document.fileName}`}
                onClick={() => onDelete(document)}
              >
                <Trash2 size={16} aria-hidden="true" />
                Supprimer
              </button>
            )}
          </div>
        </li>
      )
    })}
  </ul>
)

export default DocumentList
