import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { ACCEPT_ATTRIBUTE } from '../documentFiles'
import styles from './Documents.module.css'

// Zone de dépôt (G4) : glisser-déposer plusieurs fichiers, ou « Choisir des fichiers » (clavier,
// tactile). Elle ne contrôle rien : `onFiles(fichiers)` reçoit un tableau, le contrôle des types et de
// la taille est fait avant envoi (documentFiles). Réutilisable par le dépôt du stagiaire (028).
const DocumentDropzone = ({ onFiles, isPending = false }) => {
  const inputRef = useRef(null)
  const [isOver, setIsOver] = useState(false)

  const send = (fileList) => {
    const files = Array.from(fileList ?? [])
    if (files.length > 0 && !isPending) onFiles(files)
  }

  // Sans `preventDefault`, le navigateur ouvrirait le fichier lâché au lieu de nous le donner.
  const handleDragOver = (event) => {
    event.preventDefault()
    setIsOver(true)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsOver(false)
    send(event.dataTransfer?.files)
  }

  const handleChange = (event) => {
    send(event.target.files)
    event.target.value = '' // permet de choisir à nouveau le même fichier
  }

  return (
    <div
      role="group"
      aria-label="Zone de dépôt de documents"
      className={`${styles.dropzone} ${isOver ? styles.dropzoneOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
    >
      <Upload size={28} aria-hidden="true" />
      <p className={styles.dropzoneTitle}>Glissez-déposez vos fichiers ici</p>
      <p className={styles.dropzoneHint}>PDF, JPG, PNG ou DOCX · 10 Mo au maximum par fichier</p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        className={styles.fileInput}
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleChange}
      />
      <button
        type="button"
        className={styles.actionButton}
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        Choisir des fichiers
      </button>

      {isPending && <p role="status">Envoi en cours…</p>}
    </div>
  )
}

export default DocumentDropzone
