import { Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { deadlineLabel, formatsLabel, scopeLabel, sortByName } from '../documentTypeLabels'
import { useDocumentTypes, useSetDocumentTypeActive } from '../hooks'
import styles from './DocumentTypePages.module.css'

// Confirmations transmises par navigation (`navigate(path, { state: { notice } })`) : rien n'est
// stocké dans le navigateur (D31) ; un rechargement de la page efface le bandeau.
const NAVIGATION_NOTICES = {
  'document-type-created': 'Type de document créé',
  'document-type-updated': 'Type de document mis à jour',
}

const DocumentTypeRow = ({ type, busy, onDeactivate, onReactivate }) => {
  const deadline = deadlineLabel(type)
  return (
    <li className={styles.type}>
      <div className={styles.typeInfo}>
        <h3>{type.nom}</h3>
        <ul className={styles.facts} aria-label={`Détails de ${type.nom}`}>
          <li className={styles.strong}>{type.isRequired ? 'Obligatoire' : 'Facultatif'}</li>
          {type.isSensitive && <li className={styles.strong}>Sensible</li>}
          <li>{scopeLabel(type)}</li>
          {deadline && <li>{deadline}</li>}
          {type.allowedFormats?.length > 0 && <li>{formatsLabel(type.allowedFormats)}</li>}
          <li className={styles.strong}>{type.isActive ? 'Actif' : 'Désactivé'}</li>
        </ul>
      </div>

      <div className={styles.actions}>
        <Link
          className={styles.editLink}
          to={`/admin/documents/${type.id}/modifier`}
          aria-label={`Modifier ${type.nom}`}
        >
          <Pencil size={16} aria-hidden="true" />
          Modifier
        </Link>

        {type.isActive ? (
          <button
            type="button"
            className={styles.statusButton}
            aria-label={`Désactiver ${type.nom}`}
            onClick={() => onDeactivate(type)}
          >
            Désactiver
          </button>
        ) : (
          <button
            type="button"
            className={styles.statusButton}
            aria-label={`Réactiver ${type.nom}`}
            disabled={busy}
            onClick={() => onReactivate(type)}
          >
            Réactiver
          </button>
        )}
      </div>
    </li>
  )
}

// `/admin/documents` : catalogue des types de document, réservé à la chargée de formation.
const DocumentTypeListPage = () => {
  const { state } = useLocation()
  const { data, isLoading, isError, error, refetch } = useDocumentTypes()
  const setActive = useSetDocumentTypeActive()
  const [toDeactivate, setToDeactivate] = useState(null)
  const [notice, setNotice] = useState(NAVIGATION_NOTICES[state?.notice] ?? null)
  const [failure, setFailure] = useState(null)

  const types = useMemo(() => sortByName(data ?? []), [data])

  const reset = () => {
    setNotice(null)
    setFailure(null)
  }

  const deactivate = () => {
    const type = toDeactivate
    setToDeactivate(null)
    reset()
    setActive.mutate(
      { id: type.id, active: false },
      { onSuccess: () => setNotice('Type de document désactivé'), onError: (err) => setFailure(err.message) },
    )
  }

  const reactivate = (type) => {
    reset()
    setActive.mutate(
      { id: type.id, active: true },
      { onSuccess: () => setNotice('Type de document réactivé'), onError: (err) => setFailure(err.message) },
    )
  }

  return (
    <PageShell className={styles.page}>
      <BackButton to="/admin/gestion" />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Types de document</h1>
          <p className={styles.intro}>
            Le catalogue des pièces que les stagiaires fournissent. Les changements s’appliquent aux formations en
            cours.
          </p>
        </div>

        <Link className={styles.createButton} to="/admin/documents/nouveau">
          Nouveau type
        </Link>
      </div>

      <div className={styles.notices}>
        {notice && <Alert variant="success">{notice}</Alert>}
        {failure && <Alert variant="error">{failure}</Alert>}
      </div>

      <section className={styles.card} aria-labelledby="document-types-title">
        <div className={styles.cardHeader}>
          <h2 id="document-types-title">Types disponibles</h2>
          {data && (
            <p>
              {types.length} type{types.length > 1 && 's'} de document
            </p>
          )}
        </div>

        {isLoading && <p role="status">Chargement…</p>}

        {isError && (
          <div className={styles.errorState}>
            <Alert variant="error">{error.message}</Alert>
            <button type="button" className={styles.statusButton} onClick={() => refetch()}>
              Réessayer
            </button>
          </div>
        )}

        {data && types.length === 0 && <p className={styles.empty}>Aucun type de document pour le moment</p>}

        {types.length > 0 && (
          <ul className={styles.list} aria-label="Types de document">
            {types.map((type) => (
              <DocumentTypeRow
                key={type.id}
                type={type}
                busy={setActive.isPending}
                onDeactivate={(target) => {
                  reset()
                  setToDeactivate(target)
                }}
                onReactivate={reactivate}
              />
            ))}
          </ul>
        )}
      </section>

      {toDeactivate && (
        <ConfirmDialog
          title={`Désactiver le type « ${toDeactivate.nom} » ?`}
          confirmLabel="Désactiver"
          onCancel={() => setToDeactivate(null)}
          onConfirm={deactivate}
        >
          Ce changement s’applique aux formations en cours. Vous pourrez réactiver le type à tout moment.
        </ConfirmDialog>
      )}
    </PageShell>
  )
}

export default DocumentTypeListPage
