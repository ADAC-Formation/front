import { CircleAlert, CircleCheck, Upload } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import { deadlineLabel, formatsLabel } from '../../documentTypes/documentTypeLabels'
import { ACCEPT_ATTRIBUTE, extensionOf } from '../documentFiles'
import DocumentList from './DocumentList'
import styles from './Documents.module.css'

// Créneau d'un document à envoyer (« Mes documents » du stagiaire) : le nom du type, son aide et son délai,
// puis les fichiers déjà déposés. Rouge (`data-status="missing"`) tant que rien n'est déposé, vert
// (`"sent"`) ensuite ; l'état est aussi écrit (« À envoyer » / « Envoyé »), la couleur ne porte jamais
// seule l'information. `onUpload(type, files)` reçoit les fichiers choisis, déjà contrôlés contre les
// formats du type ; sans lui (formation archivée), aucun dépôt n'est proposé.
const DocumentSlot = ({ type, documents, onUpload, listProps }) => {
  const titleId = useId()
  const inputRef = useRef(null)
  const [error, setError] = useState(null)
  const sent = documents.length > 0
  const formats = type.allowedFormats ?? []
  const deadline = deadlineLabel(type)
  const StatusIcon = sent ? CircleCheck : CircleAlert

  const handleChange = (event) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = '' // permet de choisir à nouveau le même fichier
    if (files.length === 0) return
    if (formats.length > 0 && files.some((file) => !formats.includes(extensionOf(file.name)))) {
      setError(`Ce document accepte seulement : ${formatsLabel(formats)}.`)
      return
    }
    setError(null)
    onUpload(type, files)
  }

  return (
    <div role="group" aria-labelledby={titleId} className={styles.slot} data-status={sent ? 'sent' : 'missing'}>
      <div className={styles.slotHeader}>
        <h4 id={titleId} className={styles.slotTitle}>
          {type.nom}
        </h4>
        <span className={styles.slotStatus}>
          <StatusIcon size={16} aria-hidden="true" />
          {sent ? 'Envoyé' : 'À envoyer'}
        </span>
      </div>

      {type.aide && <p className={styles.slotMeta}>{type.aide}</p>}
      {deadline && <p className={styles.slotMeta}>{deadline}</p>}
      {formats.length > 0 && <p className={styles.slotMeta}>{`Formats : ${formatsLabel(formats)}`}</p>}

      {sent && <DocumentList documents={documents} showSender={false} {...listProps} />}

      {error && <Alert variant="error">{error}</Alert>}

      {onUpload && (
        <div className={styles.slotActions}>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={formats.length > 0 ? formats.map((format) => `.${format}`).join(',') : ACCEPT_ATTRIBUTE}
            className={styles.fileInput}
            aria-label={`Choisir un fichier pour ${type.nom}`}
            tabIndex={-1}
            onChange={handleChange}
          />
          <button type="button" className={styles.actionButton} onClick={() => inputRef.current?.click()}>
            <Upload size={16} aria-hidden="true" />
            {sent ? 'Ajouter un fichier' : 'Envoyer un fichier'}
          </button>
        </div>
      )}
    </div>
  )
}

export default DocumentSlot
