import { useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import { PageShell } from '../../../templates/PageShell/PageShell'
import CategoryFormDialog from '../components/CategoryFormDialog'
import { useCategories, useCreateCategory, useSetCategoryActive, useUpdateCategory } from '../hooks'
import styles from './CategoryManagement.module.css'

const NOT_FOUND = 404

// Boîte de création : une instance par ouverture, donc ni erreur ni saisie d'une fois sur l'autre.
const CreateCategoryDialog = ({ onDone, onCancel }) => {
  const create = useCreateCategory()
  return (
    <CategoryFormDialog
      error={create.error?.message}
      isPending={create.isPending}
      onCancel={onCancel}
      onSubmit={(request) => create.mutate(request, { onSuccess: () => onDone('Catégorie créée') })}
    />
  )
}

const EditCategoryDialog = ({ category, onDone, onCancel }) => {
  const queryClient = useQueryClient()
  const update = useUpdateCategory(category.id)
  return (
    <CategoryFormDialog
      category={category}
      error={update.error?.message}
      isPending={update.isPending}
      onCancel={onCancel}
      onSubmit={(request) =>
        update.mutate(request, {
          onSuccess: () => onDone('Catégorie mise à jour'),
          // La catégorie a disparu entre-temps : on recharge la liste, le message reste dans la boîte.
          onError: (error) => {
            if (error.status === NOT_FOUND) queryClient.invalidateQueries({ queryKey: ['categories'] })
          },
        })
      }
    />
  )
}

const DeactivateCategoryDialog = ({ category, onDone, onCancel, onFailed }) => {
  const setActive = useSetCategoryActive()
  return (
    <ConfirmDialog
      title={`Désactiver la catégorie « ${category.nom} » ?`}
      confirmLabel="Désactiver"
      disabled={setActive.isPending}
      onCancel={onCancel}
      onConfirm={() =>
        setActive.mutate(
          { id: category.id, active: false },
          { onSuccess: () => onDone('Catégorie désactivée'), onError: (error) => onFailed(error.message) },
        )
      }
    >
      Elle n’apparaîtra plus dans le choix de catégorie d’une formation, mais restera affichée sur les formations
      qui la portent déjà. Vous pourrez la réactiver à tout moment.
    </ConfirmDialog>
  )
}

const CategoryRow = ({ category, onEdit, onDeactivate, onReactivate, busy }) => (
  <li className={styles.category}>
    <div className={styles.categoryInfo}>
      <span
        className={styles.categoryDot}
        data-testid="category-dot"
        aria-hidden="true"
        style={{ backgroundColor: category.couleur }}
      />
      <div>
        <h3>{category.nom}</h3>
        <span className={category.isActive ? styles.activeLabel : styles.inactiveLabel}>
          {category.isActive ? 'Active' : 'Désactivée'}
        </span>
      </div>
    </div>

    <div className={styles.actions}>
      <button
        type="button"
        className={styles.editButton}
        aria-label={`Modifier ${category.nom}`}
        onClick={(event) => onEdit(category, event)}
      >
        <Pencil size={16} aria-hidden="true" />
        Modifier
      </button>

      {category.isActive ? (
        <button
          type="button"
          className={styles.statusButton}
          aria-label={`Désactiver ${category.nom}`}
          onClick={() => onDeactivate(category)}
        >
          Désactiver
        </button>
      ) : (
        <button
          type="button"
          className={styles.statusButton}
          aria-label={`Réactiver ${category.nom}`}
          disabled={busy}
          onClick={() => onReactivate(category)}
        >
          Réactiver
        </button>
      )}
    </div>
  </li>
)

const CategoryManagementPage = () => {
  const { data, isLoading, isError, error, refetch } = useCategories()
  const reactivate = useSetCategoryActive()
  // Une seule boîte à la fois : null | { kind: 'create' | 'edit' | 'deactivate', category? }.
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState(null)
  const [failure, setFailure] = useState(null)

  const categories = data ?? []
  const count = categories.length

  const open = (next) => {
    setNotice(null)
    setFailure(null)
    setDialog(next)
  }
  const close = () => setDialog(null)
  const done = (message) => {
    setDialog(null)
    setNotice(message)
  }
  const failed = (message) => {
    setDialog(null)
    setFailure(message)
  }

  const handleReactivate = (category) => {
    setNotice(null)
    setFailure(null)
    reactivate.mutate(
      { id: category.id, active: true },
      { onSuccess: () => setNotice('Catégorie réactivée'), onError: (err) => setFailure(err.message) },
    )
  }

  return (
    <PageShell>
      <BackButton to="/formations" />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Catégories</h1>
          <p className={styles.intro}>Gérez les catégories utilisées pour classer les formations.</p>
        </div>

        <button type="button" className={styles.createButton} onClick={() => open({ kind: 'create' })}>
          Créer une catégorie
        </button>
      </div>

      {notice && <Alert variant="success">{notice}</Alert>}
      {failure && <Alert variant="error">{failure}</Alert>}

      <section className={styles.card} aria-labelledby="categories-title">
        <div className={styles.cardHeader}>
          <h2 id="categories-title">Catégories disponibles</h2>
          {data && (
            <p>
              {count} catégorie{count > 1 && 's'}
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

        {data && count === 0 && <p className={styles.empty}>Aucune catégorie pour le moment.</p>}

        {count > 0 && (
          <ul className={styles.list} aria-label="Catégories">
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                busy={reactivate.isPending}
                onEdit={(target) => open({ kind: 'edit', category: target })}
                onDeactivate={(target) => open({ kind: 'deactivate', category: target })}
                onReactivate={handleReactivate}
              />
            ))}
          </ul>
        )}
      </section>

      {dialog?.kind === 'create' && <CreateCategoryDialog onDone={done} onCancel={close} />}
      {dialog?.kind === 'edit' && <EditCategoryDialog category={dialog.category} onDone={done} onCancel={close} />}
      {dialog?.kind === 'deactivate' && (
        <DeactivateCategoryDialog category={dialog.category} onDone={done} onFailed={failed} onCancel={close} />
      )}
    </PageShell>
  )
}

export default CategoryManagementPage
