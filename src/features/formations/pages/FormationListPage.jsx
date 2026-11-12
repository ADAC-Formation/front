import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CalendarDays, MapPin, Search, UserRound, UsersRound } from 'lucide-react'
import Alert from '../../../components/atoms/Alert/Alert'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import ListItem from '../../../components/molecules/ListItem/ListItem'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { MANAGEMENT_ROLES, ROLES } from '../../../utils/roles'
import { useCurrentUser } from '../../auth/hooks'
import { useCategories } from '../../categories/hooks'
import FormationNotice from '../components/FormationNotice'
import { formatDateRange, formateurName, modaliteLabel } from '../formationLabels'
import { useFormations } from '../hooks'
import { SORT_OPTIONS, filterFormations, sortFormations } from '../listView'
import styles from './FormationPages.module.css'

const STATUS_FILTERS = [
  { value: 'ACTIVE', label: 'Actives', color: 'var(--color-green)' },
  { value: 'ARCHIVED', label: 'Archivées', color: 'var(--color-grey)' },
]

const SCOPE_FILTERS = [
  { value: 'mine', label: 'Mes formations', color: 'var(--color-soft-orange)' },
  { value: 'all', label: 'Toutes', color: 'var(--color-soft-orange)' },
]

const inscritsLabel = (count) => `${count} inscrit${count > 1 ? 's' : ''}`

const RadioPills = ({ legend, name, filters, value, onChange }) => (
  <fieldset className={styles.filters}>
    <legend className={styles.srOnly}>{legend}</legend>
    {filters.map(({ value: optionValue, label, color }) => (
      <label key={optionValue} className={styles.pill} style={{ '--pill-color': color }}>
        <input
          type="radio"
          name={name}
          value={optionValue}
          checked={value === optionValue}
          onChange={() => onChange(optionValue)}
        />
        <span className={styles.pillDot} aria-hidden="true" />
        {label}
      </label>
    ))}
  </fieldset>
)

// Liste des formations selon le rôle. Le back renvoie le périmètre du rôle ; recherche, tri et
// « Mes formations / Toutes » (formateur, D46) se font côté client sur la liste reçue (F2, F5).
const FormationListPage = () => {
  const { user } = useCurrentUser()
  const isManager = MANAGEMENT_ROLES.includes(user?.role)
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const isFormateur = user?.role === ROLES.ADMIN
  const isStagiaire = user?.role === ROLES.STAGIAIRE
  // « disponibles » laissait croire au stagiaire qu'il pouvait s'inscrire (NOTES-02) : ce sont ses formations.
  const activeCardTitle = isStagiaire ? 'Mes formations' : 'Formations disponibles'

  const [status, setStatus] = useState('ACTIVE')
  const [scope, setScope] = useState('mine')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [categoryId, setCategoryId] = useState('')

  const { data, isLoading, isError, error, refetch } = useFormations({ status })
  // Filtre par catégorie (C7) : chargée de formation et formateur ; toutes les catégories, car une
  // formation peut porter une catégorie désactivée.
  const canFilterByCategory = isManager
  const categories = useCategories({ enabled: canFilterByCategory })

  const formations = useMemo(() => {
    const formateurId = isFormateur && scope === 'mine' ? user.id : null
    const category = categoryId === '' ? null : Number(categoryId)
    return sortFormations(filterFormations(data ?? [], { search, formateurId, categoryId: category }), sortBy)
  }, [data, search, sortBy, scope, categoryId, isFormateur, user])

  const count = formations.length
  const isEmptyList = !isLoading && !isError && (data ?? []).length === 0
  const hasNoMatch = !isLoading && !isError && !isEmptyList && count === 0

  return (
    <PageShell className={styles.page}>
      <BackButton to={isManager ? '/admin/gestion' : '/'} />

      <div className={styles.header}>
        <h1 className={styles.title}>{isStagiaire ? 'Mes formations' : 'Formations'}</h1>

        {isSuperAdmin && (
          <div className={styles.headerActions}>
            <Link to="/formations/creer" className={styles.createButton}>
              Créer une nouvelle formation
            </Link>
            <Link to="/formations/categories" className={styles.createButton}>
              Gérer les catégories
            </Link>
          </div>
        )}
      </div>

      <p className={styles.intro}>
        {isStagiaire
          ? 'Retrouvez vos formations et toutes les informations nécessaires.'
          : 'Consultez les formations disponibles et retrouvez toutes les informations nécessaires.'}
      </p>

      <section className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            aria-label="Rechercher une formation"
            placeholder="Rechercher une formation…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {canFilterByCategory && (
          <div className={styles.sortContainer}>
            <label htmlFor="categorie-formations">Catégorie</label>
            <select id="categorie-formations" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">Toutes les catégories</option>
              {(categories.data ?? []).map(({ id, nom }) => (
                <option key={id} value={String(id)}>
                  {nom}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.sortContainer}>
          <label htmlFor="tri-formations">Organiser par :</label>
          <select id="tri-formations" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <RadioPills legend="Statut" name="statut-formations" filters={STATUS_FILTERS} value={status} onChange={setStatus} />

      {isFormateur && (
        <RadioPills legend="Périmètre" name="perimetre-formations" filters={SCOPE_FILTERS} value={scope} onChange={setScope} />
      )}

      <div className={styles.notices}>
        <FormationNotice />
      </div>

      <section className={styles.card}>
        {isLoading && <p role="status">Chargement…</p>}

        {isError && (
          <div className={styles.errorBox}>
            <Alert variant="error">{error.message}</Alert>
            <button type="button" className={styles.submitButton} onClick={() => refetch()}>
              Réessayer
            </button>
          </div>
        )}

        {isEmptyList && (
          <div className={styles.emptyState}>
            <h2>Aucune formation</h2>
          </div>
        )}

        {hasNoMatch && (
          <div className={styles.emptyState}>
            <Search size={28} aria-hidden="true" />
            <h2>Aucune formation trouvée</h2>
            <p>Essayez avec un autre terme de recherche ou un autre filtre.</p>
          </div>
        )}

        {count > 0 && (
          <>
            <div className={styles.cardHeader}>
              <h2>{status === 'ARCHIVED' ? 'Formations archivées' : activeCardTitle}</h2>
              <p>{`${count} formation${count > 1 ? 's' : ''}`}</p>
            </div>

            <div className={styles.list}>
              {formations.map((formation) => (
                <ListItem
                  key={formation.id}
                  title={formation.intitule}
                  category={formation.category.nom}
                  categoryColor={formation.category.couleur}
                  badge={formation.status === 'ARCHIVED' ? 'Archivée' : undefined}
                  details={[
                    { icon: CalendarDays, value: formatDateRange(formation.dateDebut, formation.dateFin) },
                    { icon: UserRound, value: formateurName(formation.formateur) },
                    { icon: MapPin, value: modaliteLabel(formation.modalite) },
                    ...(isManager ? [{ icon: UsersRound, value: inscritsLabel(formation.inscriptionsCount) }] : []),
                  ]}
                  to={`/formations/${formation.id}`}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </PageShell>
  )
}

export default FormationListPage
